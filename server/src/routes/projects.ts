import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { cloneAndAnalyzeRepo } from '../ai/analyzer';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const projects = await db.all('SELECT * FROM projects ORDER BY createdAt DESC');
        // If we needed to fetch members, we'd need a project_members table. For now, matching original simple layout.
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

router.post('/', async (req: Request, res: Response) => {
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

router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, repoUrl } = req.body;

    try {
        const db = await getDb();
        const now = new Date().toISOString();

        await db.run(
            'UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), repoUrl = COALESCE(?, repoUrl), updatedAt = ? WHERE id = ?',
            [name, description, repoUrl, now, id]
        );

        const updatedProject = await db.get('SELECT * FROM projects WHERE id = ?', id);
        if (!updatedProject) return res.status(404).json({ error: 'Project not found' });

        res.json(updatedProject);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const db = await getDb();
        await db.run('DELETE FROM projects WHERE id = ?', id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

router.post('/:id/analyze', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const db = await getDb();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', id);

        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (!project.repoUrl) return res.status(400).json({ error: 'Project does not have a repository URL linked' });

        console.log(`Starting analysis for project ${project.name} using repo ${project.repoUrl}`);

        try {
            const detectedBugs = await cloneAndAnalyzeRepo(project.repoUrl, project.id);
            console.log(`Analysis complete. Found ${detectedBugs.length} bugs.`);

            // Get some users to randomly assign
            const users = await db.all("SELECT id, name FROM users WHERE role = 'developer' OR role = 'tester'");

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
                    } else if ((bug.severity === 'high' || bug.severity === 'critical') && users.length > 0) {
                        const randomAssignee = users[Math.floor(Math.random() * users.length)];
                        assigneeId = randomAssignee.id;
                        assigneeName = randomAssignee.name;
                    }

                    await db.run(
                        `INSERT INTO bugs 
               (id, title, description, severity, predictedSeverity, publicImpact, status, projectId, aiAnalyzed, reporterName, assigneeId, assigneeName) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [bugId, bug.title, bug.description, bug.severity, bug.severity, bug.publicImpact || null, status, bug.projectId, 1, 'AI Engine', assigneeId, assigneeName]
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


export default router;
