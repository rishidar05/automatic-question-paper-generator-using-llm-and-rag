import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
    const pdf = require('pdf-parse');
    const { PDFParse } = pdf;
    console.log('PDFParse type:', typeof PDFParse);

    // Create a dummy buffer
    const buffer = Buffer.from('dummy pdf content');

    try {
        console.log('Trying PDFParse(buffer)...');
        const result = PDFParse(buffer);
        console.log('Result:', result);
    } catch (e) {
        console.log('PDFParse(buffer) failed:', e.message);
    }

    try {
        console.log('Trying new PDFParse(buffer)...');
        const instance = new PDFParse(buffer);
        console.log('Instance:', instance);
    } catch (e) {
        console.log('new PDFParse(buffer) failed:', e.message);
    }

    // Check if there is a 'default' export that is deeper?
    // Using 2.4.5, maybe we should use another import?
} catch (e) {
    console.error(e);
}
