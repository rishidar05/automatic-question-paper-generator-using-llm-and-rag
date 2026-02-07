import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database('users.db');

db.get("SELECT * FROM users LIMIT 1", async (err, user) => {
    if (err) {
        console.error("DB Error:", err);
        return;
    }
    if (!user) {
        console.error("No users found. Cannot test.");
        return;
    }

    console.log("Found User ID:", user.id);
    // Generate valid token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log("Generated Token. Testing /api/solve...");

    try {
        const res = await axios.post(`http://localhost:${PORT}/api/solve`, {
            text: "Explain Newton's Second Law"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS! Solution:", res.data.solution);
    } catch (error) {
        console.error("FAILED!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
});
