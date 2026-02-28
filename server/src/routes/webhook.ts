import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/index.js';
import { accreditations, codes, templates } from '../db/index.js';
import { sendAccreditationEmail } from '../services/emailService.js';
import { appendToGoogleSheets, updateRowInGoogleSheets } from '../services/sheetsService.js';
import type { WooCommerceWebhookPayload } from '../types/index.js';

interface Settings {
  auto_assign_codes: number;
  auto_send_emails: number;
}

function getSettings(): Settings {
  return db.prepare('SELECT auto_assign_codes, auto_send_emails FROM settings WHERE id = 1').get() as Settings || {
    auto_assign_codes: 0,
    auto_send_emails: 0
  };
}

async function autoProcessAccreditation(accreditationId: number, type: string) {
  const settings = getSettings();

  if (!settings.auto_assign_codes) {
    return;
  }

  // Auto-assign code
  const code = codes.getNextAvailable(type);
  if (!code) {
    console.log(`Auto-assign: No available codes for type ${type}`);
    return;
  }

  let updated = accreditations.assignCode(accreditationId, code.id);
  console.log(`Auto-assigned code ${code.code} to accreditation ${accreditationId}`);

  // Auto-send email if enabled
  if (settings.auto_send_emails && updated) {
    const template = templates.getActive(type);
    if (!template) {
      console.log(`Auto-email: No active template for type ${type}`);
      return;
    }

    const refreshedAccreditation = accreditations.getById(accreditationId);
    if (!refreshedAccreditation) return;

    const result = await sendAccreditationEmail(refreshedAccreditation, template);
    if (result.success) {
      accreditations.markEmailSent(accreditationId);
      console.log(`Auto-sent email to ${refreshedAccreditation.customer_email}`);
    } else {
      console.error(`Auto-email failed: ${result.error}`);
    }
  }
}

const router = Router();

// Verify WooCommerce webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('base64');
  return hash === signature;
}

// WooCommerce webhook endpoint
router.post('/woocommerce', (req, res) => {
  const signature = req.headers['x-wc-webhook-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET;

  // TEMPORARILY DISABLED for testing
  // TODO: Re-enable signature verification
  // if (secret && signature) {
  //   const payload = JSON.stringify(req.body);
  //   if (!verifyWebhookSignature(payload, signature, secret)) {
  //     console.warn('Invalid webhook signature');
  //     return res.status(401).json({ error: 'Invalid signature' });
  //   }
  // }
  console.log('Webhook received from:', req.headers['user-agent']);

  try {
    const data = req.body as WooCommerceWebhookPayload;

    // TEMPORARY: Accept all orders for testing
    // TODO: Re-enable filtering later
    // const premsaItem = data.line_items?.find(item =>
    //   item.name.toLowerCase().includes('premsa') ||
    //   item.sku?.toLowerCase().includes('premsa')
    // );
    // if (!premsaItem) {
    //   return res.json({ message: 'Order does not contain Premsa accreditation' });
    // }

    console.log('Webhook received order:', data.id, 'Items:', data.line_items?.map(i => i.name));

    // Check if already exists
    const existing = accreditations.getByOrderId(String(data.id));
    if (existing) {
      return res.json({ message: 'Order already processed', accreditation: existing });
    }

    // Create accreditation
    const customerName = `${data.billing.first_name} ${data.billing.last_name}`.trim();
    const accreditation = accreditations.create({
      order_id: String(data.id),
      customer_name: customerName,
      customer_email: data.billing.email,
      type: 'premsa'
    });

    console.log(`New Premsa accreditation created: ${accreditation.order_id} for ${accreditation.customer_email}`);

    // Sync to Google Sheets
    appendToGoogleSheets(accreditation).catch(err => {
      console.error('Google Sheets append error:', err);
    });

    // Auto-process (assign code and/or send email) based on settings
    autoProcessAccreditation(accreditation.id, accreditation.type).catch(err => {
      console.error('Auto-process error:', err);
    });

    res.status(201).json({ message: 'Accreditation created', accreditation });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Manual test endpoint (for development)
router.post('/test', (req, res) => {
  const { order_id, customer_name, customer_email, type } = req.body;

  if (!order_id || !customer_name || !customer_email) {
    return res.status(400).json({ error: 'Missing required fields: order_id, customer_name, customer_email' });
  }

  try {
    const existing = accreditations.getByOrderId(order_id);
    if (existing) {
      return res.status(409).json({ error: 'Order already exists', accreditation: existing });
    }

    const accreditation = accreditations.create({
      order_id,
      customer_name,
      customer_email,
      type: type || 'premsa'
    });

    res.status(201).json({ message: 'Test accreditation created', accreditation });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to create accreditation' });
  }
});

export default router;
