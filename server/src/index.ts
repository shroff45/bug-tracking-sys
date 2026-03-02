/**
 * server/src/index.ts
 * 
 * CORE BACKEND ENTRY POINT
 * 
 * This file boots up the Express.js HTTP server.
 * It's responsible for:
 * 1. Wiring up global middleware (CORS for cross-origin requests, JSON body parsing).
 * 2. Loading environment variables (like GEMINI_API_KEY) via `dotenv`.
 * 3. Mounting the route handlers `/api/*` derived from individual router files.
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { getDb } from './db';
import { cloneAndAnalyzeRepo } from './ai/analyzer';

// Initialize environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors()); // Allows frontend running on different port to access API
app.use(express.json()); // Parses incoming JSON payloads into `req.body`

// API Route modularization: Each feature has its own file in `src/routes/`
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import projectsRoutes from './routes/projects';
import bugsRoutes from './routes/bugs';
import notificationsRoutes from './routes/notifications';
import aiRoutes from './routes/ai';

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/bugs', bugsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'BugTracker AI Backend is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

