const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { MockBooking, MockCourt } = require('../utils/mockDb');
const { protect } = require('../middleware/auth');

// Helpers for active database adapters
const dbBooking = () => process.env.MOCK_DB === 'true' ? MockBooking : Booking;
const dbCourt = () => process.env.MOCK_DB === 'true' ? MockCourt : Court;

// @desc    Get AI Peak Suggestions for a specific sport or court
// @route   GET /api/analytics/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const { courtId } = req.query;
    const courtModel = dbCourt();
    const bookingModel = dbBooking();

    let courts = [];
    if (courtId) {
      const court = await courtModel.findById(courtId);
      if (court) courts = [court];
    } else {
      courts = await courtModel.find({ isActive: true });
    }

    const suggestions = [];
    const allBookings = await bookingModel.find({ status: 'confirmed' });

    const hourSlotStatus = (hour) => {
      if (hour >= 16 && hour < 21) return { label: 'Peak', level: 'High', discount: 0, desc: 'High demand slot. Book in advance.' };
      if ((hour >= 7 && hour < 10) || (hour >= 21 && hour < 22)) return { label: 'Moderate', level: 'Medium', discount: 10, desc: 'Moderate traffic. Good availability.' };
      return { label: 'Off-Peak', level: 'Low', discount: 20, desc: 'Super saver slot! Enjoy 20% discount on simulated rates.' };
    };

    for (const court of courts) {
      const courtIdStr = court._id.toString();
      const courtBookings = allBookings.filter(b => {
        const bCourtId = b.court._id ? b.court._id.toString() : b.court.toString();
        return bCourtId === courtIdStr;
      });
      
      const bookingsByHour = {};
      courtBookings.forEach(b => {
        const hour = parseInt(b.startTime.split(':')[0]);
        bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
      });

      const peakHours = [];
      const offPeakHours = [];
      
      for (let h = 6; h < 22; h++) {
        const timeStr = `${h.toString().padStart(2, '0')}:00`;
        const nextTimeStr = `${(h + 1).toString().padStart(2, '0')}:00`;
        const bookingCount = bookingsByHour[h] || 0;
        
        let status = hourSlotStatus(h);
        if (bookingCount > 3) {
          status = { label: 'Peak (High Usage)', level: 'High', discount: 0, desc: 'Popular hour based on bookings!' };
        }

        const slotInfo = {
          slot: `${timeStr} - ${nextTimeStr}`,
          startHour: h,
          bookingCount,
          ...status
        };

        if (status.label === 'Peak' || status.label.includes('High')) {
          peakHours.push(slotInfo);
        } else {
          offPeakHours.push(slotInfo);
        }
      }

      let bestSlot = offPeakHours[0];
      offPeakHours.forEach(slot => {
        if (slot.bookingCount < (bestSlot ? bestSlot.bookingCount : 999)) {
          bestSlot = slot;
        }
      });

      suggestions.push({
        courtId: court._id,
        courtName: court.name,
        sport: court.sport,
        capacity: court.capacity,
        pricePerHour: court.pricePerHour,
        bestSlotToBook: bestSlot ? bestSlot.slot : '10:00 - 11:00',
        bestSlotDiscount: bestSlot ? bestSlot.discount : 20,
        peakHoursSummary: peakHours.map(p => p.slot),
        offPeakHoursSummary: offPeakHours.map(o => o.slot),
        aiRecommendation: `For ${court.name}, we recommend booking during the ${bestSlot ? bestSlot.label : 'Off-Peak'} slot (${bestSlot ? bestSlot.slot : '10:00 - 11:00'}). You will get a quieter atmosphere and higher availability.`
      });
    }

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get heatmap demand analysis for a court/date range
// @route   GET /api/analytics/heatmap
// @access  Private
router.get('/heatmap', protect, async (req, res) => {
  try {
    const { courtId, date, days = '7' } = req.query;
    const courtModel = dbCourt();
    const bookingModel = dbBooking();

    const targetCourtId = courtId || null;
    const courts = targetCourtId
      ? [await courtModel.findById(targetCourtId)].filter(Boolean)
      : await courtModel.find({ isActive: true });

    const allBookings = await bookingModel.find({ status: 'confirmed' });
    const requestedDate = date || new Date().toISOString().split('T')[0];
    const rangeDays = Math.min(parseInt(days, 10) || 7, 90);
    const historyStart = new Date(requestedDate);
    historyStart.setDate(historyStart.getDate() - rangeDays);
    const historyStartStr = historyStart.toISOString().split('T')[0];

    const analyzeCourt = (court) => {
      const courtIdStr = court._id.toString();
      const targetBookings = allBookings.filter(b => {
        const bCourtId = b.court._id ? b.court._id.toString() : b.court.toString();
        return bCourtId === courtIdStr && b.date >= historyStartStr && b.date <= requestedDate;
      });
      const targetDateBookings = targetBookings.filter(b => b.date === requestedDate);

      const demandByHour = new Array(24).fill(0);
      const bookingDurations = [];
      targetDateBookings.forEach((b) => {
        const startHour = parseInt(b.startTime.split(':')[0], 10);
        const endHour = parseInt(b.endTime.split(':')[0], 10);
        const duration = endHour - startHour;
        for (let h = startHour; h < endHour && h < 24; h++) {
          demandByHour[h] += 1;
        }
        bookingDurations.push({ startHour, duration, endHour });
      });

      const historicalByHour = new Array(24).fill(0);
      targetBookings.forEach((b) => {
        const startHour = parseInt(b.startTime.split(':')[0], 10);
        const endHour = parseInt(b.endTime.split(':')[0], 10);
        for (let h = startHour; h < endHour && h < 24; h++) {
          historicalByHour[h] += 1;
        }
      });

      const nonZeroDemands = demandByHour.filter((d) => d > 0);
      const totalBookingsInWindow = targetDateBookings.length;
      const dataPoints = targetBookings.length;
      const confidence =
        dataPoints < 5 ? 'Low' : dataPoints < 20 ? 'Medium' : 'High';
      const confidenceScore = Math.min(dataPoints / 40, 1);

      const percentile75 = nonZeroDemands.length
        ? nonZeroDemands[Math.floor(nonZeroDemands.length * 0.75)] || 1
        : 1;
      const maxDemand = Math.max(...demandByHour, 1);

      const slots = demandByHour.map((demand, hour) => {
        const historicalDemand = historicalByHour[hour] || 0;
        const ratio = demand / maxDemand;
        const historicalRatio = historicalDemand
          ? demand / historicalDemand
          : demand === 0
          ? 0
          : 1;
        let level = 'Quiet';
        if (ratio >= 0.75 || demand >= percentile75) level = 'High';
        else if (ratio >= 0.3 || demand >= 1) level = 'Moderate';

        const anomaly = historicalByHour[hour] > 0 && historicalRatio > 1.5;
        const belowAverage = historicalByHour[hour] > 0 && historicalRatio < 0.5;

        return {
          hour,
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${(hour + 1).toString().padStart(2, '0')}:00`,
          label: `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}`,
          demand,
          level,
          ratio: Math.round(ratio * 100) / 100,
          historicalAvg: Math.round((historicalDemand / Math.max(rangeDays, 1)) * 100) / 100,
          anomaly,
          belowAverage,
          confidence
        };
      });

      const quietSlots = slots
        .filter((s) => s.level === 'Quiet')
        .map((s) => s.label);
      const moderateSlots = slots
        .filter((s) => s.level === 'Moderate')
        .map((s) => s.label);
      const peakSlots = slots
        .filter((s) => s.level === 'High')
        .map((s) => s.label);

      const bestQuietSlot =
        quietSlots.length > 0
          ? quietSlots.reduce((best, current) => {
              const currSlot = slots.find((s) => s.label === current);
              const bestSlot = slots.find((s) => s.label === best);
              if (!currSlot) return best;
              if (!bestSlot) return current;
              return currSlot.historicalAvg < bestSlot.historicalAvg
                ? current
                : best;
            }, quietSlots[0])
          : null;

      const demandScore = Math.round(
        slots.reduce((sum, s) => sum + s.demand, 0) / (court.capacity || 1)
      );
      const opportunityScore = quietSlots.length
        ? Math.round((quietSlots.length / slots.length) * 100)
        : 0;

      const trends = [];
      if (rangeDays >= 7) {
        const lastWeek = targetBookings.filter((b) => {
          const d = new Date(b.date);
          const ref = new Date(requestedDate);
          ref.setDate(ref.getDate() - 7);
          return b.date > ref.toISOString().split('T')[0];
        }).length;
        const prevWeek = targetBookings.filter((b) => {
          const d = new Date(b.date);
          const ref1 = new Date(requestedDate);
          ref1.setDate(ref1.getDate() - 7);
          const ref2 = new Date(requestedDate);
          ref2.setDate(ref2.getDate() - 14);
          return b.date > ref2.toISOString().split('T')[0] && b.date <= ref1.toISOString().split('T')[0];
        }).length;
        if (prevWeek > 0) {
          const change = ((lastWeek - prevWeek) / prevWeek) * 100;
          trends.push({
            period: 'Week over Week',
            change: Math.round(change),
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
          });
        }
      }

      let recommendation = '';
      if (quietSlots.length > 0) {
        recommendation = `Optimized booking strategy: choose ${quietSlots.length} low-demand window(s) — ${quietSlots.slice(0, 3).join(', ')}${quietSlots.length > 3 ? '...' : ''}. ${
          bestQuietSlot
            ? `Best pick: ${bestQuietSlot}, historically least loaded.`
            : ''
        }`;
      } else if (moderateSlots.length > 0) {
        recommendation = `Demand is concentrated. Moderate windows: ${moderateSlots.slice(0, 3).join(', ')}. No quiet slots available today.`;
      } else {
        recommendation = `Peak load across all slots. Consider nearby courts or alternate dates for better availability.`;
      }

      const insights = [];
      const morningPeak = slots
        .filter((s) => s.hour >= 7 && s.hour < 10)
        .some((s) => s.level === 'High');
      const eveningPeak = slots
        .filter((s) => s.hour >= 17 && s.hour < 21)
        .some((s) => s.level === 'High');
      const lateNightDip = slots
        .filter((s) => s.hour >= 21 && s.hour < 23)
        .every((s) => s.level === 'Quiet');

      if (morningPeak && eveningPeak) {
        insights.push('Double peak pattern detected: morning and evening rush.');
      } else if (eveningPeak) {
        insights.push('Evening peak dominates; early slots may be easier.');
      }
      if (lateNightDip) {
        insights.push('Late night (21:00+) consistently quiet in this dataset.');
      }
      const loadVariance = Math.round(
        (Math.max(...demandByHour) / Math.max(demandScore, 1)) * 100
      );
      if (loadVariance > 300) {
        insights.push('High variance today; some slots are extremely loaded while others are free.');
      }
      if (anomaly) {
        insights.push('Anomaly detected: some slots exceed historical patterns.');
      }
      if (totalBookingsInWindow >= court.capacity * 3) {
        insights.push(`Near-capacity utilization detected: ${totalBookingsInWindow} bookings vs capacity ${court.capacity}.`);
      }

      if (insights.length === 0 && totalBookingsInWindow === 0) {
        insights.push('No bookings yet for this date; strong availability expected.');
      }

      return {
        courtId: court._id,
        courtName: court.name,
        sport: court.sport,
        capacity: court.capacity,
        pricePerHour: court.pricePerHour,
        analysisDate: requestedDate,
        dataConfidence: confidence,
        confidenceScore,
        slots,
        demandScore,
        opportunityScore,
        quietSlots,
        moderateSlots,
        peakSlots,
        bestQuietSlot,
        recommendation,
        insights,
        trends
      };
    };

    const heatmap = courts.map(analyzeCourt);

    res.status(200).json({ success: true, heatmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user's monthly sports booking usage analytics
// @route   GET /api/analytics/usage
// @access  Private
router.get('/usage', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id.toString();
    const bookingModel = dbBooking();
    
    let bookings = await bookingModel.find();
    if (process.env.MOCK_DB === 'true') {
      bookings = bookings.filter(b => {
        const bUserId = b.user._id ? b.user._id.toString() : b.user.toString();
        return bUserId === userId;
      });
    } else {
      bookings = await Booking.find({ user: userId }).populate('court');
    }

    let totalSpend = 0;
    let totalHours = 0;
    let cancelledCount = 0;
    let activeCount = 0;
    let totalRefundsReceived = 0;
    let shortcutBookingsCount = 0;

    const sportUsage = {
      Tennis: 0,
      Basketball: 0,
      Badminton: 0,
      Football: 0,
      Squash: 0,
      Volleyball: 0
    };

    const monthlyTrends = {};

    bookings.forEach(b => {
      if (b.status === 'confirmed') {
        activeCount++;
        totalSpend += b.totalPrice;
        totalHours += b.duration;
        
        if (b.court && b.court.sport) {
          sportUsage[b.court.sport] = (sportUsage[b.court.sport] || 0) + b.duration;
        }

        const monthKey = b.date.substring(0, 7);
        monthlyTrends[monthKey] = (monthlyTrends[monthKey] || 0) + b.totalPrice;
      } else {
        cancelledCount++;
        totalRefundsReceived += b.refundAmount || 0;
      }

      if (b.shortcutUsed) {
        shortcutBookingsCount++;
      }
    });

    const formattedMonthlyTrends = Object.keys(monthlyTrends).sort().map(month => ({
      month,
      spend: monthlyTrends[month]
    }));

    const sportBreakdown = Object.keys(sportUsage).map(sport => ({
      sport,
      hours: sportUsage[sport]
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBookings: bookings.length,
          activeBookings: activeCount,
          cancelledBookings: cancelledCount,
          totalSpend,
          totalHours,
          totalRefundsReceived,
          shortcutBookingsCount
        },
        sportBreakdown,
        monthlyTrends: formattedMonthlyTrends
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
