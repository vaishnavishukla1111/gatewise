# GateWise — AI Stadium Assistant

GateWise is a smart, dynamic AI assistant designed for FIFA World Cup 2026 fans and stadium volunteers. Built for the Hack2Skills Challenge 4.

## Chosen Vertical

**Fan-facing navigation, accessibility, and multilingual assistance** — with a secondary focus on **operational intelligence for volunteers/venue staff**.

This was a deliberate scope decision: rather than covering every theme in the challenge brief shallowly, GateWise goes deep on navigation, accessibility, multilingual assistance, and real-time operational support. Transportation and sustainability (also listed in the brief) are not addressed in this version, in favor of doing fewer things well within the build window.

## Problem Statement Alignment

GateWise directly addresses the following themes from the FIFA World Cup 2026 Smart Stadiums & Tournament Operations challenge:

- **Navigation:** The fan assistant (`public/index.html`, `routes/ask.js`) provides step-by-step directions to gates, facilities, and seating based on the user's current location.
- **Crowd Management:** Real-time crowd level data (`data/stadium.json`) is factored into every AI recommendation, actively routing fans away from congested gates.
- **Accessibility:** The AI explicitly checks step-free access requirements and prioritizes accessible routes and facilities for users who request them.
- **Multilingual Assistance:** Fans can request guidance in multiple languages (English, Spanish, French, Hindi), and the AI responds fully in the selected language.
- **Operational Intelligence:** The volunteer dashboard (`public/volunteer.html`, `routes/volunteer.js`) gives stadium staff a live view of crowd levels and a running log of fan requests, updating instantly in real time via WebSockets — surfacing patterns as they happen rather than on a delay.
- **Real-Time Decision Support:** Every AI response reasons over multiple live factors simultaneously (crowd level + accessibility + facility proximity) and explains its recommendation, rather than returning a static lookup.

## How the AI Reasoning Works

Instead of a simple lookup table, the backend dynamically constructs a comprehensive prompt using the Gemini API.

The prompt includes:
1. The fan's current location and requested need.
2. The fan's language and accessibility constraints.
3. The real-time mock data for their current gate (crowd %, facility availability).
4. Data for other gates.

The AI is explicitly instructed to **reason over at least two factors** (e.g., crowd level + accessibility) and explain its decision.

Example response: *"I recommend heading to Gate 4 for restrooms instead of your current Gate 3, because Gate 3 is currently very crowded (95%) and Gate 4 has accessible restrooms matching your needs."*

## How the Solution Works End-to-End

1. **Fan submits a request** through the main app — gate, language, need, and accessibility requirement.
2. **Backend validates and logs the request**, then builds the reasoning prompt described above.
3. **Gemini API generates a recommendation** — attempting multiple model fallbacks (`gemini-3.5-flash` → `gemini-flash-latest` → etc.) in case of quota limits or outages, so the fan still gets a response.
4. **The fan sees the recommendation** as a short, clear instruction card in their own language.
5. **The Volunteer Dashboard updates instantly** via WebSockets (Socket.io) — volunteers see new fan requests appear in real time, without needing to refresh or wait on polling.
6. **Rate limiting** protects both the Gemini API key (`/api/ask`) and the dashboard data endpoint (`/api/volunteer/data`) from abuse.
7. **Screen reader support:** the fan-facing app uses `aria-live` regions so recommendations are announced automatically; the volunteer dashboard announces new requests via a dedicated live region, without re-reading the entire request list on every update.

## Assumptions Made

- **In-memory storage, not a database.** Fan request logs are held in a shared in-memory array for simplicity. This is appropriate for a demo build but means data doesn't persist across server restarts and wouldn't scale across multiple server instances — a production deployment would need a persistent database.
- **CORS is open (`cors()` with no origin restriction).** Acceptable for local development and demoing, but would need to be locked down to specific origins before any production use.
- **No automated tests for the newer real-time features.** The existing test suite covers the core `/api/ask` validation and success/error paths. Rate limiting and Socket.io event emission were manually tested end-to-end but don't yet have dedicated automated tests.
- **Volunteer dashboard re-renders the full request list on each update**, rather than appending only the new item. This is an acceptable tradeoff at demo scale — it works correctly and performs fine at the request volumes expected here — but a production version would emit only the delta for better efficiency at higher volume.
- **Crowd level data is mocked**, not pulled from live stadium sensors — appropriate for a hackathon demo, where real sensor integration is out of scope.
- **Scope is intentionally narrower than the full challenge brief** — transportation and sustainability use cases were not built, in favor of depth on navigation, accessibility, multilingual assistance, and real-time operational support.

## Prerequisites

- Node.js (v18+)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

## Step-by-Step Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```
   2. **Environment Variables**
   Create a `.env` file in the root directory (you can copy `.env.example`):
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3000   ```
3. **Run the Application**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev   ```
4. **Access the App**
   - Fan Assistant: `http://localhost:3000`
   - Volunteer Dashboard: `http://localhost:3000/volunteer.html`

## Running Tests

We use Jest and Supertest for unit/integration testing.
```bash
npm test
```
*(Tests mock the Gemini API so you don't use real quota or need a real key during tests.)*

## Tech Stack

- **Backend:** Node.js, Express, Socket.io, express-rate-limit
- **AI:** Google Gemini API (`@google/generative-ai`), with automatic model fallback
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework, for fast load on stadium networks)
- **Security:** Helmet, CORS, input validation, rate limiting