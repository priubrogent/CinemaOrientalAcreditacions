import { Router } from 'express';
import { templates } from '../db/index.js';
import { renderTemplate } from '../services/emailService.js';

const router = Router();

// Get all templates
router.get('/', (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const all = templates.getAll(type);
    res.json(all);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', (req, res) => {
  try {
    const template = templates.getById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Preview template with sample data
router.post('/:id/preview', (req, res) => {
  try {
    const template = templates.getById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const sampleData = {
      name: req.body.name || 'Joan Garcia',
      email: req.body.email || 'joan@example.com',
      code: req.body.code || 'PREMSA-2024-ABC123',
      order_id: req.body.order_id || '12345',
    };

    const preview = {
      subject: renderTemplate(template.subject, sampleData),
      body: renderTemplate(template.body, sampleData),
    };

    res.json(preview);
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

// Create template
router.post('/', (req, res) => {
  try {
    const { name, type, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'name, subject, and body are required' });
    }

    const template = templates.create({
      name,
      type: type || 'premsa',
      subject,
      body
    });

    res.status(201).json({ message: 'Template created', template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', (req, res) => {
  try {
    const { name, subject, body, is_active } = req.body;
    const updated = templates.update(parseInt(req.params.id), { name, subject, body, is_active });

    if (!updated) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template updated', template: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', (req, res) => {
  try {
    const deleted = templates.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
