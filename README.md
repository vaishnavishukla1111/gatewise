# GateWise - FIFA World Cup 2026 Assistant

GateWise is a smart, dynamic AI assistant designed for FIFA World Cup 2026 fans and stadium volunteers. Built for the Hack2Skills Challenge 4.

## Problem Statement Themes Covered
- **Navigation:** Context-aware routing based on current gate and desired facilities.
- **Multilingual Assistance:** Seamlessly responds in English, Spanish, French, and Hindi.
- **Crowd Management:** AI factors in real-time crowd density (mocked) to distribute fans effectively.
- **Accessibility:** Users can flag wheelchair/step-free needs, and the AI will only recommend accessible routes/facilities.
- **Operational Intelligence:** Volunteers have a live dashboard to monitor crowd levels and spot patterns in fan requests.

## How the AI Reasoning Works
Instead of a simple lookup table, the backend dynamically constructs a comprehensive prompt using the Gemini API. 
The prompt includes:
1. The fan's current location and requested need.
2. The fan's language and accessibility constraints.
3. The real-time mock data for their current gate (crowd %, facility availability).
4. Data for other gates.

The AI is explicitly instructed to **reason over at least two factors** (e.g., crowd level + accessibility) and explain its decision. 
Example response: *"I recommend heading to Gate 4 for restrooms instead of your current Gate 3, because Gate 3 is currently very crowded (95%) and Gate 4 has accessible restrooms matching your needs."*

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
   PORT=3000
   ```

3. **Run the Application**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. **Access the App**
   - Fan Assistant: `http://localhost:3000`
   - Volunteer Dashboard: `http://localhost:3000/volunteer.html`

## Running Tests
We use Jest and Supertest for unit/integration testing.
```bash
npm test
```
*(Tests mock the Gemini API so you don't use real quota or need a real key during tests).*
