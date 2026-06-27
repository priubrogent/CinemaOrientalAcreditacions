import db from './schema.js';
import type { Accreditation, Code, EmailTemplate } from '../types/index.js';

// Accreditations
export const accreditations = {
  getAll: (): Accreditation[] => {
    return db.prepare(`
      SELECT a.*, c.code
      FROM accreditations a
      LEFT JOIN codes c ON a.code_id = c.id
      ORDER BY a.created_at DESC
    `).all() as Accreditation[];
  },

  getById: (id: number): Accreditation | undefined => {
    return db.prepare(`
      SELECT a.*, c.code
      FROM accreditations a
      LEFT JOIN codes c ON a.code_id = c.id
      WHERE a.id = ?
    `).get(id) as Accreditation | undefined;
  },

  getByOrderId: (orderId: string): Accreditation | undefined => {
    return db.prepare(`
      SELECT a.*, c.code
      FROM accreditations a
      LEFT JOIN codes c ON a.code_id = c.id
      WHERE a.order_id = ?
    `).get(orderId) as Accreditation | undefined;
  },

  create: (data: { order_id: string; customer_name: string; customer_email: string; type?: string; outlet?: string }): Accreditation => {
    const result = db.prepare(`
      INSERT INTO accreditations (order_id, customer_name, customer_email, type, outlet)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.order_id, data.customer_name, data.customer_email, data.type || 'premsa', data.outlet || null);

    return accreditations.getById(result.lastInsertRowid as number)!;
  },

  assignCode: (id: number, codeId: number): Accreditation | undefined => {
    db.prepare(`
      UPDATE accreditations
      SET code_id = ?, status = 'code_assigned'
      WHERE id = ?
    `).run(codeId, id);

    codes.markUsed(codeId);
    return accreditations.getById(id);
  },

  markEmailSent: (id: number): Accreditation | undefined => {
    db.prepare(`
      UPDATE accreditations
      SET status = 'email_sent', email_sent_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    return accreditations.getById(id);
  },

  update: (id: number, data: { customer_name?: string; customer_email?: string; outlet?: string }): Accreditation | undefined => {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (data.customer_name !== undefined) { fields.push('customer_name = ?'); values.push(data.customer_name); }
    if (data.customer_email !== undefined) { fields.push('customer_email = ?'); values.push(data.customer_email); }
    if (data.outlet !== undefined) { fields.push('outlet = ?'); values.push(data.outlet); }
    if (fields.length === 0) return accreditations.getById(id);
    values.push(id);
    db.prepare(`UPDATE accreditations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return accreditations.getById(id);
  },

  delete: (id: number): boolean => {
    const accred = accreditations.getById(id);
    if (accred?.code_id) {
      codes.markUnused(accred.code_id);
    }
    const result = db.prepare('DELETE FROM accreditations WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Codes
export const codes = {
  getAll: (type?: string): Code[] => {
    if (type) {
      return db.prepare('SELECT * FROM codes WHERE type = ? ORDER BY id DESC').all(type) as Code[];
    }
    return db.prepare('SELECT * FROM codes ORDER BY id DESC').all() as Code[];
  },

  getAvailable: (type: string): Code[] => {
    return db.prepare('SELECT * FROM codes WHERE type = ? AND is_used = 0 ORDER BY id').all(type) as Code[];
  },

  getNextAvailable: (type: string): Code | undefined => {
    return db.prepare('SELECT * FROM codes WHERE type = ? AND is_used = 0 ORDER BY id LIMIT 1').get(type) as Code | undefined;
  },

  create: (code: string, type: string = 'premsa'): Code => {
    const result = db.prepare('INSERT INTO codes (code, type) VALUES (?, ?)').run(code, type);
    return db.prepare('SELECT * FROM codes WHERE id = ?').get(result.lastInsertRowid) as Code;
  },

  createBulk: (codeList: string[], type: string = 'premsa'): number => {
    const stmt = db.prepare('INSERT OR IGNORE INTO codes (code, type) VALUES (?, ?)');
    const insertMany = db.transaction((codes: string[]) => {
      let inserted = 0;
      for (const code of codes) {
        const trimmed = code.trim();
        if (trimmed) {
          const result = stmt.run(trimmed, type);
          if (result.changes > 0) inserted++;
        }
      }
      return inserted;
    });
    return insertMany(codeList);
  },

  markUsed: (id: number): void => {
    db.prepare('UPDATE codes SET is_used = 1, assigned_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  markUnused: (id: number): void => {
    db.prepare('UPDATE codes SET is_used = 0, assigned_at = NULL WHERE id = ?').run(id);
  },

  delete: (id: number): boolean => {
    const result = db.prepare('DELETE FROM codes WHERE id = ? AND is_used = 0').run(id);
    return result.changes > 0;
  }
};

// Users
export const users = {
  getNotificationsEnabled: (userId: number): boolean => {
    const result = db.prepare('SELECT notifications_enabled FROM users WHERE id = ?').get(userId) as { notifications_enabled: number } | undefined;
    return !!result?.notifications_enabled;
  },

  getEmailById: (userId: number): string | undefined => {
    const result = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
    return result?.email;
  },

  getCasalsAdminEmails: (): string[] => {
    const rows = db.prepare(`
      SELECT DISTINCT u.email FROM users u
      WHERE u.is_active = 1 AND (
        u.is_admin = 1
        OR EXISTS (SELECT 1 FROM user_permissions up WHERE up.user_id = u.id AND up.type = 'casals')
      )
    `).all() as { email: string }[];
    return rows.map(r => r.email);
  },
};

// Email Templates
export const templates = {
  getAll: (type?: string): EmailTemplate[] => {
    if (type) {
      return db.prepare('SELECT * FROM email_templates WHERE type = ? ORDER BY id DESC').all(type) as EmailTemplate[];
    }
    return db.prepare('SELECT * FROM email_templates ORDER BY id DESC').all() as EmailTemplate[];
  },

  getById: (id: number): EmailTemplate | undefined => {
    return db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id) as EmailTemplate | undefined;
  },

  getActive: (type: string): EmailTemplate | undefined => {
    return db.prepare('SELECT * FROM email_templates WHERE type = ? AND is_active = 1 LIMIT 1').get(type) as EmailTemplate | undefined;
  },

  create: (data: { name: string; type: string; subject: string; body: string }): EmailTemplate => {
    const result = db.prepare(`
      INSERT INTO email_templates (name, type, subject, body)
      VALUES (?, ?, ?, ?)
    `).run(data.name, data.type, data.subject, data.body);

    return templates.getById(result.lastInsertRowid as number)!;
  },

  update: (id: number, data: Partial<{ name: string; subject: string; body: string; is_active: boolean }>): EmailTemplate | undefined => {
    const current = templates.getById(id);
    if (!current) return undefined;

    db.prepare(`
      UPDATE email_templates
      SET name = ?, subject = ?, body = ?, is_active = ?
      WHERE id = ?
    `).run(
      data.name ?? current.name,
      data.subject ?? current.subject,
      data.body ?? current.body,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : current.is_active,
      id
    );

    return templates.getById(id);
  },

  delete: (id: number): boolean => {
    const result = db.prepare('DELETE FROM email_templates WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Casals Inscriptions
export interface CasalInscriptionRow {
  id: number;
  nom_casal: string;
  dates: string; // JSON array string
  nombre_nens: number;
  nombre_monitors: number;
  email: string;
  telefon: string;
  comentaris: string | null;
  validated: number;
  validated_date: string | null;
  created_at: string;
}

export const casalsInscriptions = {
  getAll: (): CasalInscriptionRow[] => {
    return db.prepare('SELECT * FROM casals_inscriptions ORDER BY created_at DESC').all() as CasalInscriptionRow[];
  },

  create: (data: {
    nom_casal: string;
    dates: string[];
    nombre_nens: number;
    nombre_monitors: number;
    email: string;
    telefon: string;
    comentaris?: string;
  }): CasalInscriptionRow => {
    const result = db.prepare(`
      INSERT INTO casals_inscriptions (nom_casal, dates, nombre_nens, nombre_monitors, email, telefon, comentaris)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.nom_casal,
      JSON.stringify(data.dates),
      data.nombre_nens,
      data.nombre_monitors,
      data.email,
      data.telefon,
      data.comentaris || null
    );
    return db.prepare('SELECT * FROM casals_inscriptions WHERE id = ?').get(result.lastInsertRowid) as CasalInscriptionRow;
  },

  validate: (id: number, date: string): CasalInscriptionRow | undefined => {
    db.prepare(`
      UPDATE casals_inscriptions SET validated = 1, validated_date = ? WHERE id = ?
    `).run(date, id);
    return db.prepare('SELECT * FROM casals_inscriptions WHERE id = ?').get(id) as CasalInscriptionRow | undefined;
  },

  unvalidate: (id: number): CasalInscriptionRow | undefined => {
    db.prepare(`
      UPDATE casals_inscriptions SET validated = 0, validated_date = NULL WHERE id = ?
    `).run(id);
    return db.prepare('SELECT * FROM casals_inscriptions WHERE id = ?').get(id) as CasalInscriptionRow | undefined;
  },

  update: (id: number, data: {
    nom_casal: string;
    dates: string[];
    nombre_nens: number;
    nombre_monitors: number;
    email: string;
    telefon: string;
    comentaris?: string;
  }): CasalInscriptionRow | undefined => {
    db.prepare(`
      UPDATE casals_inscriptions
      SET nom_casal = ?, dates = ?, nombre_nens = ?, nombre_monitors = ?, email = ?, telefon = ?, comentaris = ?
      WHERE id = ?
    `).run(data.nom_casal, JSON.stringify(data.dates), data.nombre_nens, data.nombre_monitors, data.email, data.telefon, data.comentaris || null, id);
    return db.prepare('SELECT * FROM casals_inscriptions WHERE id = ?').get(id) as CasalInscriptionRow | undefined;
  },

  delete: (id: number): boolean => {
    const result = db.prepare('DELETE FROM casals_inscriptions WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

export default db;
