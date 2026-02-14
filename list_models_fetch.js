
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function fetchModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        if (!data.models) {
            console.log('No models found.');
            return;
        }

        console.log('Available Models:');
        data.models.forEach(m => console.log(`- ${m.name}`));

    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

fetchModels();
