import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const users = await db.all('SELECT id, name, email, role, avatar, emailVerified, createdAt FROM users ORDER BY name ASC');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.put('/:id/role', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }

    try {
        const db = await getDb();
        await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        const updatedUser = await db.get('SELECT id, name, email, role, avatar, emailVerified, createdAt FROM users WHERE id = ?', id);

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const db = await getDb();
        await db.run('DELETE FROM users WHERE id = ?', id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


export default router;
