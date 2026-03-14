import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import type { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  fastId: string;
  role: Role;
  type: 'access' | 'refresh';
}

export interface AuthRequest extends Request {
  user?: { id: string; fastId: string; role: Role };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.cookies?.accessToken ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    if (decoded.type !== 'access') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, fastId: true, role: true },
    });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
