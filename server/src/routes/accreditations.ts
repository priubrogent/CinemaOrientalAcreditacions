import { Router } from 'express';
import { accreditations, codes, templates } from '../db/index.js';
import { sendAccreditationEmail } from '../services/emailService.js';

const router = Router();

// Get all accreditations
router.get('/', (req, res) => {
  try {
    const all = accreditations.getAll();
    res.json(all);
  } catch (error) {
    console.error('Error fetching accreditations:', error);
    res.status(500).json({ error: 'Failed to fetch accreditations' });
  }
});

// Get single accreditation
router.get('/:id', (req, res) => {
  try {
    const accreditation = accreditations.getById(parseInt(req.params.id));
    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
    }
    res.json(accreditation);
  } catch (error) {
    console.error('Error fetching accreditation:', error);
    res.status(500).json({ error: 'Failed to fetch accreditation' });
  }
});

// Assign code to accreditation
router.patch('/:id/assign-code', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const accreditation = accreditations.getById(id);

    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
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
router.post('/:id/send-email', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const accreditation = accreditations.getById(id);

    if (!accreditation) {
      return res.status(404).json({ error: 'Accreditation not found' });
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
router.delete('/:id', (req, res) => {
  try {
    const deleted = accreditations.delete(parseInt(req.params.id));
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
