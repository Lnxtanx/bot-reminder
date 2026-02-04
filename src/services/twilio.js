const twilio = require('twilio');

let client;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('Missing Twilio credentials');
    }
    client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
} catch (error) {
    console.warn('Twilio credentials not found or invalid. Using MOCK Twilio client.');
    client = {
        messages: {
            create: async (data) => {
                console.log('[MOCK TWILIO] Sending message:', JSON.stringify(data, null, 2));
                return { sid: 'SM_MOCK_' + Date.now() };
            }
        }
    };
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendMessage(to, body) {
    try {
        const message = await client.messages.create({
            from: TWILIO_WHATSAPP_NUMBER,
            to: to,
            body: body,
        });

        console.log(`Message sent to ${to}: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error(`Failed to send message to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send reminder confirmation message
 */
async function sendReminderConfirmation(to, task, formattedTime) {
    const body = `✅ Reminder set!\n\nTask: ${task}\nTime: ${formattedTime}`;
    return sendMessage(to, body);
}

/**
 * Send reminder notification
 */
async function sendReminderNotification(to, task) {
    const body = `⏰ Reminder: ${task}\n\nThis is your scheduled reminder!`;
    return sendMessage(to, body);
}

module.exports = {
    sendMessage,
    sendReminderConfirmation,
    sendReminderNotification,
};
