import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

interface UserRow {
  id: number;
  username: string;
  email: string;
  is_admin: number;
  is_active: number;
  created_at: string;
}

// Get user permissions
function getUserPermissions(userId: number): string[] {
  const permissions = db.prepare(`
    SELECT type FROM user_permissions WHERE user_id = ?
  `).all(userId) as { type: string }[];
  return permissions.map(p => p.type);
}

// Set user permissions (replace all)
function setUserPermissions(userId: number, types: string[]) {
  db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(userId);
  const insert = db.prepare('INSERT INTO user_permissions (user_id, type) VALUES (?, ?)');
  for (const type of types) {
    insert.run(userId, type);
  }
}

// GET /api/users - List all users
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT id, username, email, is_admin, is_active, created_at
      FROM users ORDER BY created_at DESC
    `).all() as UserRow[];

    const usersWithPermissions = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: !!user.is_admin,
      is_active: !!user.is_active,
      created_at: user.created_at,
      types: getUserPermissions(user.id),
    }));

    res.json(usersWithPermissions);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, is_admin, is_active, created_at
      FROM users WHERE id = ?
    `).get(parseInt(req.params.id)) as UserRow | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: !!user.is_admin,
      is_active: !!user.is_active,
      created_at: user.created_at,
      types: getUserPermissions(user.id),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create user
router.post('/', (req: AuthRequest, res: Response) => {
  const { username, email, password, is_admin, types } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  if (!types || !Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ error: 'At least one type permission required' });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES (?, ?, ?, ?)
    `).run(username, email, passwordHash, is_admin ? 1 : 0);

    const userId = result.lastInsertRowid as number;
    setUserPermissions(userId, types);

    res.status(201).json({
      id: userId,
      username,
      email,
      is_admin: !!is_admin,
      is_active: true,
      types,
    });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  const { username, email, password, is_admin, is_active, types } = req.body;

  // Prevent admin from disabling themselves
  if (req.user?.id === userId && is_active === false) {
    return res.status(400).json({ error: 'Cannot disable your own account' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      updates.push('password_hash = ?');
      values.push(bcrypt.hashSync(password, 10));
    }
    if (is_admin !== undefined) {
      updates.push('is_admin = ?');
      values.push(is_admin ? 1 : 0);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    if (types && Array.isArray(types)) {
      setUserPermissions(userId, types);
    }

    // Fetch updated user
    const user = db.prepare(`
      SELECT id, username, email, is_admin, is_active, created_at
      FROM users WHERE id = ?
    `).get(userId) as UserRow;

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: !!user.is_admin,
      is_active: !!user.is_active,
      created_at: user.created_at,
      types: getUserPermissions(userId),
    });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);

  // Prevent admin from deleting themselves
  if (req.user?.id === userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
