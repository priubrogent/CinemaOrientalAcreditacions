import { Router, Response } from 'express';
import { templates } from '../db/index.js';
import { renderTemplate } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to get accessible types for user
function getAccessibleTypes(user: AuthRequest['user']): string[] {
  if (!user) return [];
  return user.is_admin ? ['premsa', 'professional', 'nitoman'] : user.types;
}

// Get all templates (filtered by user's accessible types)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const accessibleTypes = getAccessibleTypes(req.user);
    const requestedType = req.query.type as string | undefined;

    // If requesting specific type, check access
    if (requestedType && !accessibleTypes.includes(requestedType)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    const type = requestedType || undefined;
    let all = templates.getAll(type);

    // Filter to only accessible types if no specific type requested
    if (!requestedType) {
      all = all.filter(t => accessibleTypes.includes(t.type));
    }

    res.json(all);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const template = templates.getById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(template.type)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Preview template with sample data
router.post('/:id/preview', (req: AuthRequest, res: Response) => {
  try {
    const template = templates.getById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(template.type)) {
      return res.status(403).json({ error: 'No access to this type' });
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
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { name, type, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'name, subject, and body are required' });
    }

    const templateType = type || 'premsa';

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(templateType)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    const template = templates.create({
      name,
      type: templateType,
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
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const template = templates.getById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(template.type)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    const { name, subject, body, is_active } = req.body;
    const updated = templates.update(parseInt(req.params.id), { name, subject, body, is_active });

    res.json({ message: 'Template updated', template: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const template = templates.getById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check type access
    const accessibleTypes = getAccessibleTypes(req.user);
    if (!accessibleTypes.includes(template.type)) {
      return res.status(403).json({ error: 'No access to this type' });
    }

    templates.delete(parseInt(req.params.id));
    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
