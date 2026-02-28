import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

interface Settings {
  auto_assign_codes: number;
  auto_send_emails: number;
}

// GET /api/settings
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT auto_assign_codes, auto_send_emails FROM settings WHERE id = 1').get() as Settings | undefined;

    if (!settings) {
      return res.json({ auto_assign_codes: false, auto_send_emails: false });
    }

    res.json({
      auto_assign_codes: !!settings.auto_assign_codes,
      auto_send_emails: !!settings.auto_send_emails,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const { auto_assign_codes, auto_send_emails } = req.body;

    db.prepare(`
      UPDATE settings
      SET auto_assign_codes = ?, auto_send_emails = ?
      WHERE id = 1
    `).run(auto_assign_codes ? 1 : 0, auto_send_emails ? 1 : 0);

    res.json({
      auto_assign_codes: !!auto_assign_codes,
      auto_send_emails: !!auto_send_emails,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
