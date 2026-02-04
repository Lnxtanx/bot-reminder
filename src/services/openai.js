const OpenAI = require('openai');
const { getCurrentISOTime } = require('../utils/time');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

    // Parse JSON response
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
        console.error('Failed to parse OpenAI response:', content);
        return {
            intent: 'unknown',
            task: null,
            datetime: null,
            timezone: null,
            error: 'Failed to parse AI response',
        };
    }
}

module.exports = {
    parseMessage,
};
