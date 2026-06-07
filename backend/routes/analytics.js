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
