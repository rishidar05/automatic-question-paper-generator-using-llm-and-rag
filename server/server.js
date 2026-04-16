import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';
import Groq from 'groq-sdk';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as Brevo from '@getbrevo/brevo';
import multer from 'multer';
import { createRequire } from 'module';
import Tesseract from 'tesseract.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

const upload = multer();

const getSetting = (key, defaultValue) => {
    // Check environment variables first (for cloud deployment)
    if (process.env[key]) return process.env[key];
    
    // Fallback to settings.json (for local development)
    try {
        const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url)));
        return settings[key] || defaultValue;
    } catch (err) {
        return defaultValue;
    }
};

const app = express();
const port = getSetting('PORT', 3000);
const JWT_SECRET = getSetting('JWT_SECRET', 'super_secret_key_123');

const client = new Brevo.BrevoClient({
    apiKey: getSetting('BREVO_API_KEY'),
});

if (!getSetting('BREVO_API_KEY')) {
    console.error('CRITICAL ERROR: BREVO_API_KEY is not defined');
} else {
    console.log('Brevo API client initialized.');
}

app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../client/dist')));

// Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Setup
const db = new sqlite3.Database('users.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        otp TEXT,
        is_verified INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS papers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        syllabus TEXT,
        questions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

const groq = new Groq({
    apiKey: getSetting('GROQ_API_KEY')
});

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Helpers
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (email, otp) => {
    console.log(`Attempting to send OTP email to: ${email} via Brevo`);
    try {
        await client.transactionalEmails.sendTransacEmail({
            subject: "Your ExamGen AI Verification Code",
            htmlContent: `<html><body><strong>Your OTP is: ${otp}</strong><p>This code will expire shortly.</p></body></html>`,
            sender: { name: "ExamGen AI", email: "anderishidarreddy@gmail.com" },
            to: [{ email: email }]
        });
        console.log('--- Brevo SUCCESS ---');
        console.log(`Email successfully sent to ${email}`);
    } catch (error) {
        console.error('--- Brevo ERROR ---');
        console.error('Error Details:', error);

        // Fallback to console for development
        console.log('\n====================================================');
        console.log(` DEV FALLBACK OTP (Use this to login): ${otp}`);
        console.log('====================================================\n');
    }
};

// AUTH ROUTES

// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Signup attempt for: ${email}`);
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();

        console.log('Inserting user into DB...');
        db.run('INSERT INTO users (email, password, otp) VALUES (?, ?, ?)', [email, hashedPassword, otp], async function (err) {
            if (err) {
                console.error('DB Insert Error:', err.message);
                if (err.message.includes('UNIQUE constraint')) return res.status(400).json({ error: 'User already exists' });
                return res.status(500).json({ error: err.message });
            }
            console.log('Sending OTP email...');
            await sendOtpEmail(email, otp);
            res.json({ message: 'Signup successful. Check your email for OTP.' });
        });
    } catch (err) {
        console.error('Signup Catch Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
    let { email, otp } = req.body;

    // Clean inputs
    email = email?.trim();
    otp = otp?.trim();

    console.log(`Verification attempt: Email[${email}] OTP[${otp}]`);

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            console.warn(`Verification Failed: User not found for email: ${email}`);
            return res.status(400).json({ error: 'User not found' });
        }

        console.log(`Found user in DB. Stored OTP: [${user.otp}]`);

        // Secure verification (no bypass)
        if (user.otp === otp && otp !== null) {
            db.run('UPDATE users SET is_verified = 1, otp = NULL WHERE id = ?', [user.id]);
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            console.log('Verification SUCCESS');
            return res.json({ token, message: 'Verified successfully' });
        } else {
            console.warn(`Verification Failed: OTP mismatch. Expected [${user.otp}], got [${otp}]`);
            return res.status(400).json({ error: 'Invalid OTP' });
        }
    });
});

// Verify Token
app.get('/api/verify', authenticateToken, (req, res) => {
    console.log(`Checking token for user: ${req.user.email}`);
    res.json({ valid: true, user: req.user });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const otp = generateOtp();
            db.run('UPDATE users SET otp = ? WHERE id = ?', [otp, user.id], async (err) => {
                if (err) return res.status(500).json({ error: 'Db error' });
                await sendOtpEmail(email, otp);
                res.json({ message: 'OTP sent to email', requireOtp: true });
            });
        } else {
            res.status(400).json({ error: 'Invalid credentials' });
        }
    });
});

// HISTORY
app.get('/api/history', authenticateToken, (req, res) => {
    db.all('SELECT * FROM papers WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({
            ...row,
            questions: JSON.parse(row.questions) // Parsing back to array JSON strings
        })));
    });
});

// Solve Endpoint [NEW]
app.post('/api/solve', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful expert tutor. Provide clear, concise answers to the user's questions. If there are multiple questions, number the answers clearly."
                },
                {
                    role: "user",
                    content: `Solve/Answer this:\n${text}`
                }
            ],
            model: "llama-3.3-70b-versatile",
        });
        res.json({ solution: completion.choices[0]?.message?.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to solve' });
    }
});

