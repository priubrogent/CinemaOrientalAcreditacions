import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCasalInscriptions,
  validateCasalInscription,
  unvalidateCasalInscription,
  updateCasalInscription,
  deleteCasalInscription,
} from '../api/casals';
import type { CasalInscription } from '../types';

const DATES = [
  'Dimarts 14/07',
  'Dimecres 15/07',
  'Dijous 16/07',
  'Divendres 17/07',
];

// ── Edit modal ──────────────────────────────────────────────────────────────

interface EditModalProps {
  casal: CasalInscription;
  onClose: () => void;
}

function EditModal({ casal, onClose }: EditModalProps) {
  const queryClient = useQueryClient();
  const [nomCasal, setNomCasal] = useState(casal.nom_casal);
  const [dates, setDates] = useState<string[]>(casal.dates);
  const [nombreNens, setNombreNens] = useState(String(casal.nombre_nens));
  const [nombreMonitors, setNombreMonitors] = useState(String(casal.nombre_monitors));
  const [email, setEmail] = useState(casal.email);
  const [telefon, setTelefon] = useState(casal.telefon);
  const [comentaris, setComentaris] = useState(casal.comentaris ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCasalInscription>[1]) =>
      updateCasalInscription(casal.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casals'] });
      onClose();
    },
  });

  function toggleDate(d: string) {
    setDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!nomCasal.trim()) errs.nomCasal = 'Camp obligatori';
    if (dates.length === 0) errs.dates = 'Selecciona almenys una data';
    if (!nombreNens || parseInt(nombreNens) < 1) errs.nombreNens = 'Ha de ser un número positiu';
    if (!nombreMonitors || parseInt(nombreMonitors) < 1) errs.nombreMonitors = 'Ha de ser un número positiu';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email no vàlid';
    if (!telefon.trim()) errs.telefon = 'Camp obligatori';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      nom_casal: nomCasal.trim(),
      dates,
      nombre_nens: parseInt(nombreNens),
      nombre_monitors: parseInt(nombreMonitors),
      email: email.trim(),
      telefon: telefon.trim(),
      comentaris: comentaris.trim() || undefined,
    });
  }

  return (
    <div className="casal-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="casal-modal" role="dialog" aria-modal="true">
        <div className="casal-modal-header">
          <h3 className="casal-modal-title">Editar inscripció</h3>
          <button className="sidebar-close-btn" style={{ display: 'flex' }} onClick={onClose} aria-label="Tancar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {mutation.isError && (
          <div className="casals-error-banner" style={{ margin: '0 0 16px' }}>
            {(mutation.error as Error).message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="casals-form">
          <div className="casals-field">
            <label className="casals-label" htmlFor="edit-nom">Nom del casal <span className="casals-required">*</span></label>
            <input id="edit-nom" type="text" className={`casals-input${errors.nomCasal ? ' is-invalid' : ''}`} value={nomCasal} onChange={e => setNomCasal(e.target.value)} />
            {errors.nomCasal && <span className="casals-field-error">{errors.nomCasal}</span>}
          </div>

          <div className="casals-field">
            <span className="casals-label">Dates disponibles <span className="casals-required">*</span></span>
            <div className={`casals-checkgroup${errors.dates ? ' is-invalid' : ''}`}>
              {DATES.map(d => (
                <label key={d} className="casals-check-label">
                  <input type="checkbox" className="casals-checkbox" checked={dates.includes(d)} onChange={() => toggleDate(d)} />
                  {d}
                </label>
              ))}
            </div>
            {errors.dates && <span className="casals-field-error">{errors.dates}</span>}
          </div>

          <div className="casals-row">
            <div className="casals-field">
              <label className="casals-label" htmlFor="edit-nens">Nombre de nens <span className="casals-required">*</span></label>
              <input id="edit-nens" type="number" min="1" className={`casals-input${errors.nombreNens ? ' is-invalid' : ''}`} value={nombreNens} onChange={e => setNombreNens(e.target.value)} />
              {errors.nombreNens && <span className="casals-field-error">{errors.nombreNens}</span>}
            </div>
            <div className="casals-field">
              <label className="casals-label" htmlFor="edit-monitors">Nombre de monitors <span className="casals-required">*</span></label>
              <input id="edit-monitors" type="number" min="1" className={`casals-input${errors.nombreMonitors ? ' is-invalid' : ''}`} value={nombreMonitors} onChange={e => setNombreMonitors(e.target.value)} />
              {errors.nombreMonitors && <span className="casals-field-error">{errors.nombreMonitors}</span>}
            </div>
          </div>

          <div className="casals-field">
            <label className="casals-label" htmlFor="edit-email">Email de contacte <span className="casals-required">*</span></label>
            <input id="edit-email" type="email" className={`casals-input${errors.email ? ' is-invalid' : ''}`} value={email} onChange={e => setEmail(e.target.value)} />
            {errors.email && <span className="casals-field-error">{errors.email}</span>}
          </div>

          <div className="casals-field">
            <label className="casals-label" htmlFor="edit-tel">Número de contacte <span className="casals-required">*</span></label>
            <input id="edit-tel" type="tel" className={`casals-input${errors.telefon ? ' is-invalid' : ''}`} value={telefon} onChange={e => setTelefon(e.target.value)} />
            {errors.telefon && <span className="casals-field-error">{errors.telefon}</span>}
          </div>

          <div className="casals-field">
            <label className="casals-label" htmlFor="edit-comentaris">Comentaris</label>
            <textarea id="edit-comentaris" className="casals-textarea" value={comentaris} onChange={e => setComentaris(e.target.value)} rows={3} />
          </div>

          <div className="casal-modal-actions">
            <button type="button" className="casal-btn-secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel·lar
            </button>
            <button type="submit" className="casals-submit" style={{ margin: 0 }} disabled={mutation.isPending}>
              {mutation.isPending ? 'Desant…' : 'Desar canvis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Row actions ─────────────────────────────────────────────────────────────

interface RowActionsProps {
  casal: CasalInscription;
  onEdit: () => void;
}

function RowActions({ casal, onEdit }: RowActionsProps) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedDate, setSelectedDate] = useState(casal.dates[0] ?? '');

  const validateMut = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => validateCasalInscription(id, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['casals'] }),
  });

  const unvalidateMut = useMutation({
    mutationFn: (id: number) => unvalidateCasalInscription(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['casals'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCasalInscription(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['casals'] }),
  });

  const busy = validateMut.isPending || unvalidateMut.isPending || deleteMut.isPending;

  return (
    <div className="casal-row-actions">
      {/* Validate / Unvalidate */}
      {casal.validated ? (
        <button
          className="casal-action-btn casal-action-warn"
          disabled={busy}
          title="Desvalidar"
          onClick={() => unvalidateMut.mutate(casal.id)}
        >
          Desvalidar
        </button>
      ) : (
        <div className="casals-validate-wrap">
          <select
            className="casals-date-select"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          >
            {casal.dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button
            className="casals-btn-validate"
            disabled={busy || !selectedDate}
            onClick={() => validateMut.mutate({ id: casal.id, date: selectedDate })}
          >
            {validateMut.isPending ? '…' : 'Validar'}
          </button>
        </div>
      )}

      {/* Edit */}
      <button
        className="casal-action-btn casal-action-neutral"
        disabled={busy}
        onClick={onEdit}
        title="Editar"
      >
        Editar
      </button>

      {/* Delete */}
      {confirmDelete ? (
        <div className="casal-confirm-wrap">
          <span style={{ fontSize: 12, color: 'var(--accent)' }}>Segur?</span>
          <button
            className="casal-action-btn casal-action-danger"
            disabled={deleteMut.isPending}
            onClick={() => deleteMut.mutate(casal.id)}
          >
            {deleteMut.isPending ? '…' : 'Sí, eliminar'}
          </button>
          <button
            className="casal-action-btn casal-action-neutral"
            onClick={() => setConfirmDelete(false)}
          >
            No
          </button>
        </div>
      ) : (
        <button
          className="casal-action-btn casal-action-danger"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
          title="Eliminar"
        >
          Eliminar
        </button>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function CasalsAdmin() {
  const [editingCasal, setEditingCasal] = useState<CasalInscription | null>(null);

  const { data: inscriptions = [], isLoading, isError } = useQuery({
    queryKey: ['casals'],
    queryFn: fetchCasalInscriptions,
    refetchInterval: 60000,
  });

  const totalNens = inscriptions.reduce((s, c) => s + c.nombre_nens, 0);
  const totalMonitors = inscriptions.reduce((s, c) => s + c.nombre_monitors, 0);
  const totalPersones = totalNens + totalMonitors;
  const validats = inscriptions.filter(c => c.validated).length;

  return (
    <div className="main">
      {editingCasal && (
        <EditModal casal={editingCasal} onClose={() => setEditingCasal(null)} />
      )}

      {/* Hero */}
      <div className="hero" style={{ marginBottom: 0 }}>
        <div>
          <div className="hero-eyebrow">
            <span className="eyebrow-marker" />
            Casals d'estiu · FesNits 2026
          </div>
          <h1 className="hero-title">Casals</h1>
          <p className="hero-lede">Gestiona les inscripcions de casals d'estiu al festival.</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flow-strip" style={{ marginBottom: 28 }}>
        <div className="flow-step tone-mute">
          <div className="flow-n">{inscriptions.length}</div>
          <div className="flow-label">INSCRIPCIONS</div>
          <div className="flow-sub">Rebudes en total</div>
        </div>
        <div className="flow-step tone-warn">
          <div className="flow-n">{inscriptions.length - validats}</div>
          <div className="flow-label">PENDENTS</div>
          <div className="flow-sub">Sense validar</div>
        </div>
        <div className="flow-step tone-ok">
          <div className="flow-n">{validats}</div>
          <div className="flow-label">VALIDATS</div>
          <div className="flow-sub">Confirmats</div>
        </div>
        <div className="flow-step tone-info">
          <div className="flow-n">{totalNens}</div>
          <div className="flow-label">NENS</div>
          <div className="flow-sub">Total inscrits</div>
        </div>
        <div className="flow-step tone-info">
          <div className="flow-n">{totalMonitors}</div>
          <div className="flow-label">MONITORS</div>
          <div className="flow-sub">Total inscrits</div>
        </div>
        <div className="flow-step" style={{ borderLeftColor: 'var(--accent)', background: 'var(--accent-08)' }}>
          <div className="flow-n" style={{ color: 'var(--accent)' }}>{totalPersones}</div>
          <div className="flow-label">TOTAL PERSONES</div>
          <div className="flow-sub">Nens + monitors</div>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-50)', fontSize: 14 }}>
          Carregant…
        </div>
      )}

      {isError && (
        <div style={{ padding: '16px', background: 'var(--accent-08)', border: '1px solid var(--accent-20)', borderRadius: 6, fontSize: 13, color: 'var(--accent)', margin: '24px 0' }}>
          Error en carregar les inscripcions.
        </div>
      )}

      {!isLoading && !isError && inscriptions.length === 0 && (
        <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-50)', fontSize: 14 }}>
          Encara no hi ha inscripcions.
        </div>
      )}

      {!isLoading && inscriptions.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="casals-admin-table">
            <thead>
              <tr>
                <th>Nom del casal</th>
                <th>Dates sol·licitades</th>
                <th>Nens</th>
                <th>Monitors</th>
                <th>Total</th>
                <th>Estat</th>
                <th>Accions</th>
              </tr>
            </thead>
            <tbody>
              {inscriptions.map((casal: CasalInscription) => (
                <tr key={casal.id}>
                  <td data-label="Nom del casal">
                    <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{casal.nom_casal}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>{casal.email}</div>
                    {casal.telefon && <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>{casal.telefon}</div>}
                  </td>
                  <td data-label="Dates sol·licitades" style={{ fontSize: 12 }}>
                    {casal.dates.map(d => <span key={d} style={{ display: 'block' }}>{d}</span>)}
                  </td>
                  <td data-label="Nens" style={{ textAlign: 'center' }}>{casal.nombre_nens}</td>
                  <td data-label="Monitors" style={{ textAlign: 'center' }}>{casal.nombre_monitors}</td>
                  <td data-label="Total" style={{ textAlign: 'center', fontWeight: 600 }}>
                    {casal.nombre_nens + casal.nombre_monitors}
                  </td>
                  <td data-label="Estat">
                    {casal.validated ? (
                      <span className="casals-badge casals-badge-validat">✓ {casal.validated_date}</span>
                    ) : (
                      <span className="casals-badge casals-badge-pendent">Pendent</span>
                    )}
                  </td>
                  <td data-label="Accions">
                    <RowActions casal={casal} onEdit={() => setEditingCasal(casal)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
