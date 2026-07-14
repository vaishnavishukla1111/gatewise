const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Load stadium data once
const stadiumDataPath = path.join(__dirname, '..', 'data', 'stadium.json');
const stadiumData = JSON.parse(fs.readFileSync(stadiumDataPath, 'utf8'));

router.post('/', async (req, res) => {
    try {
        const { gateId, language, need, accessibility } = req.body;

        // Basic input validation
        if (!gateId || !language || !need) {
            return res.status(400).json({ error: 'Missing required fields: gateId, language, or need.' });
        }

        // Validate API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set.");
            return res.status(500).json({ error: 'Server configuration error. API key missing.' });
        }

        // Log request for volunteer dashboard
        const timestamp = new Date().toISOString();
        req.fanRequestsLog.unshift({
            timestamp,
            gateId,
            language,
            need,
            accessibility: accessibility ? 'Wheelchair/Accessible required' : 'None'
        });
        
        // Keep only last 100 requests to avoid memory bloat
        if (req.fanRequestsLog.length > 100) {
            req.fanRequestsLog.pop();
        }

        // Find the requested gate's context
        const currentGate = stadiumData.find(g => g.id === gateId);
        
        if (!currentGate) {
            return res.status(404).json({ error: 'Gate not found in stadium data.' });
        }

        // Construct the prompt for Gemini
        // We explicitly tell the AI to reason over crowd levels, accessibility constraints, and nearby facilities
        const prompt = `
You are a smart AI assistant for fans at the FIFA World Cup 2026 stadium.
You must reply in this language: ${language}.
Keep your answer short, clear, and action-oriented (like an instruction card).

The fan's current location is: ${currentGate.name}.
The fan's requested need is: ${need}.
The fan's accessibility requirement is: ${accessibility ? "Needs step-free / wheelchair access." : "No special accessibility needs."}

Here is the current real-time data for ${currentGate.name}:
- Crowd level: ${currentGate.crowdLevelPercentage}%
- Step-free access at this gate: ${currentGate.stepFreeAccess ? "Yes" : "No"}
- Nearby Facilities: ${JSON.stringify(currentGate.facilitiesNearby)}

Here is the overall stadium data for other gates if you need to direct them elsewhere (e.g. if their current gate is too crowded or lacks accessibility):
${JSON.stringify(stadiumData)}

IMPORTANT INSTRUCTIONS:
1. Make a decision based on AT LEAST TWO factors (e.g., the crowd level + accessibility, or the requested need + nearby facilities).
2. Briefly explain WHY you picked that recommendation. DO NOT just state a flat answer. It must read like a decision. 
3. Example of good reasoning: "I recommend heading to Gate 4 for restrooms instead of your current Gate 3, because Gate 3 is currently very crowded (95%) and Gate 4 has accessible restrooms matching your needs."
4. If their current gate meets all requirements and isn't dangerously crowded (>80%), they can stay there.
5. Translate the final response into the requested language (${language}). Do NOT include any markdown formatting, just plain text.
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        res.json({
            success: true,
            recommendation: responseText
        });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: 'Failed to generate recommendation. Please try again.' });
    }
});

module.exports = router;
