import { Resend } from 'resend';
import type { Accreditation, EmailTemplate } from '../types/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

export async function sendAccreditationEmail(
  accreditation: Accreditation,
  template: EmailTemplate
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

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'NITS Festival <onboarding@resend.dev>',
      to: accreditation.customer_email,
      subject,
      html,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Email sent via Resend:', result.data?.id);
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
