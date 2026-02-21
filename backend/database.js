import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'scores.db');

let db;

export async function initDB() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS score_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      contributions INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Migration: Ensure contributions column exists for older databases
    try {
        await db.exec('ALTER TABLE score_history ADD COLUMN contributions INTEGER DEFAULT 0');
        console.log('Migration: Added contributions column to score_history');
    } catch (e) {
        // Column likely already exists
    }

    console.log('Database initialized at', dbPath);
}

export async function saveScore(username, score, contributions = 0, timestamp = Date.now()) {
    if (!db) await initDB();
    const normalizedUsername = username.toLowerCase();
    await db.run(
        'INSERT INTO score_history (username, score, contributions, timestamp) VALUES (?, ?, ?, ?)',
        [normalizedUsername, score, contributions, timestamp]
    );
}

export async function getHistory(username) {
    if (!db) await initDB();
    const normalizedUsername = username.toLowerCase();
    return await db.all(
        'SELECT score, contributions, timestamp FROM score_history WHERE username = ? ORDER BY timestamp ASC',
        [normalizedUsername]
    );
}
