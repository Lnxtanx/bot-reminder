
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check() {
    console.log('Testing gemini-pro...');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log('Success:', response.text());
    } catch (error) {
        console.error('FULL ERROR:', JSON.stringify(error, null, 2));
        console.error('MESSAGE:', error.message);
    }
}

check();
