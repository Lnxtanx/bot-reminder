
const fs = require('fs');
const { toUTCDate } = require('./src/utils/time');

function testConversion() {
    const log = [];
    const logMsg = (msg) => { console.log(msg); log.push(msg); };

    logMsg('--- Testing Timezone Conversion ---');

    // Test case from logs
    const inputDatetime = "2026-02-14T15:43:00";
    const timezone = "Asia/Kolkata";

    logMsg(`Input: ${inputDatetime} (${timezone})`);

    const utcDate = toUTCDate(inputDatetime, timezone);
    logMsg(`Converted UTC Object: ${utcDate}`);
    logMsg(`Converted UTC ISO:    ${utcDate.toISOString()}`); // This is what Prisma sees

    const now = new Date();
    logMsg(`Server Now:           ${now.toISOString()}`);

    if (utcDate <= now) {
        logMsg('⚠️  Converted date is in the PAST/PRESENT (Likely causing immediate trigger)');
    } else {
        logMsg('✅ Converted date is in the FUTURE');
    }

    fs.writeFileSync('debug_output.txt', log.join('\n'));
}

testConversion();
