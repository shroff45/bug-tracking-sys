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

    return dbInstance;
}

async function initDb(db: Database) {
    await db.exec(`
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
  `);
}
