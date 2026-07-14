const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Load stadium data once (in a real app, this might be dynamic or from a DB)
const stadiumDataPath = path.join(__dirname, '..', 'data', 'stadium.json');
const stadiumData = JSON.parse(fs.readFileSync(stadiumDataPath, 'utf8'));

router.get('/data', (req, res) => {
    // Return both the stadium data (for crowd visualization) 
    // and the recent fan requests log
    res.json({
        stadiumData,
        recentRequests: req.fanRequestsLog
    });
});

module.exports = router;
