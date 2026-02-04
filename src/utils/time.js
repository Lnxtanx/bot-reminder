/**
 * Time utilities for timezone handling and datetime formatting
 */

/**
 * Convert datetime string with timezone to UTC Date object
 */
function toUTCDate(datetimeString, timezone) {
    try {
        // Parse the datetime string assuming it's in the specified timezone
        const date = new Date(datetimeString);

        // If the datetime string doesn't include timezone info, we need to interpret it
        // as being in the specified timezone
        if (!datetimeString.includes('Z') && !datetimeString.includes('+') && !datetimeString.includes('-', 10)) {
            // Create a date string that includes the timezone
            const options = { timeZone: timezone };
            const formatter = new Intl.DateTimeFormat('en-US', {
                ...options,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });

            // Get the offset for the timezone
            const localDate = new Date(datetimeString);
            const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
            const offset = utcDate - tzDate;

            return new Date(localDate.getTime() + offset);
        }

        return date;
    } catch (error) {
        console.error('Error converting datetime:', error);
        return new Date(datetimeString);
    }
}

/**
 * Format date for display in user's timezone
 */
function formatTimeForUser(date, timezone) {
    try {
        return new Date(date).toLocaleString('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch (error) {
        return new Date(date).toLocaleTimeString();
    }
}

/**
 * Get current time in ISO format
 */
function getCurrentISOTime() {
    return new Date().toISOString();
}

/**
 * Validate ISO datetime string
 */
function isValidDatetime(datetimeString) {
    const date = new Date(datetimeString);
    return !isNaN(date.getTime());
}

/**
 * Check if datetime is in the future
 */
function isFutureDate(datetimeString) {
    const date = new Date(datetimeString);
    return date > new Date();
}

module.exports = {
    toUTCDate,
    formatTimeForUser,
    getCurrentISOTime,
    isValidDatetime,
    isFutureDate,
};
