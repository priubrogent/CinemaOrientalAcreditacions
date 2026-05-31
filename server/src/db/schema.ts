import Database, { type Database as DatabaseType } from 'better-sqlite3';
import bcrypt from 'bcryptjs';
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

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    notifications_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    UNIQUE(user_id, type)
  );

  CREATE TABLE IF NOT EXISTS type_settings (
    type TEXT PRIMARY KEY,
    auto_assign_codes INTEGER DEFAULT 0,
    auto_send_emails INTEGER DEFAULT 0,
    display_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS casals_inscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_casal TEXT NOT NULL,
    dates TEXT NOT NULL,
    nombre_nens INTEGER NOT NULL,
    nombre_monitors INTEGER NOT NULL,
    email TEXT NOT NULL,
    telefon TEXT NOT NULL,
    comentaris TEXT,
    validated INTEGER DEFAULT 0,
    validated_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Drop old settings table if exists (migration)
try {
  db.exec('DROP TABLE IF EXISTS settings');
} catch (e) {
  // ignore if doesn't exist
}

// Add notifications_enabled column if it doesn't exist (migration)
try {
  db.exec('ALTER TABLE users ADD COLUMN notifications_enabled INTEGER DEFAULT 0');
} catch (e) {
  // Column already exists, ignore
}

// Add send_validation_email column to type_settings if it doesn't exist (migration)
try {
  db.exec('ALTER TABLE type_settings ADD COLUMN send_validation_email INTEGER DEFAULT 0');
} catch (e) {
  // Column already exists, ignore
}

// Add slug column to email_templates if it doesn't exist (migration)
try {
  db.exec('ALTER TABLE email_templates ADD COLUMN slug TEXT');
} catch (e) {
  // Column already exists, ignore
}

// Add casals type setting if it doesn't exist (migration)
const casalsTypeCount = db.prepare("SELECT COUNT(*) as count FROM type_settings WHERE type = 'casals'").get() as { count: number };
if (casalsTypeCount.count === 0) {
  db.prepare("INSERT INTO type_settings (type, auto_assign_codes, auto_send_emails, display_name) VALUES ('casals', 0, 0, 'Casals')").run();
}

// Insert default type settings if none exist
const typeSettingsCount = db.prepare('SELECT COUNT(*) as count FROM type_settings').get() as { count: number };
if (typeSettingsCount.count === 0) {
  const insertTypeSetting = db.prepare('INSERT INTO type_settings (type, auto_assign_codes, auto_send_emails, display_name) VALUES (?, 0, 0, ?)');
  insertTypeSetting.run('premsa', 'Premsa');
  insertTypeSetting.run('professional', 'Professional');
  insertTypeSetting.run('nitoman', 'Nitoman');
}

// Insert default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(adminPassword, 10);

  const result = db.prepare(`
    INSERT INTO users (username, email, password_hash, is_admin)
    VALUES ('admin', 'admin@asff.cat', ?, 1)
  `).run(hash);

  const adminId = result.lastInsertRowid;

  // Give admin access to all types
  const insertPermission = db.prepare('INSERT INTO user_permissions (user_id, type) VALUES (?, ?)');
  insertPermission.run(adminId, 'premsa');
  insertPermission.run(adminId, 'professional');
  insertPermission.run(adminId, 'nitoman');
}

// Insert default email templates if none exist
const defaultEmailBody = (typeName: string) => `<!DOCTYPE html>
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
      <h1>Asian Summer Film Festival</h1>
      <h2>Acreditació ${typeName}</h2>
    </div>

    <p>Hola {{name}},</p>

    <p>Gràcies per la teva compra. Aquí tens el teu codi d'acreditació ${typeName}:</p>

    <div class="code-box">
      <span class="code">{{code}}</span>
    </div>

    <p>Presenta aquest codi a l'entrada del festival per recollir la teva acreditació.</p>

    <p>Si tens cap pregunta, no dubtis en contactar-nos.</p>

    <p>Salutacions,<br>L'equip d'Asian Summer Film Festival</p>

    <div class="footer">
      <p>Número de comanda: {{order_id}}</p>
    </div>
  </div>
</body>
</html>`;

const templateTypes = [
  { type: 'premsa', name: 'Default Premsa Template', subject: 'La teva acreditació de Premsa - ASFF' },
  { type: 'professional', name: 'Default Professional Template', subject: 'La teva acreditació Professional - ASFF' },
  { type: 'nitoman', name: 'Default Nitoman Template', subject: 'La teva acreditació Nitoman - ASFF' },
];

for (const t of templateTypes) {
  const count = db.prepare('SELECT COUNT(*) as count FROM email_templates WHERE type = ?').get(t.type) as { count: number };
  if (count.count === 0) {
    db.prepare(`
      INSERT INTO email_templates (name, type, subject, body, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(t.name, t.type, t.subject, defaultEmailBody(t.name.replace('Default ', '').replace(' Template', '')));
  }
}

export default db;
