/**
 * @fileoverview Main Express server entry point.
 * Sets up middleware, routing, and shared state.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const askRouter = require('./routes/ask');
const volunteerRouter = require('./routes/volunteer');

const app = express();
const PORT = process.env.PORT || 3000;

// --- NEW CODE: Setup HTTP server and Socket.io ---
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);
io.on('connection', (socket) => {
    console.log('A dashboard client connected');
});
// 

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
    // Inject the shared log array into the request object 
    // This allows the ask route to append new requests without needing a persistent database
    req.fanRequestsLog = fanRequestsLog;
    next();
}, askRouter);

app.use('/api/volunteer', (req, res, next) => {
    // Inject the shared log array so the volunteer route can serve the data to the dashboard
    req.fanRequestsLog = fanRequestsLog;
    next();
}, volunteerRouter);

// Fallback for 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`GateWise Server running on http://localhost:${PORT}`);
    });
}

// Export for testing
module.exports = server;
