/**
 * @fileoverview Volunteer dashboard routes
 * Serves stadium crowd data and recent fan requests log.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Load stadium data once (cached by Node.js module system)
const stadiumData = require('../data/stadium.json');

// Limit to 30 requests per minute per IP (higher than /ask since staff dashboards poll/reconnect more)
const volunteerLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: 'Too many requests from this IP, please try again after a minute.' }
});

/**
 * GET /api/volunteer/data
 * Retrieves current stadium data and the latest fan requests.
 * @name get/data
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
router.get('/data', volunteerLimiter, (req, res) => {
    // Return both the stadium data (for crowd visualization) 
    // and the recent fan requests log
    res.json({
        stadiumData,
        recentRequests: req.fanRequestsLog
    });
});

module.exports = router;
