const express = require('express');
const router = express.Router();
const { parseMessage } = require('../services/openai');
const { sendReminderConfirmation, sendMessage } = require('../services/twilio');
const { findOrCreateUser, createReminder } = require('../db/queries');
const { toUTCDate, formatTimeForUser, isValidDatetime, isFutureDate } = require('../utils/time');

/**
 * Twilio WhatsApp Webhook Handler
 * POST /webhook/whatsapp
 * 
 * Receives incoming WhatsApp messages, parses them with AI,
 * and creates reminders in the database.
 */
router.post('/whatsapp', async (req, res) => {
    try {
        // Extract WhatsApp number and message body from Twilio webhook
        const from = req.body.From; // Format: whatsapp:+1234567890
        const messageBody = req.body.Body;

        console.log(`Received message from ${from}: ${messageBody}`);

        // Validate required fields
        if (!from || !messageBody) {
            console.error('Missing required fields: From or Body');
            return res.status(400).send('Missing required fields');
        }

        // Parse message with AI (AI is parser only - no business logic)
        const parsed = await parseMessage(messageBody);
        console.log('AI parsed:', JSON.stringify(parsed, null, 2));

        // Backend handles all decision making
        if (parsed.intent !== 'create_reminder') {
            await sendMessage(from, "Sorry, I didn't understand that. Try: 'remind me to [task] at [time]'");
            return res.status(200).send('OK');
        }

        // Validate AI output
        if (!parsed.task) {
            await sendMessage(from, "I couldn't understand what to remind you about. Please try again.");
            return res.status(200).send('OK');
        }

        if (!parsed.datetime || !isValidDatetime(parsed.datetime)) {
            await sendMessage(from, "I couldn't understand the time. Please specify when you want to be reminded.");
            return res.status(200).send('OK');
        }

        const timezone = parsed.timezone || 'Asia/Kolkata';

        // Convert datetime to UTC for storage
        const remindAtUTC = toUTCDate(parsed.datetime, timezone);

        // Validate reminder is in the future
        if (!isFutureDate(remindAtUTC)) {
            await sendMessage(from, "The reminder time has already passed. Please specify a future time.");
            return res.status(200).send('OK');
        }

        // Find or create user
        const user = await findOrCreateUser(from, timezone);
        console.log('User:', user.id);

        // Create reminder
        const reminder = await createReminder(user.id, parsed.task, remindAtUTC);
        console.log('Reminder created:', reminder.id);

        // Format time for user confirmation
        const formattedTime = formatTimeForUser(remindAtUTC, timezone);

        // Send confirmation
        await sendReminderConfirmation(from, parsed.task, formattedTime);

        // Return 200 to acknowledge Twilio webhook
        res.status(200).send('OK');

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
        res.status(200).send('OK');
    }
});

module.exports = router;
