import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const db = await getDb();
        const notifications = await db.all('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC', userId);

        // Convert integer boolean back to real boolean for frontend
        const parsedNotifications = notifications.map(n => ({
            ...n,
            read: !!n.read
        }));

        res.json(parsedNotifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.put('/:id/read', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const db = await getDb();
        await db.run('UPDATE notifications SET read = 1 WHERE id = ?', id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read notification' });
    }
});

router.put('/user/:userId/read-all', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const db = await getDb();
        await db.run('UPDATE notifications SET read = 1 WHERE userId = ?', userId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read all notifications' });
    }
});

export default router;
