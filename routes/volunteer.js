/**
 * @fileoverview Volunteer dashboard routes
 * Serves stadium crowd data and recent fan requests log.
 */
const express = require('express');

const router = express.Router();

// Load stadium data once (cached by Node.js module system)
const stadiumData = require('../data/stadium.json');

/**
 * GET /api/volunteer/data
 * Retrieves current stadium data and the latest fan requests.
 * @name get/data
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
router.get('/data', (req, res) => {
    // Return both the stadium data (for crowd visualization) 
    // and the recent fan requests log
    res.json({
        stadiumData,
        recentRequests: req.fanRequestsLog
    });
});

module.exports = router;
