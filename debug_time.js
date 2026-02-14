
const { toUTCDate, formatTimeForUser } = require('./src/utils/time');

function testConversion() {
    console.log('--- Testing Timezone Conversion ---');

    // Test case from logs
    const inputDatetime = "2026-02-14T15:43:00";
    const timezone = "Asia/Kolkata";

    console.log(`Input: ${inputDatetime} (${timezone})`);

    const utcDate = toUTCDate(inputDatetime, timezone);
    console.log(`Converted UTC Object:`, utcDate);
    console.log(`Converted UTC ISO:   ${utcDate.toISOString()}`);

    const now = new Date();
    console.log(`Server Now:          ${now.toISOString()}`);

    if (utcDate <= now) {
        console.warn('⚠️  Converted date is in the PAST/PRESENT (Likely causing immediate trigger)');
    } else {
        console.log('✅ Converted date is in the FUTURE');
    }
}

testConversion();
