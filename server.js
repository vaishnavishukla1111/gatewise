const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const askRoute = require('./routes/ask');
const volunteerRoute = require('./routes/volunteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve static files (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// In-memory array for fan requests logging (shared state for simplicity)
// In a real application, this would be in a database
const fanRequestsLog = [];

// API Routes
app.use('/api/ask', (req, res, next) => {
    // Inject the shared log array into the request so the ask route can append to it
    req.fanRequestsLog = fanRequestsLog;
    next();
}, askRoute);

app.use('/api/volunteer', (req, res, next) => {
    // Inject the shared log array so the volunteer route can read it
    req.fanRequestsLog = fanRequestsLog;
    next();
}, volunteerRoute);

// Fallback for 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`GateWise Server running on http://localhost:${PORT}`);
    });
}

// Export for testing
module.exports = app;
