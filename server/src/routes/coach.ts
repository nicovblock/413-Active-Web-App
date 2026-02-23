import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { sanitizeText } from '../utils/sanitize.js';
import type { Server } from 'socket.io';
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth.js';

const assignSchema = z.object({
  clientId: z.number().int().positive(),
  title: z.string().min(2).max(120),
  notes: z.string().max(500).optional(),
  scheduledFor: z.string().datetime()
});

export const createCoachRouter = (io: Server) => {
  const coachRouter = Router();

  coachRouter.use(authenticate, requireRole('coach'));

  coachRouter.get('/clients', (_req, res) => {
    const clients = db.prepare("SELECT id, email FROM users WHERE role='client' ORDER BY email").all();
    res.json(clients);
  });

  coachRouter.post('/workouts', (req: AuthedRequest, res) => {
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

    const values = parsed.data;
    const result = db
      .prepare(
        `INSERT INTO workouts (client_id, coach_id, title, notes, scheduled_for, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(
        values.clientId,
        req.user?.userId,
        sanitizeText(values.title),
        sanitizeText(values.notes || ''),
        values.scheduledFor
      );

    const workout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid);
    io.to(`client:${values.clientId}`).emit('workout:updated', workout);
    return res.status(201).json(workout);
  });

  return coachRouter;
};
