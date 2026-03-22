import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';

async function test() {
    console.log('--- Diagnosis Start ---');

    // Test Bcrypt
    try {
        const hash = await bcrypt.hash('testpassword', 10);
        console.log('Bcrypt: OK (Hash generated)');
        const match = await bcrypt.compare('testpassword', hash);
        console.log('Bcrypt Match: OK');
    } catch (err) {
        console.error('Bcrypt Error:', err);
    }

    // Test DB
    const dbPath = path.resolve('server/users.db');
    console.log('Checking DB at:', dbPath);
    const db = new sqlite3.Database(dbPath);

    db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="users"', [], (err, row) => {
        if (err) {
            console.error('DB Table Check Error:', err);
        } else if (row) {
            console.log('DB Table "users": OK');
        } else {
            console.error('DB Table "users": MISSING');
        }
        db.close();
        console.log('--- Diagnosis End ---');
    });
}

test();
