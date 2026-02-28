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
