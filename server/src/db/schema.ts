import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/accreditations.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS accreditations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'premsa',
    code_id INTEGER REFERENCES codes(id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    email_sent_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'premsa',
    is_used INTEGER DEFAULT 0,
    assigned_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'premsa',
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  );
`);

// Insert default email template if none exists
const templateCount = db.prepare('SELECT COUNT(*) as count FROM email_templates WHERE type = ?').get('premsa') as { count: number };
if (templateCount.count === 0) {
  db.prepare(`
    INSERT INTO email_templates (name, type, subject, body, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(
    'Default Premsa Template',
    'premsa',
    'La teva acreditació de Premsa - NITS Festival',
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .code-box { background: #f5f5f5; border: 2px solid #333; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NITS Festival</h1>
      <h2>Acreditació de Premsa</h2>
    </div>

    <p>Hola {{name}},</p>

    <p>Gràcies per registrar-te com a premsa al NITS Festival. Aquí tens el teu codi d'acreditació:</p>

    <div class="code-box">
      <span class="code">{{code}}</span>
    </div>

    <p>Presenta aquest codi a l'entrada del festival per recollir la teva acreditació.</p>

    <p>Si tens cap pregunta, no dubtis en contactar-nos.</p>

    <p>Salutacions,<br>L'equip de NITS Festival</p>

    <div class="footer">
      <p>Número de comanda: {{order_id}}</p>
    </div>
  </div>
</body>
</html>`
  );
}

export default db;
