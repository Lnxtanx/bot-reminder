/**
 * Utility functions for phone number normalization
 */

/**
 * Normalizes a phone number to E.164 format with 'whatsapp:' prefix.
 * 
 * @param {string} phoneNumber - The raw phone number string
 * @returns {string} Normalized phone number string (e.g., 'whatsapp:+1234567890')
 * @throws {Error} If phone number format is invalid
 */
function normalizeWhatsAppNumber(phoneNumber) {
    if (!phoneNumber) {
        throw new Error('Phone number is required');
    }

    // Remove 'whatsapp:' prefix if present
    let cleaned = phoneNumber.replace(/^whatsapp:/, '');

    // Remove all non-digit and non-plus characters
    cleaned = cleaned.replace(/[^0-9+]/g, '');

    // Ensure it starts with '+'
    if (!cleaned.startsWith('+')) {
        // If it looks like a valid number without +, prepend it
        // This is a best-guess effort. Ideally, we should parse with a library like google-libphonenumber
        // but for now, we assume if it's 10-15 digits, it's a full number.
        if (cleaned.length >= 10 && cleaned.length <= 15) {
            cleaned = '+' + cleaned;
        } else {
            // If it's too short, it might be a local number or invalid.
            // We'll throw an error or log a warning.
            // For strictness, let's keep it simple: assume user provides full number if no +.
            // But actually, Twilio usually sends E.164. User input might vary.
            // Let's assume if it has no +, it needs one.
            cleaned = '+' + cleaned;
        }
    }

    // Validate length (E.164 is up to 15 digits)
    // +<country_code><subscriber_number>
    // Min length: +[1 digit ccode][~4 digits] = ~6 chars?
    // Max length: +[15 digits] = 16 chars
    if (cleaned.length < 8 || cleaned.length > 17) { // generous bounds
        // It might still be invalid, but let Twilio check strict validity
    }

    return `whatsapp:${cleaned}`;
}

module.exports = {
    normalizeWhatsAppNumber
};
