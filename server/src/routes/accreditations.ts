import { Router, Response } from 'express';
import { accreditations, codes, templates } from '../db/index.js';
import { sendAccreditationEmail } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to get accessible types
function getAccessibleTypes(user: AuthRequest['user']): string[] {
  if (!user) return [];
  return user.is_admin ? ['premsa', 'professional', 'nitoman'] : user.types;
}

// Get all accreditations (filtered by type)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const accessibleTypes = getAccessibleTypes(req.user);

    // If specific type requested, validate access
    if (type && !accessibleTypes.includes(type)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    const all = accreditations.getAll();

    // Filter by accessible types
    const typesToShow = type ? [type] : accessibleTypes;
    const filtered = all.filter(a => typesToShow.includes(a.type));

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching accreditations:', error);
    res.status(500).json({ error: 'Failed to fetch accreditations' });
  }
});

// Get single accreditation
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const accreditation = accreditations.getById(parseInt(req.params.id));
    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(accreditation.type)) {
      return res.status(403).json({ error: 'No access to this accreditation' });
    }

    res.json(accreditation);
  } catch (error) {
    console.error('Error fetching accreditation:', error);
    res.status(500).json({ error: 'Failed to fetch accreditation' });
  }
});

// Assign code to accreditation
router.patch('/:id/assign-code', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const accreditation = accreditations.getById(id);

    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(accreditation.type)) {
      return res.status(403).json({ error: 'No access to this accreditation' });
    }

    if (accreditation.code_id) {
      return res.status(400).json({ error: 'Code already assigned', accreditation });
    }

    // Get next available code
    const code = codes.getNextAvailable(accreditation.type);
    if (!code) {
      return res.status(400).json({ error: `No available codes for type: ${accreditation.type}` });
    }

    const updated = accreditations.assignCode(id, code.id);
    res.json({ message: 'Code assigned', accreditation: updated });
  } catch (error) {
    console.error('Error assigning code:', error);
    res.status(500).json({ error: 'Failed to assign code' });
  }
});

// Send email for accreditation
router.post('/:id/send-email', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const accreditation = accreditations.getById(id);

    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(accreditation.type)) {
      return res.status(403).json({ error: 'No access to this accreditation' });
    }

    if (!accreditation.code) {
      return res.status(400).json({ error: 'No code assigned. Please assign a code first.' });
    }

    // Get active template
    const template = templates.getActive(accreditation.type);
    if (!template) {
      return res.status(400).json({ error: `No active email template for type: ${accreditation.type}` });
    }

    const result = await sendAccreditationEmail(accreditation, template);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const updated = accreditations.markEmailSent(id);
    res.json({ message: 'Email sent successfully', accreditation: updated });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Delete accreditation
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const accreditation = accreditations.getById(id);

    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(accreditation.type)) {
      return res.status(403).json({ error: 'No access to this accreditation' });
    }

    const deleted = accreditations.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }
    res.json({ message: 'Accreditation deleted' });
  } catch (error) {
    console.error('Error deleting accreditation:', error);
    res.status(500).json({ error: 'Failed to delete accreditation' });
  }
});

export default router;
