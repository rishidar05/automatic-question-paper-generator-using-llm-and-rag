import Tesseract from 'tesseract.js';
import fs from 'fs';

async function testOCR() {
    console.log("Starting OCR Diagnostic...");
    try {
        // We don't have an image file handy, but we can check if the library loads
        console.log("Tesseract loaded successfully.");
        
        // Check if server.js has the latest changes
        const serverCode = fs.readFileSync('server.js', 'utf8');
        if (serverCode.includes('Tesseract.recognize')) {
            console.log("server.js contains OCR logic.");
        } else {
            console.log("ERROR: server.js is missing OCR logic!");
        }

        if (serverCode.includes('const upload = multer();')) {
            console.log("server.js contains multer initialization.");
        } else {
            console.log("ERROR: server.js is missing multer initialization!");
        }

    } catch (err) {
        console.error("Diagnostic Failed:", err.message);
    }
}

testOCR();
