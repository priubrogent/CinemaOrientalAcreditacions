import { Router, Response } from 'express';
import { accreditations, codes, templates, users } from '../db/index.js';
import { sendAccreditationEmail } from '../services/emailService.js';
import { syncNitomanSheets } from '../services/sheetsService.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to get accessible types
function getAccessibleTypes(user: AuthRequest['user']): string[] {
  if (!user) return [];
  return user.is_admin ? ['premsa', 'professional', 'nitoman'] : user.types;
}

function maybeNitomanSync(type: string) {
  if (type !== 'nitoman') return;
  const nitomanRows = accreditations.getAll().filter(a => a.type === 'nitoman');
  syncNitomanSheets(nitomanRows).catch(err => console.error('Nitoman sheets sync error:', err));
}

// Create accreditation manually
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { customer_name, customer_email, outlet, type, variant } = req.body;

    if (!customer_name || !customer_email || !type) {
      return res.status(400).json({ error: 'Falten camps obligatoris: customer_name, customer_email, type' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return res.status(400).json({ error: 'Adreça de correu no vàlida' });
    }

    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(type)) {
      return res.status(403).json({ error: 'No tens accés a aquest tipus' });
    }

    const order_id = `MANUAL-${Date.now()}`;
    const accreditation = accreditations.create({
      order_id,
      customer_name,
      customer_email,
      type,
      outlet: outlet || undefined,
      variant: variant || undefined,
    });

    maybeNitomanSync(type);
    res.status(201).json({ message: 'Accreditation created', accreditation });
  } catch (error) {
    console.error('Error creating accreditation:', error);
    res.status(500).json({ error: 'Failed to create accreditation' });
  }
});

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
    maybeNitomanSync(accreditation.type);
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

    // Check if user wants notification copy
    const notifyUserEmail = req.user && users.getNotificationsEnabled(req.user.id)
      ? req.user.email
      : undefined;

    const result = await sendAccreditationEmail(accreditation, template, { notifyUserEmail });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const updated = accreditations.markEmailSent(id);
    maybeNitomanSync(accreditation.type);
    res.json({ message: 'Email sent successfully', accreditation: updated });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Update accreditation
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const accreditation = accreditations.getById(id);

    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }

    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(accreditation.type)) {
      return res.status(403).json({ error: 'No access to this accreditation' });
    }

    const { customer_name, customer_email, outlet, variant } = req.body;

    if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const updated = accreditations.update(id, { customer_name, customer_email, outlet, variant });
    maybeNitomanSync(accreditation.type);
    res.json({ message: 'Accreditation updated', accreditation: updated });
  } catch (error) {
    console.error('Error updating accreditation:', error);
    res.status(500).json({ error: 'Failed to update accreditation' });
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

    const accType = accreditation.type;
    const deleted = accreditations.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }
    maybeNitomanSync(accType);
    res.json({ message: 'Accreditation deleted' });
  } catch (error) {
    console.error('Error deleting accreditation:', error);
    res.status(500).json({ error: 'Failed to delete accreditation' });
  }
});

// Update variant for a nitoman accreditation
router.patch('/:id/variant', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { variant } = req.body;

    if (!variant || !['nitoman', 'super'].includes(variant)) {
      return res.status(400).json({ error: "Variant must be 'nitoman' or 'super'" });
    }

    const accreditation = accreditations.getById(id);
    if (!accreditation) return res.status(404).json({ error: 'Accreditation not found' });
    if (accreditation.type !== 'nitoman') return res.status(400).json({ error: 'Variant only applies to nitoman accreditations' });

    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(accreditation.type)) {
      return res.status(403).json({ error: 'No access to this accreditation' });
    }

    const updated = accreditations.update(id, { variant });
    maybeNitomanSync('nitoman');
    res.json({ message: 'Variant updated', accreditation: updated });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

export default router;
