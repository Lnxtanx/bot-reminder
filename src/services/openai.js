const OpenAI = require('openai');
const { getCurrentISOTime } = require('../utils/time');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parse user message to extract reminder intent, task, datetime, and timezone
 * AI is ONLY a parser - no business logic here
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Parse user message to extract reminder intent, task, datetime, and timezone
 * AI is ONLY a parser - no business logic here
 */
async function parseMessage(messageBody) {
    const currentTime = getCurrentISOTime();

    const systemPrompt = `You are a reminder parsing assistant. Your ONLY job is to parse natural language messages and extract structured data.

RULES:
1. Return ONLY valid JSON, no explanation or markdown
2. Extract intent, task, datetime, and timezone
3. If you cannot parse the message, return intent as "unknown"
4. For relative times like "in 5 minutes", calculate the absolute datetime
5. For times like "at 5 pm", assume today unless specified otherwise
6. If no timezone is mentioned, use "Asia/Kolkata" as default

Current UTC time: ${currentTime}

JSON Schema:
{
  "intent": "create_reminder" | "unknown",
  "task": "<what to be reminded about>",
  "datetime": "<ISO 8601 format: YYYY-MM-DDTHH:mm:ss>",
  "timezone": "<IANA timezone identifier>"
}`;

    try {
        console.log('Attempting to parse with OpenAI...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: messageBody },
            ],
            temperature: 0,
            max_tokens: 200,
        });

        const content = response.choices[0]?.message?.content?.trim();
        return parseJSONResponse(content);

    } catch (error) {
        console.error('OpenAI failed:', error.message);

        // Fallback to Gemini if configured
        if (process.env.GEMINI_API_KEY) {
            console.log('Falling back to Gemini...');
            try {
                const result = await geminiModel.generateContent([
                    systemPrompt,
                    `User Message: ${messageBody}`
                ]);
                const response = await result.response;
                const text = response.text();
                return parseJSONResponse(text);
            } catch (geminiError) {
                console.error('Gemini fallback failed:', geminiError.message);
            }
        }

        return {
            intent: 'unknown',
            task: null,
            datetime: null,
            timezone: null,
            error: 'AI services unavailable',
        };
    }
}

function parseJSONResponse(content) {
    try {
        // Remove markdown code blocks if present
        let jsonStr = content;
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);

        // Validate required fields
        if (!parsed.intent) {
            parsed.intent = 'unknown';
        }

        return parsed;
    } catch (error) {
        console.error('Failed to parse AI response:', content);
        return {
            intent: 'unknown',
            error: 'Failed to parse JSON',
        };
    }
}

module.exports = {
    parseMessage,
};
