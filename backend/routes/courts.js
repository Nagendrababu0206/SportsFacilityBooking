const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getNear, getCourts, getCourt, createCourt, updateCourt,
  deleteCourt, blockSlot, unblockSlot
} = require('../controllers/courtController');

const router = express.Router();

router.get('/near', getNear);
router.get('/', getCourts);
router.get('/:id', getCourt);
router.post('/', protect, authorize('admin'), createCourt);
router.put('/:id', protect, authorize('admin'), updateCourt);
router.delete('/:id', protect, authorize('admin'), deleteCourt);
router.post('/:id/block', protect, authorize('admin'), blockSlot);
router.delete('/:id/block/:blockId', protect, authorize('admin'), unblockSlot);

module.exports = router;
