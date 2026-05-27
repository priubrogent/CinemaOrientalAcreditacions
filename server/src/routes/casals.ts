import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { casalsInscriptions, users } from '../db/index.js';
import { sendCasalAdminNotification, sendCasalConfirmation } from '../services/emailService.js';
import { appendCasalToSheets } from '../services/sheetsService.js';

const router = Router();

// POST /api/casals — public, no auth required
router.post('/', async (req, res) => {
  const { nom_casal, dates, nombre_nens, nombre_monitors, email, telefon, comentaris } = req.body;

  // Validate required fields
  if (!nom_casal || !dates || !nombre_nens || !nombre_monitors || !email || !telefon) {
    return res.status(400).json({ error: 'Falten camps obligatoris' });
  }

  if (!Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ error: 'Cal seleccionar almenys una data' });
  }

  const nens = parseInt(nombre_nens, 10);
  const monitors = parseInt(nombre_monitors, 10);

  if (isNaN(nens) || nens < 1 || isNaN(monitors) || monitors < 1) {
    return res.status(400).json({ error: 'El nombre de nens i monitors ha de ser un número positiu' });
  }

  try {
    const casal = casalsInscriptions.create({
      nom_casal,
      dates,
      nombre_nens: nens,
      nombre_monitors: monitors,
      email,
      telefon,
      comentaris: comentaris || undefined,
    });

    const casalData = {
      id: casal.id,
      nom_casal: casal.nom_casal,
      dates,
      nombre_nens: casal.nombre_nens,
      nombre_monitors: casal.nombre_monitors,
      email: casal.email,
      telefon: casal.telefon,
      comentaris: casal.comentaris,
    };

    // Fire emails and sheets append in parallel (non-blocking for response)
    const adminEmails = users.getCasalsAdminEmails();
    Promise.all([
      sendCasalAdminNotification(casalData, adminEmails),
      sendCasalConfirmation(casalData),
      appendCasalToSheets({
        ...casal,
        dates,
        validated: casal.validated,
        validated_date: casal.validated_date,
      }),
    ]).catch(err => console.error('Background casal tasks error:', err));

    return res.json({ success: true, id: casal.id });
  } catch (error) {
    console.error('Error creating casal inscription:', error);
    return res.status(500).json({ error: 'Error en crear la inscripció' });
  }
});

// GET /api/casals — admin only
router.get('/', requireAuth, requireAdmin, (_req: AuthRequest, res) => {
  try {
    const inscriptions = casalsInscriptions.getAll();
    // Parse dates JSON for each row
    const parsed = inscriptions.map(i => ({
      ...i,
      dates: JSON.parse(i.dates) as string[],
      validated: !!i.validated,
    }));
    return res.json(parsed);
  } catch (error) {
    console.error('Error fetching casal inscriptions:', error);
    return res.status(500).json({ error: 'Error en carregar les inscripcions' });
  }
});

// PATCH /api/casals/:id/validate — admin only
router.patch('/:id/validate', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10);
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Cal indicar una data de validació' });
  }

  try {
    const updated = casalsInscriptions.validate(id, date);
    if (!updated) {
      return res.status(404).json({ error: 'Inscripció no trobada' });
    }
    return res.json({
      ...updated,
      dates: JSON.parse(updated.dates) as string[],
      validated: !!updated.validated,
    });
  } catch (error) {
    console.error('Error validating casal inscription:', error);
    return res.status(500).json({ error: 'Error en validar la inscripció' });
  }
});

export default router;
