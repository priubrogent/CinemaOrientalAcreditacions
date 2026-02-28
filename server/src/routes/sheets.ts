import { Router } from 'express';
import { accreditations } from '../db/index.js';
import { syncToGoogleSheets, isConfigured } from '../services/sheetsService.js';

const router = Router();

// GET /api/sheets/status - Check if Google Sheets is configured
router.get('/status', async (req, res) => {
  try {
    const configured = await isConfigured();
    res.json({ configured });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check sheets status' });
  }
});

// POST /api/sheets/sync - Sync all accreditations to Google Sheets
router.post('/sync', async (req, res) => {
  try {
    const all = accreditations.getAll();
    const result = await syncToGoogleSheets(all);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: `Synced ${all.length} accreditations to Google Sheets` });
  } catch (error) {
    console.error('Sheets sync error:', error);
    res.status(500).json({ error: 'Failed to sync to Google Sheets' });
  }
});

export default router;
