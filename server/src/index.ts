import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { getDb } from './db';
import { cloneAndAnalyzeRepo } from './ai/analyzer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'BugTracker AI Backend is running' });
});

app.get('/api/projects', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const projects = await db.all('SELECT * FROM projects ORDER BY createdAt DESC');
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', async (req: Request, res: Response) => {
    const { name, description, repoUrl } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    const id = `p${Date.now()}`;
    const now = new Date().toISOString();

    try {
        const db = await getDb();
        await db.run(
            'INSERT INTO projects (id, name, description, repoUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, description || '', repoUrl || '', now, now]
        );

        const newProject = await db.get('SELECT * FROM projects WHERE id = ?', id);
        res.status(201).json(newProject);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.post('/api/projects/:id/analyze', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const db = await getDb();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (!project.repoUrl) {
            return res.status(400).json({ error: 'Project does not have a repository URL linked' });
        }

        // Start analysis and await it
        console.log(`Starting analysis for project ${project.name} using repo ${project.repoUrl}`);

        try {
            const detectedBugs = await cloneAndAnalyzeRepo(project.repoUrl, project.id);
            console.log(`Analysis complete. Found ${detectedBugs.length} bugs.`);

            // Default hardcoded assignees from store.tsx
            const defaultAssignees = [
                { id: 'u2', name: 'Jane Developer' },
                { id: 'u3', name: 'Bob Tester' },
                { id: 'u4', name: 'Alice Dev' },
                { id: 'u5', name: 'Charlie QA' }
            ];

            // Save to DB
            if (detectedBugs.length > 0) {
                for (const bug of detectedBugs) {
                    const bugId = `b${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                    let status = 'new';
                    let assigneeId = null;
                    let assigneeName = null;

                    if (bug.severity === 'low') {
                        status = 'resolved';
                        assigneeId = 'ai-solver';
                        assigneeName = 'AI Auto-Solver';
                    } else if (bug.severity === 'high' || bug.severity === 'critical') {
                        // Randomly assign to a dev/tester
                        const randomAssignee = defaultAssignees[Math.floor(Math.random() * defaultAssignees.length)];
                        assigneeId = randomAssignee?.id || null;
                        assigneeName = randomAssignee?.name || null;
                    }

                    await db.run(
                        `INSERT INTO bugs 
               (id, title, description, severity, status, projectId, aiAnalyzed, reporterName, assigneeId, assigneeName) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [bugId, bug.title, bug.description, bug.severity, status, bug.projectId, 1, 'AI Engine', assigneeId, assigneeName]
                    );
                }
            }
            res.json({ message: 'Analysis complete.', bugsFound: detectedBugs.length });
        } catch (err) {
            console.error('Analysis failed:', err);
            res.status(500).json({ error: 'Background analysis failed during execution' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to start analysis' });
    }
});

app.get('/api/bugs', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const bugs = await db.all('SELECT * FROM bugs ORDER BY createdAt DESC');
        res.json(bugs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bugs' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
