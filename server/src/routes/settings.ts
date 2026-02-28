import { Router, Response } from 'express';
import db from '../db/index.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

interface TypeSettings {
  type: string;
  auto_assign_codes: number;
  auto_send_emails: number;
  display_name: string;
}

// GET /api/settings/:type - Get settings for a specific type
router.get('/:type', (req: AuthRequest, res: Response) => {
  const { type } = req.params;

  // Check type access
  if (!req.user?.is_admin && !req.user?.types.includes(type)) {
    return res.status(403).json({ error: 'No access to this type' });
  }

  try {
    const settings = db.prepare(`
      SELECT type, auto_assign_codes, auto_send_emails, display_name
      FROM type_settings WHERE type = ?
    `).get(type) as TypeSettings | undefined;

    if (!settings) {
      return res.status(404).json({ error: 'Type not found' });
    }

    res.json({
      type: settings.type,
      auto_assign_codes: !!settings.auto_assign_codes,
      auto_send_emails: !!settings.auto_send_emails,
      display_name: settings.display_name,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/:type - Update settings for a specific type
router.put('/:type', (req: AuthRequest, res: Response) => {
  const { type } = req.params;

  // Check type access
  if (!req.user?.is_admin && !req.user?.types.includes(type)) {
    return res.status(403).json({ error: 'No access to this type' });
  }

  try {
    const { auto_assign_codes, auto_send_emails, display_name } = req.body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (auto_assign_codes !== undefined) {
      updates.push('auto_assign_codes = ?');
      values.push(auto_assign_codes ? 1 : 0);
    }
    if (auto_send_emails !== undefined) {
      updates.push('auto_send_emails = ?');
      values.push(auto_send_emails ? 1 : 0);
    }
    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name);
    }

    if (updates.length > 0) {
      values.push(type);
      db.prepare(`UPDATE type_settings SET ${updates.join(', ')} WHERE type = ?`).run(...values);
    }

    const settings = db.prepare(`
      SELECT type, auto_assign_codes, auto_send_emails, display_name
      FROM type_settings WHERE type = ?
    `).get(type) as TypeSettings;

    res.json({
      type: settings.type,
      auto_assign_codes: !!settings.auto_assign_codes,
      auto_send_emails: !!settings.auto_send_emails,
      display_name: settings.display_name,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/settings - Get all type settings (for admin overview)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const accessibleTypes = req.user?.is_admin
      ? ['premsa', 'professional', 'nitoman']
      : req.user?.types || [];

    const placeholders = accessibleTypes.map(() => '?').join(', ');
    const settings = db.prepare(`
      SELECT type, auto_assign_codes, auto_send_emails, display_name
      FROM type_settings WHERE type IN (${placeholders})
    `).all(...accessibleTypes) as TypeSettings[];

    res.json(settings.map(s => ({
      type: s.type,
      auto_assign_codes: !!s.auto_assign_codes,
      auto_send_emails: !!s.auto_send_emails,
      display_name: s.display_name,
    })));
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default router;
