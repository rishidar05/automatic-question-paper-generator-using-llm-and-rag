import { BrevoClient } from '@getbrevo/brevo';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json')));

console.log('--- Brevo (Sendinblue) Diagnostic Script (v4) ---');

if (!settings.BREVO_API_KEY) {
    console.error('ERROR: BREVO_API_KEY not found in settings file!');
    process.exit(1);
}

// Initialize the Brevo Client
const client = new BrevoClient({
    apiKey: settings.BREVO_API_KEY,
});

const senderEmail = 'anderishidarreddy@gmail.com';
const testEmail = 'anderishidarreddy@gmail.com';

async function sendTest() {
    console.log(`Attempting to send test email to ${testEmail} via Brevo v4...`);
    try {
        const response = await client.transactionalEmails.sendTransacEmail({
            subject: "ExamGen AI - Brevo Test Email",
            htmlContent: "<html><body><h1>Success!</h1><p>Your Brevo configuration is working correctly.</p></body></html>",
            sender: { name: "ExamGen AI", email: senderEmail },
            to: [{ email: testEmail }]
        });
        console.log('SUCCESS: Email sent successfully!');
        console.log('Message ID:', response.messageId);
    } catch (error) {
        console.error('FAILURE: Brevo rejected the request.');
        console.error('Error details:', error);
    }
}

sendTest();
