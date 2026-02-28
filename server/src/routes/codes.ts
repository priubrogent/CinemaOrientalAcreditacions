import { Router, Response } from 'express';
import { codes } from '../db/index.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to get accessible types
function getAccessibleTypes(user: AuthRequest['user']): string[] {
  if (!user) return [];
  return user.is_admin ? ['premsa', 'professional', 'nitoman'] : user.types;
}

// Get all codes (filtered by type)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const accessibleTypes = getAccessibleTypes(req.user);

    // If specific type requested, validate access
    if (type && !accessibleTypes.includes(type)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    if (type) {
      const all = codes.getAll(type);
      res.json(all);
    } else {
      // Return codes for all accessible types
      const allCodes: any[] = [];
      for (const t of accessibleTypes) {
        allCodes.push(...codes.getAll(t));
      }
      res.json(allCodes);
    }
  } catch (error) {
    console.error('Error fetching codes:', error);
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

// Get available codes count
router.get('/available', (req: AuthRequest, res: Response) => {
  try {
    const type = (req.query.type as string) || 'premsa';
    const accessibleTypes = getAccessibleTypes(req.user);

    if (!accessibleTypes.includes(type)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    const available = codes.getAvailable(type);
    res.json({ type, count: available.length, codes: available });
  } catch (error) {
    console.error('Error fetching available codes:', error);
    res.status(500).json({ error: 'Failed to fetch available codes' });
  }
});

// Add single code
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { code, type } = req.body;
    const codeType = type || 'premsa';
    const accessibleTypes = getAccessibleTypes(req.user);

    if (!accessibleTypes.includes(codeType)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const created = codes.create(code.trim(), codeType);
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
router.post('/bulk', (req: AuthRequest, res: Response) => {
  try {
    const { codes: codeList, type } = req.body;
    const codeType = type || 'premsa';
    const accessibleTypes = getAccessibleTypes(req.user);

    if (!accessibleTypes.includes(codeType)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    if (!codeList || !Array.isArray(codeList)) {
      return res.status(400).json({ error: 'codes array is required' });
    }

    const inserted = codes.createBulk(codeList, codeType);
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
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    // Get the code first to check type access
    const codeId = parseInt(req.params.id);
    const allCodes = codes.getAll();
    const codeToDelete = allCodes.find(c => c.id === codeId);

    if (!codeToDelete) {
      return res.status(404).json({ error: 'Code not found' });
    }

    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(codeToDelete.type)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    const deleted = codes.delete(codeId);
    if (!deleted) {
      return res.status(400).json({ error: 'Code is in use and cannot be deleted' });
    }
    res.json({ message: 'Code deleted' });
  } catch (error) {
    console.error('Error deleting code:', error);
    res.status(500).json({ error: 'Failed to delete code' });
  }
});

export default router;
