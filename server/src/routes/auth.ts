import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { AuthRequest, generateToken } from '../middleware/auth.js';

const router = Router();

interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_admin: number;
  is_active: number;
}

// Get user permissions
function getUserPermissions(userId: number): string[] {
  const permissions = db.prepare(`
    SELECT type FROM user_permissions WHERE user_id = ?
  `).all(userId) as { type: string }[];
  return permissions.map(p => p.type);
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = db.prepare(`
      SELECT id, username, email, password_hash, is_admin, is_active
      FROM users WHERE username = ?
    `).get(username) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const types = getUserPermissions(user.id);
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: !!user.is_admin,
      types,
    });

    // Set HTTP-only cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: !!user.is_admin,
        types,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', (req: AuthRequest, res: Response) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const user = db.prepare(`
      SELECT id, username, email, is_admin, is_active
      FROM users WHERE id = ?
    `).get(decoded.id) as Omit<User, 'password_hash'> | undefined;

    if (!user || !user.is_active) {
      res.clearCookie('access_token');
      return res.status(401).json({ error: 'User not found or disabled' });
    }

    const types = getUserPermissions(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: !!user.is_admin,
        types,
      },
    });
  } catch (error) {
    res.clearCookie('access_token');
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
