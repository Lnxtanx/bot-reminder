
require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// Trying the default Twilio Sandbox number
const fromNumber = 'whatsapp:+14155238886';
const toNumber = 'whatsapp:+918073295463';

if (!accountSid || !authToken) {
    console.error('Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env');
    process.exit(1);
}

console.log(`Attempting default Sandbox: Sending message from ${fromNumber} to ${toNumber}...`);

const client = new twilio(accountSid, authToken);

client.messages
    .create({
        body: 'Hello! This is a test message from the Default Twilio Sandbox. If you see this, please update your .env file with this From number.',
        from: fromNumber,
        to: toNumber
    })
    .then(message => {
        console.log('✅ Message Sent Successfully!');
        console.log(`Message SID: ${message.sid}`);
        console.log(`Status: ${message.status}`);
    })
    .catch(error => {
        console.error('❌ Failed to send message:');
        console.error(`Code: ${error.code}`);
        console.error(`Message: ${error.message}`);

        // Specific advice for common errors
        if (error.code === 63015) {
            console.log("\n⚠️  The recipient has not joined the Sandbox.");
            console.log("Please send the 'join <keyword>' message from your phone to +1 415 523 8886.");
        }
    });
