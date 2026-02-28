import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import webhookRouter from './routes/webhook.js';
import accreditationsRouter from './routes/accreditations.js';
import codesRouter from './routes/codes.js';
import templatesRouter from './routes/templates.js';
import settingsRouter from './routes/settings.js';
import sheetsRouter from './routes/sheets.js';

// Initialize database
import './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Public routes
app.use('/api/auth', authRouter);

// Webhook uses its own authentication (signature verification)
app.use('/api/webhook', webhookRouter);

// Protected routes (require authentication)
app.use('/api/accreditations', requireAuth, accreditationsRouter);
app.use('/api/codes', requireAuth, codesRouter);
app.use('/api/templates', requireAuth, templatesRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/sheets', requireAuth, sheetsRouter);

// Admin-only routes
app.use('/api/users', requireAuth, requireAdmin, usersRouter);

// Types endpoint - get accessible types for current user
app.get('/api/types', requireAuth, (req: any, res) => {
  const types = req.user.is_admin
    ? ['premsa', 'professional', 'nitoman']
    : req.user.types;
  res.json(types);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/webhook/woocommerce`);
});
