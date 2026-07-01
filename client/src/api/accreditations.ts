import type { Accreditation, Code, EmailTemplate, TypeSettings } from '../types';

const API_BASE = '/api';

// Accreditations
export async function fetchAccreditations(type?: string): Promise<Accreditation[]> {
  const url = type ? `${API_BASE}/accreditations?type=${type}` : `${API_BASE}/accreditations`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch accreditations');
  return res.json();
}

export async function assignCode(id: number): Promise<Accreditation> {
  const res = await fetch(`${API_BASE}/accreditations/${id}/assign-code`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to assign code');
  }
  const data = await res.json();
  return data.accreditation;
}

export async function sendEmail(id: number): Promise<Accreditation> {
  const res = await fetch(`${API_BASE}/accreditations/${id}/send-email`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send email');
  }
  const data = await res.json();
  return data.accreditation;
}

export async function updateVariant(id: number, variant: 'nitoman' | 'super'): Promise<Accreditation> {
  const res = await fetch(`${API_BASE}/accreditations/${id}/variant`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ variant }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update variant');
  }
  const data = await res.json();
  return data.accreditation;
}

export async function createAccreditation(data: { customer_name: string; customer_email: string; outlet?: string; type: string; variant?: string }): Promise<Accreditation> {
  const res = await fetch(`${API_BASE}/accreditations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create accreditation');
  }
  const result = await res.json();
  return result.accreditation;
}

export async function updateAccreditation(id: number, data: { customer_name?: string; customer_email?: string; outlet?: string }): Promise<Accreditation> {
  const res = await fetch(`${API_BASE}/accreditations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update accreditation');
  }
  const result = await res.json();
  return result.accreditation;
}

export async function deleteAccreditation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/accreditations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete accreditation');
}

// Codes
export async function fetchCodes(type?: string): Promise<Code[]> {
  const url = type ? `${API_BASE}/codes?type=${type}` : `${API_BASE}/codes`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch codes');
  return res.json();
}

export async function fetchAvailableCodes(type: string): Promise<{ count: number; codes: Code[] }> {
  const res = await fetch(`${API_BASE}/codes/available?type=${type}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch available codes');
  return res.json();
}

export async function addCode(code: string, type: string): Promise<Code> {
  const res = await fetch(`${API_BASE}/codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code, type }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add code');
  }
  const data = await res.json();
  return data.code;
}

export async function addBulkCodes(codes: string[], type: string): Promise<{ inserted: number; duplicates: number }> {
  const res = await fetch(`${API_BASE}/codes/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ codes, type }),
  });
  if (!res.ok) throw new Error('Failed to add codes');
  return res.json();
}

export async function deleteCode(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/codes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete code');
  }
}

// Templates
export async function fetchTemplates(type?: string): Promise<EmailTemplate[]> {
  const url = type ? `${API_BASE}/templates?type=${type}` : `${API_BASE}/templates`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function fetchTemplate(id: number): Promise<EmailTemplate> {
  const res = await fetch(`${API_BASE}/templates/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch template');
  return res.json();
}

export async function updateTemplate(id: number, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const res = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update template');
  const response = await res.json();
  return response.template;
}

export async function previewTemplate(id: number, data?: Record<string, string>): Promise<{ subject: string; body: string }> {
  const res = await fetch(`${API_BASE}/templates/${id}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw new Error('Failed to preview template');
  return res.json();
}

// Settings
export async function fetchTypeSettings(type: string): Promise<TypeSettings> {
  const res = await fetch(`${API_BASE}/settings/${type}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateTypeSettings(type: string, data: Partial<TypeSettings>): Promise<TypeSettings> {
  const res = await fetch(`${API_BASE}/settings/${type}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

// Test webhook
export async function createTestAccreditation(data: {
  order_id: string;
  customer_name: string;
  customer_email: string;
  type?: string;
}): Promise<Accreditation> {
  const res = await fetch(`${API_BASE}/webhook/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create test accreditation');
  }
  const response = await res.json();
  return response.accreditation;
}
