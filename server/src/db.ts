/**
 * server/src/db.ts
 * 
 * DATABASE LAYER
 * 
 * This file handles the direct connection to the SQLite database (`dev.db`).
 * 1. Checks if the database file exists, resolving it via `path.join()`.
 * 2. Uses the `sqlite` AND `sqlite3` packages to open a persistent connection.
 * 3. `initDb()` automatically creates the necessary tables (`users`, `bugs`, etc.) 
 *    if they don't exist yet (very useful for first-time setup).
 * 4. `seedDb()` injects dummy admin/developer users so the app is instantly usable
 *    without requiring a manual registration.
 */
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.join(__dirname, '..', 'dev.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initDb(dbInstance);
  await seedDb(dbInstance);

  return dbInstance;
}

async function initDb(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'developer',
      avatar TEXT,
      emailVerified BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      repoUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bugs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      stepsToReproduce TEXT,
      expectedBehavior TEXT,
      actualBehavior TEXT,
      severity TEXT NOT NULL,
      predictedSeverity TEXT,
      severityConfidence REAL,
      publicImpact TEXT,
      status TEXT DEFAULT 'new',
      projectId TEXT NOT NULL,
      reporterId TEXT,
      reporterName TEXT,
      assigneeId TEXT,
      assigneeName TEXT,
      fileLocation TEXT,
      aiAnalyzed BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      bugId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      bugId TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      text TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bugId) REFERENCES bugs(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bug_status_history (
      id TEXT PRIMARY KEY,
      bugId TEXT NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bugId) REFERENCES bugs(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      bugId TEXT NOT NULL,
      fileUrl TEXT NOT NULL,
      fileName TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      uploadedBy TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bugId) REFERENCES bugs(id)
    );
  `);
}

// In case we want to re-init some default data without prisma:
export async function seedDb(db: Database) {
  // Check if admin exists to avoid duplicating seeds
  const existingAdmin = await db.get("SELECT email FROM users WHERE email = 'admin@bugtracker.com'");
  if (!existingAdmin) {
    console.log("Seeding default demo users...");
    await db.exec(`
      INSERT INTO users (id, name, email, password, role, avatar, emailVerified) VALUES 
      ('demo-admin-1', 'Admin User', 'admin@bugtracker.com', 'admin123', 'admin', '👑', 1),
      ('demo-dev-2', 'Jane Developer', 'jane@bugtracker.com', 'pass123', 'developer', '👩‍💻', 1),
      ('demo-tester-3', 'Bob Tester', 'bob@bugtracker.com', 'pass123', 'tester', '🔍', 1);
    `);
  }
}
