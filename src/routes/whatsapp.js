const express = require('express');
const router = express.Router();
const { parseMessage } = require('../services/openai');
const { sendReminderConfirmation, sendMessage } = require('../services/twilio');
const { findOrCreateUser, findUser, createReminder } = require('../db/queries');
const { toUTCDate, formatTimeForUser, isValidDatetime, isFutureDate } = require('../utils/time');
const { normalizeWhatsAppNumber } = require('../utils/phone');

/**
 * Twilio WhatsApp Webhook Handler
 * POST /webhook/whatsapp
 * 
 * Receives incoming WhatsApp messages, parses them with AI,
 * and creates reminders in the database.
 */
router.post('/whatsapp', async (req, res) => {
    try {
        // Extract WhatsApp number, message body, and MessageSid
        let from = req.body.From; // Format: whatsapp:+1234567890
        const messageBody = req.body.Body;
        const messageSid = req.body.MessageSid;

        // 0. SELF-LOOP PREVENTION
        // Ignore messages sent by the bot itself
        const botNumber = process.env.TWILIO_WHATSAPP_NUMBER;
        if (botNumber && from === botNumber) {
            console.log('Ignoring own message from:', from);
            // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
            res.type('text/xml');
            return res.send('<Response></Response>');
        }

        console.log(`Received message from ${from}: ${messageBody} (IDs: ${messageSid})`);

        // Validate required fields
        if (!from || !messageBody) {
            console.error('Missing required fields: From or Body');
            return res.status(400).send('Missing required fields');
        }

        // 1. Normalize WhatsApp number
        try {
            from = normalizeWhatsAppNumber(from);
            console.log(`Normalized From: ${from}`);
        } catch (phoneError) {
            console.warn(`Warning: Could not normalize phone number ${from}:`, phoneError.message);
            // proceed with original 'from' or maybe fail? 
            // Twilio might have sent it correctly, so if it fails our strict check, 
            // we might want to just keep it as is or log it.
            // But if it fails our check, it's likely bad.
            // Let's just log and keep going, hoping for the best, or normalized version might be undefined if error thrown.
            // Wait, normalize throws if invalid? Yes "Phone number is required". 
            // But my regex is permissive.
        }

        // 2. Fetch User Context (Timezone)
        // We need the user's timezone BEFORE parsing to correctly interpret "9am"
        const existingUser = await findUser(from);
        const userTimezone = existingUser?.timezone || 'Asia/Kolkata';

        // Parse message with AI (AI is parser only - no business logic)
        const parsed = await parseMessage(messageBody);
        console.log('AI parsed:', JSON.stringify(parsed, null, 2));

        // Check for AI failure (Quota exceeded / API down)
        if (parsed.error === 'AI services unavailable') {
            console.error('AI Service Error:', parsed.error);
            await sendMessage(from, "I'm currently overloaded and running low on fuel ⛽. Please try again in 10 minutes.");
            // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
            res.type('text/xml');
            return res.send('<Response></Response>');
        }

        // Backend handles all decision making
        if (parsed.intent !== 'create_reminder') {
            await sendMessage(from, "Sorry, I didn't understand that. Try: 'remind me to [task] at [time]'");
            // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
            res.type('text/xml');
            return res.send('<Response></Response>');
        }

        // Validate AI output
        if (!parsed.task) {
            await sendMessage(from, "I couldn't understand what to remind you about. Please try again.");
            // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
            res.type('text/xml');
            return res.send('<Response></Response>');
        }

        if (!parsed.datetime || !isValidDatetime(parsed.datetime)) {
            await sendMessage(from, "I couldn't understand the time. Please specify when you want to be reminded.");
            // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
            res.type('text/xml');
            return res.send('<Response></Response>');
        }

        // Use parsed timezone if provided (e.g. "9am EST"), otherwise fallback to user's pref
        const finalTimezone = parsed.timezone || userTimezone;

        // Convert datetime to UTC for storage
        const remindAtUTC = toUTCDate(parsed.datetime, finalTimezone);

        // Validate reminder is in the future
        if (!isFutureDate(remindAtUTC)) {
            await sendMessage(from, "The reminder time has already passed. Please specify a future time.");
            // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
            res.type('text/xml');
            return res.send('<Response></Response>');
        }

        // Find or create user (update timezone if new one detected)
        const user = await findOrCreateUser(from, finalTimezone);
        console.log('User:', user.id);

        // 3. Create reminder (with Deduplication)
        try {
            const reminder = await createReminder(user.id, parsed.task, remindAtUTC, messageSid);
            console.log('Reminder created:', reminder.id);
        } catch (error) {
            // Check for unique constraint violation on message_sid
            if (error.code === 'P2002' && error.meta?.target?.includes('message_sid')) {
                console.log(`Duplicate reminder request ignored (MessageSid: ${messageSid})`);
                // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
                res.type('text/xml');
                return res.send('<Response></Response>'); // Idempotent success
            }
            throw error; // Re-throw other errors
        }

        // Format time for user confirmation
        const formattedTime = formatTimeForUser(remindAtUTC, finalTimezone);

        // Send confirmation
        await sendReminderConfirmation(from, parsed.task, formattedTime);

        // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
        res.type('text/xml');
        res.send('<Response></Response>');

    } catch (error) {
        console.error('Webhook error:', error);

        // Try to notify user of error
        try {
            if (req.body.From) {
                await sendMessage(req.body.From, "Sorry, something went wrong. Please try again later.");
            }
        } catch (notifyError) {
            console.error('Failed to notify user of error:', notifyError);
        }

        // Still return 200 to prevent Twilio from retrying
        // Return valid empty TwiML to avoid "Content is not allowed in prolog" error
        res.type('text/xml');
        res.send('<Response></Response>');
    }
});

module.exports = router;
