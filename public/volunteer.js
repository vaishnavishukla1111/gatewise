document.addEventListener('DOMContentLoaded', () => {

    const stadiumDataContainer = document.getElementById('stadiumDataContainer');
    const requestsLogContainer = document.getElementById('requestsLogContainer');

    let lastDataHash = '';

    async function fetchDashboardData() {
        try {
            const response = await fetch('/api/volunteer/data');
            const data = await response.json();

            // Simple stringify to check if data changed to avoid redundant DOM updates
            const currentDataHash = JSON.stringify(data);
            if (currentDataHash !== lastDataHash) {
                renderStadiumData(data.stadiumData);
                renderRequestsLog(data.recentRequests);
                lastDataHash = currentDataHash;
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    }

    function renderStadiumData(gates) {
        if (!gates || gates.length === 0) {
            stadiumDataContainer.innerHTML = '<p>No data available</p>';
            return;
        }

        stadiumDataContainer.innerHTML = gates.map(gate => {
            let colorClass = 'low';
            if (gate.crowdLevelPercentage > 80) colorClass = 'high';
            else if (gate.crowdLevelPercentage > 50) colorClass = 'medium';

            return `
                <div class="gate-card">
                    <div class="gate-header">
                        <span class="gate-name">${gate.name}</span>
                        <span>${gate.crowdLevelPercentage}% Capacity</span>
                    </div>
                    <div class="crowd-bar-bg">
                        <div class="crowd-bar-fill ${colorClass}" style="width: ${gate.crowdLevelPercentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderRequestsLog(logs) {
        if (!logs || logs.length === 0) {
            requestsLogContainer.innerHTML = '<p style="color: var(--text-muted)">No recent requests.</p>';
            return;
        }

        requestsLogContainer.innerHTML = logs.map(log => {
            const timeString = new Date(log.timestamp).toLocaleTimeString();
            return `
                <div class="log-item">
                    <div class="log-time">${timeString} • ${log.language}</div>
                    <div class="log-content">
                        <strong>Gate:</strong> ${log.gateId} <br>
                        <strong>Need:</strong> ${log.need} <br>
                        <strong>Access:</strong> ${log.accessibility}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initial fetch to populate data when page loads
    fetchDashboardData();

    // Connect to Socket.io
    const socket = io();
    // Listen for real-time updates from the server
    const srAnnouncer = document.getElementById('srAnnouncer');
    socket.on('new_request', (data) => {
        console.log('Real-time update received!');
        renderStadiumData(data.stadiumData);
        renderRequestsLog(data.recentRequests);
        srAnnouncer.textContent = 'New fan request received.';
    });
});
