const cron = require('node-cron');
const { getPendingReminders, markReminderSent, markReminderFailed } = require('../db/queries');
const { sendReminderNotification } = require('./twilio');

/**
 * Process pending reminders
 * Runs every 30 seconds to check for due reminders
 */
async function processPendingReminders() {
    try {
        const reminders = await getPendingReminders();

        if (reminders.length === 0) {
            return;
        }

        console.log(`Processing ${reminders.length} pending reminder(s)...`);

        for (const reminder of reminders) {
            try {
                // Send WhatsApp notification
                const result = await sendReminderNotification(
                    reminder.whatsapp_number,
                    reminder.task
                );

                if (result.success) {
                    await markReminderSent(reminder.id);
                    console.log(`Reminder sent: ${reminder.id} - ${reminder.task}`);
                } else {
                    await markReminderFailed(reminder.id);
                    console.error(`Reminder failed: ${reminder.id} - ${result.error}`);
                }
            } catch (error) {
                console.error(`Error processing reminder ${reminder.id}:`, error.message);
                await markReminderFailed(reminder.id);
            }
        }
    } catch (error) {
        console.error('Scheduler error:', error.message);
    }
}

/**
 * Start the reminder scheduler
 * Runs every 30 seconds
 */
function startScheduler() {
    // Run every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        await processPendingReminders();
    });

    console.log('Reminder scheduler started (runs every 30 seconds)');
}

module.exports = {
    startScheduler,
    processPendingReminders,
};
