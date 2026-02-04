const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Find user by WhatsApp number or create new user
 */
async function findOrCreateUser(whatsappNumber, timezone = 'UTC') {
    // Find or create user
    const user = await prisma.user.upsert({
        where: { whatsapp_number: whatsappNumber },
        update: {
            timezone: timezone || undefined
        },
        create: {
            whatsapp_number: whatsappNumber,
            timezone: timezone
        }
    });

    return user;
}

/**
 * Find user by WhatsApp number
 */
async function findUser(whatsappNumber) {
    return await prisma.user.findUnique({
        where: { whatsapp_number: whatsappNumber }
    });
}

/**
 * Create a new reminder
 */
async function createReminder(userId, task, remindAt, messageSid = null) {
    const reminder = await prisma.reminder.create({
        data: {
            user_id: userId,
            task: task,
            remind_at: remindAt,
            status: 'pending',
            message_sid: messageSid
        }
    });

    return reminder;
}

/**
 * Get all pending reminders that are due
 */
async function getPendingReminders() {
    const reminders = await prisma.reminder.findMany({
        where: {
            status: 'pending',
            remind_at: {
                lte: new Date() // Less than or equal to now
            }
        },
        include: {
            user: true
        },
        orderBy: {
            remind_at: 'asc'
        }
    });

    // Flatten structure to match previous output if needed, or update caller
    // The previous query returned flattened fields: r.*, u.whatsapp_number, u.timezone
    // Prisma returns nested objects: { ...reminder, user: { whatsapp_number, ... } }
    // We'll map it to keep compatibility for now
    return reminders.map(r => ({
        ...r,
        whatsapp_number: r.user.whatsapp_number,
        timezone: r.user.timezone
    }));
}

/**
 * Mark reminder as sent
 */
async function markReminderSent(reminderId) {
    const reminder = await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'sent' }
    });
    return reminder;
}

/**
 * Mark reminder as failed
 */
async function markReminderFailed(reminderId) {
    const reminder = await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'failed' }
    });
    return reminder;
}

module.exports = {
    prisma, // Export prisma client if needed elsewhere
    findOrCreateUser,
    findUser,
    createReminder,
    getPendingReminders,
    markReminderSent,
    markReminderFailed,
};
