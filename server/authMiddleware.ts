import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'student_budget_manager_pro_secret_key_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      currency: user.currency,
      plan: user.plan,
      monthly_budget: user.monthly_budget,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name?: string;
      role: 'student' | 'admin';
      currency?: string;
      plan?: 'free' | 'premium' | 'pro';
      monthly_budget?: number;
    };
    let user = db.findUserById(decoded.id) || (decoded.email ? db.findUserByEmail(decoded.email) : undefined);
    if (!user && decoded.id && decoded.email) {
      // Rehydrate verified session user if serverless ephemeral storage reset on cold start
      user = db.createUser({
        id: decoded.id,
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email.toLowerCase(),
        password_hash: '',
        university: 'Personal / Business',
        semester: 'Active',
        currency: decoded.currency || 'PKR',
        monthly_budget: decoded.monthly_budget || 35000,
        role: decoded.role || 'student',
        plan: decoded.plan || 'free',
        created_at: new Date().toISOString(),
      });
    }
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }
    db.touchUserActivity(user.id);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privilege required.' });
    }
    next();
  });
}
