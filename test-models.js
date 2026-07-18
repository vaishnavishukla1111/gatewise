require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
    console.log("Checking available Gemini models for your API key...\n");
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found in .env file.");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const errorData = await response.text();
            console.error(errorData);
            return;
        }
        
        const data = await response.json();
        const models = data.models || [];
        
        console.log(`Found ${models.length} models. Supported models for generateContent:\n`);
        
        models.forEach(model => {
            if (model.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${model.name.replace('models/', '')}`);
            }
        });

    } catch (error) {
        console.error("Failed to fetch models:", error.message);
    }
}

checkModels();