// Protected Paper Generation with Save [ENHANCED]
app.post('/api/generate-paper', authenticateToken, upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'patternFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const { count, difficulty = 'medium', type = 'mix' } = req.body;
        const mainFile = req.files['file'] ? req.files['file'][0] : null;
        const patternFile = req.files['patternFile'] ? req.files['patternFile'][0] : null;

        const syllabusTitle = mainFile ? mainFile.originalname : 'Uploaded File';

        if (!mainFile) {
            return res.status(400).json({ error: 'Syllabus file is required' });
        }

        console.log('--- Request Debug ---');
        console.log('Body:', req.body);
        console.log('Syllabus File present:', !!mainFile);
        console.log('Pattern File present:', !!patternFile);

        const numQuestions = count || 5;

        // Extraction helper
        const extractText = async (fileObj) => {
            if (!fileObj) return '';
            
            // Handle images via OCR (Tesseract) [NEW - OCR SUPPORT]
            if (fileObj.mimetype && fileObj.mimetype.startsWith('image/')) {
                console.log(`[OCR] Processing image: ${fileObj.originalname} (${fileObj.mimetype})`);
                try {
                    const result = await Tesseract.recognize(fileObj.buffer, 'eng', {
                        logger: m => console.log(`[OCR Progress] ${fileObj.originalname}: ${m.status} - ${Math.round(m.progress * 100)}%`)
                    });
                    const text = result.data.text;
                    console.log(`[OCR] Extraction complete for ${fileObj.originalname}. Extracted length: ${text.length}`);
                    return text;
                } catch (ocrErr) {
                    console.error(`[OCR Error] Failed to process ${fileObj.originalname}:`, ocrErr);
                    throw new Error(`Failed to extract text from image: ${fileObj.originalname}. Error: ${ocrErr.message}`);
                }
            }

            if (fileObj.mimetype === 'application/pdf') {
                const pdfData = await pdf(fileObj.buffer);
                return pdfData.text;
            } else if (fileObj.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: fileObj.buffer });
                return result.value;
            } else {
                return fileObj.buffer.toString();
            }
        };

        const fileText = await extractText(mainFile);
        const patternText = await extractText(patternFile);

        if (!fileText || fileText.trim().length < 50) {
            return res.status(400).json({
                error: 'Unable to read text from syllabus file. If this is a scanned PDF, please convert it to a text-based PDF or DOCX.'
            });
        }

        // Strict Type Enforcement
        let typeInstruction = "";
        if (type === 'mcq') {
            typeInstruction = "Strictly generate ONLY Multiple Choice Questions (MCQ).";
        } else if (type === 'short' || type === 'long') {
            typeInstruction = "Strictly generate ONLY text-based questions. DO NOT include options. Return 'null' for options field.";
        } else if (type === 'mix') {
            typeInstruction = "Generate a balanced mix of Multiple Choice Questions (MCQ), Short Answer, and Long Answer questions.";
        } else {
            typeInstruction = "Determine the question format automatically based on the provided sample pattern.";
        }

        let parsedCount = parseInt(count);
        let hasPattern = patternText && patternText.trim().length > 0;

        // Construct structural instructions
        const fullSyllabusContext = fileText;
        let structureInstruction = "";
        let patternContext = "";

        if (hasPattern) {
            if (!isNaN(parsedCount) && parsedCount > 0) {
                patternContext = `\n[SAMPLE PATTERN - FOR STRUCTURAL REFERENCE ONLY]\n${patternText}\n[END SAMPLE PATTERN]\n`;
                structureInstruction = `CRITICAL RULES:
1. Generate EXACTLY ${parsedCount} completely NEW questions based ONLY on the SYLLABUS provided.
2. DO NOT duplicate or copy questions from the SAMPLE PATTERN. The pattern is provided ONLY so you can see how sections are named (e.g., Section A) and how marks are assigned.
3. Include the "section" name for each question based on how the pattern divides them.
4. Your output must contain exactly ${parsedCount} items in the JSON array.
Combine this with the format instruction: ${typeInstruction}`;
            } else {
                patternContext = `\n[SAMPLE PATTERN - CLONE EXACT STRUCTURE]\n${patternText}\n[END SAMPLE PATTERN]\n`;
                structureInstruction = `CRITICAL RULES - YOU MUST FOLLOW ALL OF THESE EXACTLY:
1. ANALYZE the SAMPLE PATTERN carefully. Count the EXACT number of questions in EACH SECTION separately.
   - For example, if PART-A has 10 questions and PART-B has 7 questions, you MUST generate exactly 10 questions for PART-A and 7 questions for PART-B = 17 total.
2. For EACH section, replicate:
   - The EXACT section name (e.g., "PART-A", "PART-B", "Section A", etc.)
   - The EXACT number of questions in that section
   - The EXACT marks per question in that section (e.g., 1 mark for Part-A, 5 marks for Part-B)
   - The question type used in that section (MCQ vs descriptive)
3. If the pattern has instruction notes like "Answer all questions" or "Answer any 4 questions", include them in the "section_instruction" field for the FIRST question of each section.
4. ALL question content MUST be NEW and derived from the SYLLABUS. DO NOT copy any questions from the pattern.
5. The total number of questions in your output MUST EXACTLY equal the total number of questions in the sample pattern.
${typeInstruction}`;
            }
        } else {
            const finalCount = (!isNaN(parsedCount) && parsedCount > 0) ? parsedCount : 5;
            structureInstruction = `Generate exactly ${finalCount} NEW questions based on the SYLLABUS. ${typeInstruction}`;
        }

        const metadataInstruction = hasPattern ? `
            METADATA EXTRACTION: You MUST also extract the following metadata from the SAMPLE PATTERN and include it in "paper_metadata":
            - institution_name: The college/university/school name (e.g., "Marri Laxman Reddy Institute of Technology and Management")
            - subtitle: Any subtitle like autonomous status, affiliation (e.g., "AN AUTONOMOUS INSTITUTION - Affiliated to JNTUH")
            - exam_info: The exam title line (e.g., "B.Tech VIII Semester, Continuous Internal Examination (CIE-II), April-2026")
            - subject_code_name: Subject code and name (e.g., "2280558 - CLOUD COMPUTING")
            - branch: Branch/department info (e.g., "CSE/CSM/CSD/CSIT/IT")
            - duration: Time duration (e.g., "02 Hours")
            - max_marks: Maximum marks (e.g., "30M")
            - general_instructions: Array of instruction notes from the top of the paper (e.g., ["Question paper consists of Part-A and Part-B", "In Part-A, answer all questions which carries 10 marks", "In Part-B, answer any four questions which carries 20 marks"])
            - footer: Any footer info like date, time of exam, prepared by (e.g., "Date of Exam: 02.04.2026 | Time: 10:00AM-12:00PM | Prepared by: Course Coordinator")
            
            If any field is not found in the pattern, set it to null.
            ` : '';

        const finalSystemPrompt = `You are an expert AI question paper generator.
            
            TASK: Generate a question paper in JSON format.
            
            TOPIC SOURCE (SYLLABUS):
            "${fullSyllabusContext}"

            ${patternContext}

            === CRITICAL GENERATION INSTRUCTIONS ===
            DIFFICULTY LEVEL: ${difficulty}
            
            ${structureInstruction}
            
            ${metadataInstruction}
            ========================================
            
            CONSTRAINT: Output MUST be a valid JSON object ONLY. No conversational text.
            
            JSON SCHEMA:
            {
                "paper_metadata": {
                    "institution_name": "string | null",
                    "subtitle": "string | null",
                    "exam_info": "string | null",
                    "subject_code_name": "string | null",
                    "branch": "string | null",
                    "duration": "string | null",
                    "max_marks": "string | null",
                    "general_instructions": ["string"] | null,
                    "footer": "string | null"
                },
                "questions": [
                    {
                        "id": number,
                        "section": "string | null (e.g., 'PART-A', 'PART-B', 'Section A')",
                        "section_instruction": "string | null (e.g., 'Answer all questions. Each carries 1 mark.'). Only for FIRST question of each section.",
                        "type": "mcq" | "short" | "long",
                        "question": "string",
                        "options": ["string", "string", "string", "string"] | null,
                        "answer": "string",
                        "marks": number
                    }
                ]
            }
            `;

        let userPromptText = "Generate now in JSON format.";
        if (hasPattern && !isNaN(parsedCount) && parsedCount > 0) {
            userPromptText = `CRITICAL COMMAND: Generate EXACTLY ${parsedCount} NEW questions now from the syllabus in JSON format. Extract paper_metadata from the pattern. You MUST return exactly ${parsedCount} items in the questions array.`;
        } else if (hasPattern) {
            userPromptText = `CRITICAL COMMAND: You MUST count every single question in the SAMPLE PATTERN across ALL sections and generate EXACTLY that many NEW questions from the SYLLABUS. Match each section's question count and marks EXACTLY. Also extract ALL paper_metadata from the pattern (institution, subject, time, marks, instructions, footer). Output JSON now.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: finalSystemPrompt },
                { role: "user", content: userPromptText }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        const result = JSON.parse(content);

        // Save to DB
        db.run('INSERT INTO papers (user_id, syllabus, questions) VALUES (?, ?, ?)',
            [req.user.id, syllabusTitle, JSON.stringify(result.questions)],
            function (err) {
                if (err) console.error('Failed to save paper:', err);
            }
        );

        res.json(result);

    } catch (error) {
        console.error('Error generating paper:', error);
        res.status(500).json({ error: 'Failed to generate paper', details: error.message });
    }
});

// Serve index.html for any other route (React Router)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
