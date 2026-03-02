import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Basic hash for demo purposes (matching frontend's simpleHash or assuming plaintext for now if not using bcrypt)
// In a real app, use bcrypt.
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

router.post('/register', async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const db = await getDb();
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const id = uuidv4();
        const hashedPassword = simpleHash(password);
        const avatars = ['😀', '🧑‍💼', '🧑‍🔧', '🧑‍🎓', '🦸', '🧙', '🤖'];
        const avatar = avatars[Math.floor(Math.random() * avatars.length)];

        await db.run(
            'INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, email, hashedPassword, role || 'developer', avatar]
        );

        const newUser = await db.get('SELECT id, name, email, role, avatar, emailVerified, createdAt FROM users WHERE id = ?', id);

        // Return a mock session token
        res.status(201).json({ user: newUser, token: `token-${id}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const hashedPassword = simpleHash(password);
        // Allow plaintext password fallback for seeded users or testing if needed
        if (user.password !== hashedPassword && user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userResponse = { ...user };
        delete userResponse.password;

        res.json({ user: userResponse, token: `token-${user.id}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/google', async (req: Request, res: Response) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
    }

    try {
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID as string,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ error: 'Invalid Google token payload' });
        }

        const { email, name, picture } = payload;
        if (!email) {
            return res.status(400).json({ error: 'Google account has no email' });
        }

        const db = await getDb();
        let user = await db.get('SELECT * FROM users WHERE email = ?', email);

        if (!user) {
            const id = uuidv4();
            const role = 'developer'; // default role
            const avatar = picture || '😀';
            // Store simple Hash or just random password, as they use google.
            const randomPassword = uuidv4();
            const hashedPassword = simpleHash(randomPassword);

            await db.run(
                'INSERT INTO users (id, name, email, password, role, avatar, emailVerified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, name || 'Google User', email, hashedPassword, role, avatar, true]
            );

            user = await db.get('SELECT id, name, email, role, avatar, emailVerified, createdAt FROM users WHERE id = ?', id);
        } else {
            const userResponse = { ...user };
            delete userResponse.password;
            user = userResponse;
        }

        res.json({ user, token: `token-${user.id}` });
    } catch (err) {
        console.error("Google Auth Error", err);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

export default router;
