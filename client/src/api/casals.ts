import type { CasalInscription } from '../types';

const API_BASE = '/api';

export async function submitCasalInscription(data: {
  nom_casal: string;
  dates: string[];
  nombre_nens: number;
  nombre_monitors: number;
  email: string;
  telefon: string;
  comentaris?: string;
}): Promise<{ success: boolean; id: number }> {
  const res = await fetch(`${API_BASE}/casals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error en enviar la inscripció');
  }
  return res.json();
}

export async function fetchCasalInscriptions(): Promise<CasalInscription[]> {
  const res = await fetch(`${API_BASE}/casals`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error en carregar les inscripcions');
  return res.json();
}

export async function validateCasalInscription(id: number, date: string): Promise<CasalInscription> {
  const res = await fetch(`${API_BASE}/casals/${id}/validate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ date }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error en validar la inscripció');
  }
  return res.json();
}
