import { Router } from 'express';
import crypto from 'crypto';
import { accreditations } from '../db/index.js';
import type { WooCommerceWebhookPayload } from '../types/index.js';

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

  // Verify signature if secret is configured
  if (secret && signature) {
    const payload = JSON.stringify(req.body);
    if (!verifyWebhookSignature(payload, signature, secret)) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

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
