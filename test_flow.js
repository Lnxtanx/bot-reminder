require('dotenv').config({ override: true });
const express = require('express');
const { startScheduler, processPendingReminders } = require('./src/services/scheduler');
const app = require('express')();

// Setup minimal server for testing
const PORT = 3001;
const whatsappRoutes = require('./src/routes/whatsapp');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/webhook', whatsappRoutes);

async function runTestFlow() {
    console.log('--- Starting Manual Test Flow ---');

    // 1. Start Server
    const server = app.listen(PORT, async () => {
        console.log(`Test server running on port ${PORT}`);

        try {
            // 2. Mock User Message
            const mockMessage = {
                From: 'whatsapp:+1234567890',
                Body: 'Remind me to check the logs in 10 seconds'
            };

            console.log('\n1. Sending Webhook Request:', mockMessage.Body);

            const response = await fetch(`http://localhost:${PORT}/webhook/whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockMessage)
            });
            const responseText = await response.text();
            console.log('Webhook Response:', response.status, responseText);

            // 3. Wait for Scheduler
            console.log('\n2. Waiting 15 seconds for reminder to trigger...');

            // We can wait, or we can force the scheduler to run faster/immediately for the test?
            // But let's wait to test the actual scheduling logic indirectly (or just call processPendingReminders manually)

            // Let's just wait to let real time pass so `NOW()` in SQL/Prisma works naturally
            await new Promise(resolve => setTimeout(resolve, 15000));

            console.log('\n3. Manually triggering scheduler check...');
            // Manually call to ensure we see the output immediately
            await processPendingReminders();

            console.log('\n--- Test Flow Complete ---');
        } catch (error) {
            console.error('Test failed:', error.message);
        } finally {
            server.close();
            process.exit(0);
        }
    });
}

runTestFlow();
