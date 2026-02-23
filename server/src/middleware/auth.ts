import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, UserRole } from '../types/index.js';

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (req: AuthedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: 'Missing token' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (role: UserRole) => (req: AuthedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== role) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};
