import { Resend } from 'resend';
import type { Accreditation, EmailTemplate } from '../types/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

export interface NotificationOptions {
  notifyUserEmail?: string;
}

export async function sendAccreditationEmail(
  accreditation: Accreditation,
  template: EmailTemplate,
  options?: NotificationOptions
): Promise<{ success: boolean; error?: string }> {
  if (!accreditation.code) {
    return { success: false, error: 'No code assigned to this accreditation' };
  }

  const data = {
    name: accreditation.customer_name,
    email: accreditation.customer_email,
    code: accreditation.code,
    order_id: accreditation.order_id,
  };

  const subject = renderTemplate(template.subject, data);
  const html = renderTemplate(template.body, data);
  const from = process.env.EMAIL_FROM || 'NITS Festival <onboarding@resend.dev>';

  try {
    // Send to customer
    const result = await resend.emails.send({
      from,
      to: accreditation.customer_email,
      replyTo: process.env.EMAIL_REPLY_TO || 'priubrogent@cinemaoriental.com',
      subject,
      html,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Email sent via Resend:', result.data?.id);

    // Send notification copy to user if enabled
    if (options?.notifyUserEmail) {
      try {
        const notificationSubject = `Nova acreditació enviada: ${accreditation.customer_name}`;
        await resend.emails.send({
          from,
          to: options.notifyUserEmail,
          subject: notificationSubject,
          html,
        });
        console.log('Notification email sent to:', options.notifyUserEmail);
      } catch (notifyError) {
        // Don't fail the main operation if notification fails
        console.error('Failed to send notification email:', notifyError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email'
    };
  }
}

export async function verifyConnection(): Promise<boolean> {
  return !!process.env.RESEND_API_KEY;
}

export interface CasalInscriptionData {
  id: number;
  nom_casal: string;
  dates: string[];
  nombre_nens: number;
  nombre_monitors: number;
  email: string;
  telefon: string;
  comentaris: string | null;
}

export async function sendCasalAdminNotification(
  casal: CasalInscriptionData,
  toEmails: string[]
): Promise<{ success: boolean; error?: string }> {
  if (toEmails.length === 0) {
    console.warn('sendCasalAdminNotification: no recipients — assign users to the casals type in User Management');
    return { success: true };
  }
  const from = process.env.EMAIL_FROM || 'NITS Festival <onboarding@resend.dev>';
  const to = toEmails;

  const datesText = casal.dates.join(', ');
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; }
td { padding: 8px 12px; border-bottom: 1px solid #eee; }
td:first-child { font-weight: bold; color: #555; width: 40%; }
</style></head>
<body>
<div class="container">
  <h2>Nova inscripció de Casals</h2>
  <table>
    <tr><td>Nom del casal</td><td>${casal.nom_casal}</td></tr>
    <tr><td>Dates sol·licitades</td><td>${datesText}</td></tr>
    <tr><td>Nombre de nens</td><td>${casal.nombre_nens}</td></tr>
    <tr><td>Nombre de monitors</td><td>${casal.nombre_monitors}</td></tr>
    <tr><td>Total persones</td><td>${casal.nombre_nens + casal.nombre_monitors}</td></tr>
    <tr><td>Email de contacte</td><td>${casal.email}</td></tr>
    <tr><td>Número de contacte</td><td>${casal.telefon}</td></tr>
    <tr><td>Comentaris</td><td>${casal.comentaris || '—'}</td></tr>
  </table>
</div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from,
      to,
      replyTo: process.env.EMAIL_REPLY_TO || 'priubrogent@cinemaoriental.com',
      subject: `Nova inscripció de casals: ${casal.nom_casal}`,
      html,
    });
    if (result.error) {
      console.error('Resend error (casal admin):', result.error);
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('Casal admin notification error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendCasalConfirmation(
  casal: CasalInscriptionData
): Promise<{ success: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM || 'NITS Festival <onboarding@resend.dev>';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.highlight { background: #f5f1e8; border-left: 4px solid #c8201c; padding: 12px 16px; margin: 16px 0; }
</style></head>
<body>
<div class="container">
  <h2>Inscripció rebuda — FesNits Casals</h2>
  <p>Hola,</p>
  <p>Hem rebut correctament la inscripció del casal <strong>${casal.nom_casal}</strong> per al FesNits 2026.</p>
  <div class="highlight">
    <p>Ens posarem en contacte amb vosaltres aviat per confirmar els detalls.</p>
  </div>
  <p>Gràcies per l'interès!</p>
  <p>L'equip de FesNits</p>
</div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from,
      to: casal.email,
      replyTo: process.env.EMAIL_REPLY_TO || 'priubrogent@cinemaoriental.com',
      subject: 'Inscripció rebuda — FesNits Casals',
      html,
    });
    if (result.error) {
      console.error('Resend error (casal confirmation):', result.error);
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('Casal confirmation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
