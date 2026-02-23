import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/database.js';

const authRouter = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['client', 'coach'])
});

authRouter.post('/register', (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const { email, password, role } = parsed.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
  if (existing) return res.status(409).json({ message: 'Email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
    .run(email, hash, role);

  if (role === 'client') {
    db.prepare('INSERT INTO subscriptions (client_id, tier, status) VALUES (?, ?, ?)').run(result.lastInsertRowid, 'basic', 'active');
  }

  return res.status(201).json({ message: 'Registered successfully' });
});

authRouter.post('/login', (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email) as
    | { id: number; email: string; password_hash: string; role: 'client' | 'coach' }
    | undefined;

  if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});

export default authRouter;
