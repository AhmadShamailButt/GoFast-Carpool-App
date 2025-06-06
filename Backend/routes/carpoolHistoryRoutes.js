const express = require('express');
const carpoolHistory = require('../controllers/carpoolHistory');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', authMiddleware, carpoolHistory.getCarpoolHistory);

router.post("/rateRide/:rideId", authMiddleware,carpoolHistory.rateRideAndUpdateDriverRating);
router.get('/:userId/rated-ride-count', carpoolHistory.getDriverRideCount);
module.exports = router;