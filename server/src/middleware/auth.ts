import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  types: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface JWTPayload {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  types: string[];
}

// Get user permissions from database
function getUserPermissions(userId: number): string[] {
  const permissions = db.prepare(`
    SELECT type FROM user_permissions WHERE user_id = ?
  `).all(userId) as { type: string }[];
  return permissions.map(p => p.type);
}

// Verify JWT token and attach user to request
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Refresh permissions from DB in case they changed
    const types = getUserPermissions(decoded.id);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      is_admin: decoded.is_admin,
      types,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Require admin privileges
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Check if user has access to a specific accreditation type
export function requireTypeAccess(type: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins have access to all types
    if (req.user.is_admin) {
      return next();
    }

    if (!req.user.types.includes(type)) {
      return res.status(403).json({ error: `No access to type: ${type}` });
    }

    next();
  };
}

// Helper to get accessible types for a user
export function getAccessibleTypes(user: AuthUser): string[] {
  if (user.is_admin) {
    return ['premsa', 'professional', 'nitoman'];
  }
  return user.types;
}

// Generate JWT token
export function generateToken(user: { id: number; username: string; email: string; is_admin: boolean; types: string[] }): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      types: user.types,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
