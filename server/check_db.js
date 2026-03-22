import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'c:/Users/andes/OneDrive/Desktop/RISHI/server/users.db';
const db = new sqlite3.Database(dbPath);

console.log('--- DB Check Start ---');
db.all('SELECT id, email, is_verified FROM users', [], (err, rows) => {
    if (err) {
        console.error('Error reading users:', err);
    } else {
        console.log('Users in DB:');
        console.table(rows);
    }
    db.close();
    console.log('--- DB Check End ---');
});
