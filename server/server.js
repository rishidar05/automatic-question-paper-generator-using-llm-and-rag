import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import multer from 'multer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

const upload = multer({ storage: multer.memoryStorage() });

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(express.json());

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
    apiKey: process.env.GROQ_API_KEY
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

// Email Helper
const sendOtpEmail = async (email, otp) => {
    const msg = {
        to: email,
        from: 'anderishidarreddy@gmail.com', // Verified sender
        subject: 'Your ExamGen AI Verification Code',
        text: `Your OTP is: ${otp}`,
        html: `<strong>Your OTP is: ${otp}</strong>`,
    };
    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response) console.error(error.response.body);
        // Fallback to console for demo if email fails
        console.log('\n====================================================');
        console.log(` FALLBACK OTP (Use this to login): ${otp}`);
        console.log('====================================================\n');
    }
};

// AUTH ROUTES

// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = '123456'; // Default for Development

        db.run('INSERT INTO users (email, password, otp) VALUES (?, ?, ?)', [email, hashedPassword, otp], async function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) return res.status(400).json({ error: 'User already exists' });
                return res.status(500).json({ error: err.message });
            }
            await sendOtpEmail(email, otp);
            res.json({ message: 'Signup successful. Check your email for OTP.' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });

        if (user.otp === otp) {
            db.run('UPDATE users SET is_verified = 1, otp = NULL WHERE id = ?', [user.id]);
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({ token, message: 'Verified successfully' });
        } else {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const otp = '123456'; // Default for Development
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
app.post('/api/generate-paper', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { syllabus, count, difficulty = 'medium', type = 'mix' } = req.body;

        if (!syllabus) {
            return res.status(400).json({ error: 'Syllabus is required' });
        }

        console.log('--- Request Debug ---');
        console.log('Body:', req.body);
        console.log('File present:', !!req.file);

        const numQuestions = count || 5;

        // Strict Type Enforcement
        let typeInstruction = "";
        if (type === 'mcq') {
            typeInstruction = "Strictly generate ONLY Multiple Choice Questions (MCQ).";
        } else if (type === 'short' || type === 'long') {
            typeInstruction = "Strictly generate ONLY text-based questions. DO NOT include options. Return 'null' for options field.";
        } else {
            typeInstruction = "Generate a balanced mix of Multiple Choice Questions (MCQ), Short Answer, and Long Answer questions.";
        }

        let fileText = '';
        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                try {
                    const pdfData = await pdf(req.file.buffer);
                    fileText = pdfData.text;
                } catch (e) {
                    console.error('PDF Parse Error', e);
                    throw new Error('Failed to parse PDF content');
                }
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                try {
                    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
                    fileText = result.value;
                } catch (e) {
                    console.error('DOCX Parse Error', e);
                    throw new Error('Failed to parse DOCX content');
                }
            } else {
                fileText = req.file.buffer.toString();
            }
            console.log('--- DEBUG: File Upload Info ---');
            console.log('MimeType:', req.file.mimetype);
            console.log('Size:', req.file.size);
            console.log('Extracted Text Preview:', fileText.substring(0, 500));
            console.log('-------------------------------');

            if (!fileText || fileText.trim().length < 50) {
                return res.status(400).json({
                    error: 'Unable to read text from file. If this is a scanned PDF (images), please convert it to a text-based PDF or DOCX file.'
                });
            }
        }

        let finalSystemPrompt;

        if (req.file) {
            // Stronger prompt for file upload case
            finalSystemPrompt = `You are an expert exam setter.
            CRITICAL INSTRUCTION: You must completely IGNORE the default "count", "difficulty", and "type" parameters.
            
            YOUR GOAL: Generate a question paper for Syllabus: "${syllabus}" by STRICTLY following the format/structure defined in the FILE CONTENT below.
            
            --- BEGIN FILE CONTENT ---
            ${fileText}
            --- END FILE CONTENT ---

            INSTRUCTIONS:
            1. ANALYZE the file to understand the Structure (Count, Types, Marks).
            2. Generate NEW UNIQUE questions based on the Syllabus: "${syllabus}".
            3. DO NOT COPY any questions from the file. Use the file ONLY as a structure template.
            4. If the file has 5 MCQs, generate 5 NEW MCQs.
            5. The Structure (counts/types) must match the file exactly, but the Content must be new.

            OUTPUT FORMAT:
            Start the response with a valid JSON object.
            Schema:
            {
                "plan": "Briefly state what structure you identified in the file",
                "questions": [
                    {
                        "id": number,
                        "type": "mcq" | "short" | "long",
                        "question": "The question text",
                        "options": ["Option A", "Option B", "Option C", "Option D"] (ONLY if type is mcq, otherwise null),
                        "answer": "The correct answer or key points",
                        "marks": number
                    }
                ]
            }
            Do not include markdown.`;
        } else {
            // Default prompt for manual settings
            finalSystemPrompt = `You are a helpful assistant that generates expert question papers. 
            Generate ${numQuestions} questions based on Syllabus: "${syllabus}".
            Difficulty Level: ${difficulty}.
            Question Type: ${type} (${typeInstruction}).
            
            The output must be a valid JSON object with a key "questions" which is an array of objects.
            Each object MUST follow this schema:
            {
                "id": number,
                "type": "mcq" | "short" | "long",
                "question": "The question text",
                "options": ["Option A", "Option B", "Option C", "Option D"] (ONLY if type is mcq, otherwise null),
                "answer": "The correct answer or key points",
                "marks": number (e.g. 1 for mcq, 5 for long)
            }
            Do not include markdown or extra text.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: finalSystemPrompt },
                { role: "user", content: "Generate now." }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        const result = JSON.parse(content);

        // Save to DB
        db.run('INSERT INTO papers (user_id, syllabus, questions) VALUES (?, ?, ?)',
            [req.user.id, syllabus, JSON.stringify(result.questions)],
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
