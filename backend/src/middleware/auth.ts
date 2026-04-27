import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
// TypeScript can't narrow module-level const through throw guards; assert after the guard.
const JWT_SECRET_KEY = JWT_SECRET as string;

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET_KEY);
    if (typeof payload === 'string' || !payload.sub || typeof payload.sub !== 'string') {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.userId = payload.sub;
    req.userRole = typeof payload.role === 'string' ? payload.role : undefined;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
