const { normalizeWhatsAppNumber } = require('../src/utils/phone');

const testCases = [
    { input: 'whatsapp:+1234567890', expected: 'whatsapp:+1234567890' },
    { input: '+1234567890', expected: 'whatsapp:+1234567890' },
    { input: '1234567890', expected: 'whatsapp:+1234567890' },
    { input: 'whatsapp:1234567890', expected: 'whatsapp:+1234567890' },
    { input: '+1-234-567-890', expected: 'whatsapp:+1234567890' },
    { input: ' +1 (234) 567-890 ', expected: 'whatsapp:+1234567890' },
    { input: 'whatsapp:+1 234 567 890', expected: 'whatsapp:+1234567890' },
];

console.log('Running phone normalization tests...');

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }, index) => {
    try {
        const result = normalizeWhatsAppNumber(input);
        if (result === expected) {
            console.log(`[PASS] Case ${index + 1}: ${input} -> ${result}`);
            passed++;
        } else {
            console.error(`[FAIL] Case ${index + 1}: ${input}`);
            console.error(`   Expected: ${expected}`);
            console.error(`   Actual:   ${result}`);
            failed++;
        }
    } catch (error) {
        console.error(`[ERROR] Case ${index + 1}: ${input} threw error: ${error.message}`);
        failed++;
    }
});

console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) process.exit(1);
