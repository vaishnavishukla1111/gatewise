/**
 * @fileoverview Fan assistant API route
 * Handles fan requests, queries Gemini API, and provides navigation recommendations.
 */
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Load stadium data once (cached by Node.js module system)
const stadiumData = require('../data/stadium.json');

/**
 * POST /api/ask
 * Generates an AI recommendation based on fan context.
 * @name post/
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Validates and sanitizes the incoming request body.
 * @param {Object} body - The request body object.
 * @returns {Object} Validation result with either error message or parsed data.
 */
function validateRequest(body) {
    const gateId = String(body.gateId || '').trim();
    const language = String(body.language || '').trim();
    const need = String(body.need || '').trim();
    const accessibility = Boolean(body.accessibility);

    if (!gateId || !language || !need) {
        return { isValid: false, error: 'Missing or invalid required fields: gateId, language, or need.' };
    }
    
    // Enforce length limits to prevent large payload injections
    if (gateId.length > 50 || language.length > 50 || need.length > 300) {
        return { isValid: false, error: 'Input fields exceed maximum allowed length.' };
    }

    return { isValid: true, data: { gateId, language, need, accessibility } };
}

/**
 * Logs the fan request for the volunteer dashboard.
 * @param {Array} logArray - Shared in-memory array for logs.
 * @param {Object} data - Parsed request data.
 */
function logFanRequest(logArray, data) {
    const timestamp = new Date().toISOString();
    logArray.unshift({
        timestamp,
        gateId: data.gateId,
        language: data.language,
        need: data.need,
        accessibility: data.accessibility ? 'Wheelchair/Accessible required' : 'None'
    });
    
    // Keep only last 100 requests to avoid memory bloat
    if (logArray.length > 100) {
        logArray.pop();
    }
}

/**
 * Constructs the AI prompt context.
 * @param {Object} currentGate - Gate data object.
 * @param {Object} data - Parsed request data.
 * @param {Array} stadiumData - Full stadium data array.
 * @returns {string} The formatted prompt string.
 */
function buildPrompt(currentGate, data, stadiumData) {
    return `
You are a smart AI assistant for fans at the FIFA World Cup 2026 stadium.
You must reply in this language: ${data.language}.
Keep your answer short, clear, and action-oriented (like an instruction card).

The fan's current location is: ${currentGate.name}.
The fan's requested need is: ${data.need}.
The fan's accessibility requirement is: ${data.accessibility ? "Needs step-free / wheelchair access." : "No special accessibility needs."}

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
5. Translate the final response into the requested language (${data.language}). Do NOT include any markdown formatting, just plain text.
`;
}

/**
 * Fetches the recommendation from the Gemini API.
 * @param {string} apiKey - Gemini API Key.
 * @param {string} prompt - The formatted prompt.
 * @returns {Promise<string>} The generated response text.
 */
async function fetchRecommendation(apiKey, prompt) {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fallback list: try the newest first, then fall back to older/alternative models 
    // to handle 503 (high traffic), 429 (quota limit), or 404 (deprecated) errors automatically.
    const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-2.5-pro',
        'gemini-2.0-flash'
    ];
    
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.warn(`Model ${modelName} failed (${error.status || 'Unknown error'}). Trying next...`);
            // If we've exhausted all backup models, throw the final error
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                throw error;
            }
        }
    }
}

router.post('/', async (req, res) => {
    try {
        const validation = validateRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set.");
            return res.status(500).json({ error: 'Server configuration error. API key missing.' });
        }

        logFanRequest(req.fanRequestsLog, validation.data);

        const currentGate = stadiumData.find(g => g.id === validation.data.gateId);
        if (!currentGate) {
            return res.status(404).json({ error: 'Gate not found in stadium data.' });
        }

        const prompt = buildPrompt(currentGate, validation.data, stadiumData);
        const recommendation = await fetchRecommendation(apiKey, prompt);

        res.json({
            success: true,
            recommendation
        });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: 'Failed to generate recommendation. Please try again.' });
    }
});

module.exports = router;
