/**
 * server/src/routes/bugs.ts
 * 
 * BUG TRACKING API ROUTER
 * 
 * Defines all standard CRUD (Create, Read, Update, Delete) endpoints for Bug Reports.
 * 
 * Key Features:
 * 1. GET '/': Fetches ALL bugs, but also manually JOINs their relations 
 *    (comments, history, attachments) from separate SQLite tables into nested JSON arrays
 *    so the frontend gets a complete object.
 * 2. POST/PUT endpoints: Handles creating bugs, updating fields, reassigning, 
 *    changing statuses, and leaving comments.
 * 3. Notifications: Certain actions (like changing a status or reassigning a bug)
 *    automatically trigger an insert into the `notifications` table for the affected user.
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const bugs = await db.all('SELECT * FROM bugs ORDER BY createdAt DESC');

        // We need to fetch relationships (comments, history, attachments) for each bug
        const comments = await db.all('SELECT * FROM comments');
        const history = await db.all('SELECT * FROM bug_status_history');
        const attachments = await db.all('SELECT * FROM attachments');

        const bugsWithRelations = bugs.map(b => ({
            ...b,
            tags: [], // Assuming tags might be added later if needed, currently not in DB
            comments: comments.filter(c => c.bugId === b.id),
            statusHistory: history.filter(h => h.bugId === b.id),
            attachments: attachments.filter(a => a.bugId === b.id)
        }));

        res.json(bugsWithRelations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bugs' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    const bug = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
        const db = await getDb();
        await db.run(
            `INSERT INTO bugs 
            (id, title, description, stepsToReproduce, expectedBehavior, actualBehavior, severity, publicImpact, status, projectId, reporterId, reporterName, aiAnalyzed, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, bug.title, bug.description, bug.stepsToReproduce, bug.expectedBehavior, bug.actualBehavior, bug.severity, bug.publicImpact || null, 'new', bug.projectId, bug.reporterId, bug.reporterName, 0, now, now]
        );

        const newBug = await db.get('SELECT * FROM bugs WHERE id = ?', id);
        res.status(201).json({ ...newBug, comments: [], statusHistory: [], attachments: [], tags: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create bug' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    try {
        const db = await getDb();

        // Allowed columns to prevent SQL injection in dynamic query builder
        const allowedColumns = [
            'title', 'description', 'stepsToReproduce', 'expectedBehavior',
            'actualBehavior', 'severity', 'predictedSeverity', 'severityConfidence',
            'publicImpact', 'status', 'projectId', 'reporterId', 'reporterName',
            'assigneeId', 'assigneeName', 'fileLocation', 'aiAnalyzed'
        ];

        // Dynamic update query builder
        const setClauses: string[] = [];
        const values: any[] = [];
        for (const [key, value] of Object.entries(updates)) {
            // Ignore relations or read-only fields, and enforce strict column whitelist
            if (['id', 'createdAt', 'comments', 'statusHistory', 'attachments', 'tags'].includes(key)) continue;
            if (!allowedColumns.includes(key)) continue; // Defense in depth: ignore unknown columns

            setClauses.push(`${key} = ?`);
            values.push(value);
        }

        if (setClauses.length === 0) {
            return res.json(await db.get('SELECT * FROM bugs WHERE id = ?', id));
        }

        setClauses.push('updatedAt = ?');
        values.push(now);
        values.push(id);

        await db.run(`UPDATE bugs SET ${setClauses.join(', ')} WHERE id = ?`, values);

        const updatedBug = await db.get('SELECT * FROM bugs WHERE id = ?', id);
        res.json(updatedBug);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update bug' });
    }
});

router.put('/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, userId, userName } = req.body;
    const now = new Date().toISOString();

    try {
        const db = await getDb();
        const bug = await db.get('SELECT * FROM bugs WHERE id = ?', id);
        if (!bug) return res.status(404).json({ error: 'Bug not found' });

        await db.run('UPDATE bugs SET status = ?, updatedAt = ? WHERE id = ?', [status, now, id]);

        const historyId = uuidv4();
        await db.run(
            'INSERT INTO bug_status_history (id, bugId, from_status, to_status, userId, userName, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [historyId, id, bug.status, status, userId, userName, now]
        );

        // Notify assignee/reporter automatically if needed
        // For now, depending on frontend to send explicitly, but could do it here:
        if (bug.assigneeId || bug.reporterId) {
            const targetId = bug.assigneeId || bug.reporterId;
            if (targetId !== userId) {
                await db.run('INSERT INTO notifications (id, userId, message, type, bugId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), targetId, `Bug "${bug.title}" status changed to ${status}`, 'status', id, now]);
            }
        }

        res.json({ success: true, newStatus: status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to change bug status' });
    }
});

router.put('/:id/assign', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, userName } = req.body;
    const now = new Date().toISOString();

    try {
        const db = await getDb();
        const bug = await db.get('SELECT * FROM bugs WHERE id = ?', id);
        if (!bug) return res.status(404).json({ error: 'Bug not found' });

        await db.run('UPDATE bugs SET assigneeId = ?, assigneeName = ?, updatedAt = ? WHERE id = ?', [userId, userName, now, id]);

        if (userId) {
            await db.run('INSERT INTO notifications (id, userId, message, type, bugId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                [uuidv4(), userId, `You have been assigned bug: ${bug.title}`, 'assignment', id, now]);
        }

        res.json({ success: true, assigneeId: userId, assigneeName: userName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to assign bug' });
    }
});

router.post('/:id/comments', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, userName, text } = req.body;
    const commentId = uuidv4();
    const now = new Date().toISOString();

    try {
        const db = await getDb();
        await db.run(
            'INSERT INTO comments (id, bugId, userId, userName, text, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [commentId, id, userId, userName, text, now]
        );

        await db.run('UPDATE bugs SET updatedAt = ? WHERE id = ?', [now, id]);

        const newComment = await db.get('SELECT * FROM comments WHERE id = ?', commentId);
        res.status(201).json(newComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

router.post('/:id/attachments', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fileUrl, fileName, fileSize, uploadedBy } = req.body;
    const attachmentId = uuidv4();
    const now = new Date().toISOString();

    try {
        const db = await getDb();
        await db.run(
            'INSERT INTO attachments (id, bugId, fileUrl, fileName, fileSize, uploadedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [attachmentId, id, fileUrl, fileName, fileSize, uploadedBy, now]
        );

        await db.run('UPDATE bugs SET updatedAt = ? WHERE id = ?', [now, id]);

        const newAttachment = await db.get('SELECT * FROM attachments WHERE id = ?', attachmentId);
        res.status(201).json(newAttachment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add attachment' });
    }
});

export default router;
