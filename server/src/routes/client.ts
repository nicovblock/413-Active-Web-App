import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth.js';
import { sanitizeText } from '../utils/sanitize.js';

const weightSchema = z.object({ weight: z.number().positive(), loggedAt: z.string().datetime() });
const mealSchema = z.object({ mealName: z.string().min(1).max(120), calories: z.number().int().nonnegative(), loggedAt: z.string().datetime(), source: z.string().max(50).optional() });
const subscriptionSchema = z.object({ tier: z.enum(['basic', 'pro', 'elite']), status: z.enum(['active', 'paused', 'cancelled']) });

const clientRouter = Router();
clientRouter.use(authenticate, requireRole('client'));

clientRouter.get('/dashboard', (req: AuthedRequest, res) => {
  const clientId = req.user!.userId;
  const workouts = db.prepare('SELECT * FROM workouts WHERE client_id = ? ORDER BY scheduled_for').all(clientId);
  const weights = db.prepare('SELECT * FROM weight_entries WHERE client_id = ? ORDER BY logged_at DESC').all(clientId);
  const meals = db.prepare('SELECT * FROM meals WHERE client_id = ? ORDER BY logged_at DESC').all(clientId);
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE client_id = ?').get(clientId);
  res.json({ workouts, weights, meals, subscription });
});

clientRouter.post('/weights', (req: AuthedRequest, res) => {
  const parsed = weightSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const result = db.prepare('INSERT INTO weight_entries (client_id, weight, logged_at) VALUES (?, ?, ?)').run(req.user!.userId, parsed.data.weight, parsed.data.loggedAt);
  res.status(201).json({ id: result.lastInsertRowid });
});

clientRouter.post('/meals', (req: AuthedRequest, res) => {
  const parsed = mealSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const result = db.prepare('INSERT INTO meals (client_id, meal_name, calories, source, logged_at) VALUES (?, ?, ?, ?, ?)').run(req.user!.userId, sanitizeText(parsed.data.mealName), parsed.data.calories, sanitizeText(parsed.data.source || 'manual'), parsed.data.loggedAt);
  res.status(201).json({ id: result.lastInsertRowid });
});

clientRouter.put('/subscription', (req: AuthedRequest, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  db.prepare("UPDATE subscriptions SET tier = ?, status = ?, updated_at = datetime('now') WHERE client_id = ?").run(parsed.data.tier, parsed.data.status, req.user!.userId);
  res.json({ message: 'Subscription updated' });
});

clientRouter.get('/export.csv', (req: AuthedRequest, res) => {
  const clientId = req.user!.userId;
  const workouts = db.prepare('SELECT title, scheduled_for FROM workouts WHERE client_id = ?').all(clientId) as Array<{ title: string; scheduled_for: string }>;
  const weights = db.prepare('SELECT weight, logged_at FROM weight_entries WHERE client_id = ?').all(clientId) as Array<{ weight: number; logged_at: string }>;
  const meals = db.prepare('SELECT meal_name, calories, logged_at FROM meals WHERE client_id = ?').all(clientId) as Array<{ meal_name: string; calories: number; logged_at: string }>;

  const lines = ['type,name_or_value,date,extra'];
  workouts.forEach((w) => lines.push(`workout,${w.title},${w.scheduled_for},-`));
  weights.forEach((w) => lines.push(`weight,${w.weight},${w.logged_at},lbs`));
  meals.forEach((m) => lines.push(`meal,${m.meal_name},${m.logged_at},${m.calories} kcal`));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fitness-export.csv"');
  res.send(lines.join('\n'));
});

export default clientRouter;
