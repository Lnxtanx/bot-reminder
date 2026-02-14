
const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch if node 18+

const BASE_URL = 'http://localhost:3000/webhook/whatsapp';
const BOT_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+15558960923';

async function testSelfLoop() {
    console.log('\n--- Testing Self-Loop Prevention ---');
    const body = {
        From: BOT_NUMBER, // Simulate coming FROM the bot
        Body: "I am talking to myself",
        MessageSid: "SM_SELF_LOOP"
    };

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        console.log(`Self-Loop Response: ${response.status} ${response.statusText}`);
        // We can't see server logs here, but we expect 200 OK. 
        // Verification relies on checking server output for "Ignoring own message".
    } catch (err) {
        console.error('Self-Loop Test Failed:', err.message);
    }
}

async function testNormalMessage() {
    console.log('\n--- Testing Normal Message (Trigger Fallback) ---');
    const body = {
        From: 'whatsapp:+1234567890',
        Body: "Remind me to check Gemini fallback in 5 minutes",
        MessageSid: "SM_FALLBACK_TEST"
    };

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        console.log(`Normal Message Response: ${response.status} ${response.statusText}`);
    } catch (err) {
        console.error('Normal Message Test Failed:', err.message);
    }
}

async function run() {
    await testSelfLoop();
    await testNormalMessage();
}

run();
