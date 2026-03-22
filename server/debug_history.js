import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import fs from 'fs';

const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url)));

const JWT_SECRET = settings.JWT_SECRET || 'super_secret_key_123';
const PORT = settings.PORT || 3000;

const db = new sqlite3.Database('users.db');

db.get("SELECT * FROM users LIMIT 1", async (err, user) => {
    if (err || !user) {
        console.error("User not found", err);
        return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log("Testing /api/history...");

    try {
        const res = await axios.get(`http://localhost:${PORT}/api/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("History Items:", res.data.length);
        if (res.data.length > 0) {
            console.log("First Item Syllabus:", res.data[0].syllabus);
            console.log("First Item Questions Type:", typeof res.data[0].questions);
            console.log("First Item Questions Sample:", JSON.stringify(res.data[0].questions).slice(0, 100));
        }
    } catch (error) {
        console.error("FAILED!", error.message);
        if (error.response) console.error(error.response.data);
    }
});
