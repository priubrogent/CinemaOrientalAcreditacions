import { Router } from 'express';
import { codes } from '../db/index.js';

const router = Router();

// Get all codes
router.get('/', (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const all = codes.getAll(type);
    res.json(all);
  } catch (error) {
    console.error('Error fetching codes:', error);
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

// Get available codes count
router.get('/available', (req, res) => {
  try {
    const type = (req.query.type as string) || 'premsa';
    const available = codes.getAvailable(type);
    res.json({ type, count: available.length, codes: available });
  } catch (error) {
    console.error('Error fetching available codes:', error);
    res.status(500).json({ error: 'Failed to fetch available codes' });
  }
});

// Add single code
router.post('/', (req, res) => {
  try {
    const { code, type } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const created = codes.create(code.trim(), type || 'premsa');
    res.status(201).json({ message: 'Code created', code: created });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Code already exists' });
    }
    console.error('Error creating code:', error);
    res.status(500).json({ error: 'Failed to create code' });
  }
});

// Add bulk codes
router.post('/bulk', (req, res) => {
  try {
    const { codes: codeList, type } = req.body;

    if (!codeList || !Array.isArray(codeList)) {
      return res.status(400).json({ error: 'codes array is required' });
    }

    const inserted = codes.createBulk(codeList, type || 'premsa');
    const total = codeList.filter(c => c.trim()).length;

    res.status(201).json({
      message: `Inserted ${inserted} of ${total} codes`,
      inserted,
      total,
      duplicates: total - inserted
    });
  } catch (error) {
    console.error('Error creating bulk codes:', error);
    res.status(500).json({ error: 'Failed to create codes' });
  }
});

// Delete code (only if unused)
router.delete('/:id', (req, res) => {
  try {
    const deleted = codes.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(400).json({ error: 'Code not found or already in use' });
    }
    res.json({ message: 'Code deleted' });
  } catch (error) {
    console.error('Error deleting code:', error);
    res.status(500).json({ error: 'Failed to delete code' });
  }
});

export default router;
