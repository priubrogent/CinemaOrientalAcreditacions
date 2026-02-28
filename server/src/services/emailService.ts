import nodemailer from 'nodemailer';
import type { Accreditation, EmailTemplate } from '../types/index.js';

const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465, // true for port 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: accreditation.customer_email,
      subject,
      html,
    });

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
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
