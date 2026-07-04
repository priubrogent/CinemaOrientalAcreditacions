const Database = require('better-sqlite3');
const dbPath = process.env.DATABASE_PATH || './data/accreditations.db';
const db = new Database(dbPath);

const orderId = '45805';
const customerName = 'Victor Gonzalez Prieto';
const customerEmail = 'mirada.desenfocada@gmail.com';
const codeStr = 'N23074';

const existingAccred = db.prepare('SELECT id FROM accreditations WHERE order_id = ?').get(orderId);
if (existingAccred) {
  console.log('ABORT: an accreditation with order_id', orderId, 'already exists (id', existingAccred.id, ')');
  process.exit(1);
}

let code = db.prepare('SELECT * FROM codes WHERE code = ?').get(codeStr);
if (!code) {
  db.prepare('INSERT INTO codes (code, type, is_used) VALUES (?, ?, 0)').run(codeStr, 'nitoman');
  code = db.prepare('SELECT * FROM codes WHERE code = ?').get(codeStr);
  console.log('Code did not exist, created fresh:', code);
}

if (code.is_used) {
  console.log('ABORT: code', codeStr, 'is currently marked as used. Check who has it before proceeding:');
  console.log(db.prepare('SELECT * FROM accreditations WHERE code_id = ?').get(code.id));
  process.exit(1);
}

db.prepare('UPDATE codes SET is_used = 1, assigned_at = CURRENT_TIMESTAMP WHERE id = ?').run(code.id);

const result = db.prepare(`
  INSERT INTO accreditations (order_id, customer_name, customer_email, type, variant, code_id, status, created_at, email_sent_at)
  VALUES (?, ?, ?, 'nitoman', 'nitoman', ?, 'email_sent', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`).run(orderId, customerName, customerEmail, code.id);

console.log('Restored accreditation, id:', result.lastInsertRowid);
console.log(db.prepare('SELECT * FROM accreditations WHERE id = ?').get(result.lastInsertRowid));
