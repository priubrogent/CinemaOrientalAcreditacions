import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Accreditation, AccreditationType } from '../types';
import { assignCode, sendEmail, deleteAccreditation, updateAccreditation, updateVariant, createAccreditation, fetchTemplates, previewTemplate } from '../api/accreditations';

type ViewMode = 'list' | 'cards';
type FilterKey = 'all' | 'pending' | 'code_assigned' | 'email_sent';
type NitomanVariant = 'all' | 'nitoman' | 'super';

interface Props {
  accreditations: Accreditation[];
  isLoading: boolean;
  type: AccreditationType;
  variant: NitomanVariant;
}

// ─── Status atom ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:       { label: 'Pendent',       dot: 'var(--ink-50)',  ring: 'var(--rule)',      fg: 'var(--ink-70)' },
  code_assigned: { label: 'Codi assignat', dot: 'var(--gold)',    ring: 'var(--gold-30)',   fg: 'var(--gold-ink)' },
  email_sent:    { label: 'Enviat',        dot: 'var(--accent)',  ring: 'var(--accent-20)', fg: 'var(--accent)' },
} as const;

function StatusPill({ status }: { status: Accreditation['status'] }) {
  const s = STATUS_MAP[status];
  return (
    <span className="status-pill" style={{ borderColor: s.ring, color: s.fg }}>
      <span className="status-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ─── Edit modal ─────────────────────────────────────────────────────────────
function EditModal({
  row,
  type,
  onClose,
  onSaved,
}: {
  row: Accreditation;
  type: AccreditationType;
  onClose: () => void;
  onSaved: (updated: Accreditation) => void;
}) {
  const [name, setName] = useState(row.customer_name);
  const [email, setEmail] = useState(row.customer_email);
  const [outlet, setOutlet] = useState(row.outlet ?? '');
  const [variant, setVariant] = useState<'nitoman' | 'super'>(row.variant === 'super' ? 'super' : 'nitoman');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const updated = await updateAccreditation(row.id, { customer_name: name, customer_email: email, outlet: outlet || undefined });
      if (type === 'nitoman' && variant !== row.variant) {
        return updateVariant(row.id, variant);
      }
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      onSaved(updated);
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("L'email no és vàlid");
      return;
    }
    mut.mutate();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Editar acreditació</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mitjà / Empresa</label>
            <input value={outlet} onChange={e => setOutlet(e.target.value)} />
          </div>
          {type === 'nitoman' && (
            <div className="form-group">
              <label>Variant</label>
              <div className="variant-radio">
                <label>
                  <input type="radio" name="variant" value="nitoman" checked={variant === 'nitoman'} onChange={() => setVariant('nitoman')} />
                  Nitòman
                </label>
                <label>
                  <input type="radio" name="variant" value="super" checked={variant === 'super'} onChange={() => setVariant('super')} />
                  Super Nitòman
                </label>
              </div>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>Cancel·lar</button>
            <button type="submit" className="primary-btn" disabled={mut.isPending}>
              {mut.isPending ? 'Desant…' : 'Desar canvis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── New accreditation modal ─────────────────────────────────────────────────
function NewAccreditationModal({
  type,
  onClose,
  onCreated,
}: {
  type: AccreditationType;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [outlet, setOutlet] = useState('');
  const [variant, setVariant] = useState<'nitoman' | 'super'>('nitoman');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: () => createAccreditation({
      customer_name: name,
      customer_email: email,
      outlet: outlet || undefined,
      type,
      variant: type === 'nitoman' ? variant : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      onCreated();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('El nom és obligatori'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("L'email no és vàlid");
      return;
    }
    mut.mutate();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Nova acreditació</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mitjà / Empresa</label>
            <input value={outlet} onChange={e => setOutlet(e.target.value)} />
          </div>
          {type === 'nitoman' && (
            <div className="form-group">
              <label>Variant</label>
              <div className="variant-radio">
                <label>
                  <input type="radio" name="variant" value="nitoman" checked={variant === 'nitoman'} onChange={() => setVariant('nitoman')} />
                  Nitòman
                </label>
                <label>
                  <input type="radio" name="variant" value="super" checked={variant === 'super'} onChange={() => setVariant('super')} />
                  Super Nitòman
                </label>
              </div>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>Cancel·lar</button>
            <button type="submit" className="primary-btn" disabled={mut.isPending}>
              {mut.isPending ? 'Creant…' : 'Crear acreditació'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Row detail ─────────────────────────────────────────────────────────────
function RowDetail({
  row,
  type,
  onSend,
  onDelete,
  onEdit,
  isSending,
}: {
  row: Accreditation;
  type: AccreditationType;
  onSend: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isSending: boolean;
}) {
  const [mailPreview, setMailPreview] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTemplates(type).then(templates => {
      if (cancelled || templates.length === 0) return;
      const template = templates[0];
      return previewTemplate(template.id, {
        name: row.customer_name,
        email: row.customer_email,
        code: row.code ?? '',
        order_id: row.order_id,
      });
    }).then(preview => {
      if (cancelled || !preview) return;
      setMailPreview(preview);
    }).catch(() => {/* silently fall back to nothing */});
    return () => { cancelled = true; };
  }, [type, row.customer_name, row.customer_email, row.code, row.order_id]);

  return (
    <div className="detail-grid">
      <div className="detail-col">
        <h4>Acreditació</h4>
        <dl>
          <dt>Comanda</dt><dd>{row.order_id}</dd>
          <dt>Email</dt><dd>{row.customer_email}</dd>
          {row.outlet && <><dt>Mitjà / Empresa</dt><dd>{row.outlet}</dd></>}
          <dt>Codi</dt>
          <dd>{row.code ? <code className="code-chip">{row.code}</code> : <em>encara no assignat</em>}</dd>
          <dt>Creat</dt>
          <dd>{new Date(row.created_at).toLocaleString('ca-ES')}</dd>
          {row.email_sent_at && (
            <><dt>Email enviat</dt><dd>{new Date(row.email_sent_at).toLocaleString('ca-ES')}</dd></>
          )}
        </dl>

        <h4>Activitat</h4>
        <ol className="timeline">
          <li>
            <span className="t-dot" data-tone="ok" />
            <span>
              Sol·licitud rebuda<br/>
              <em>{new Date(row.created_at).toLocaleString('ca-ES')}</em>
            </span>
          </li>
          {row.code && (
            <li>
              <span className="t-dot" data-tone="info" />
              <span>
                Codi <code>{row.code}</code> assignat
              </span>
            </li>
          )}
          {row.email_sent_at && (
            <li>
              <span className="t-dot" data-tone="ok" />
              <span>
                Email enviat a {row.customer_email}<br/>
                <em>{new Date(row.email_sent_at).toLocaleString('ca-ES')}</em>
              </span>
            </li>
          )}
        </ol>
      </div>

      <div className="detail-col">
        <div className="mail-head">
          <span className="mail-from">nits@cinemaoriental.com</span>
          <span className="mail-arrow">→</span>
          <span>{row.customer_email}</span>
        </div>
        <div className="mail-subject">
          {mailPreview ? mailPreview.subject : '…'}
        </div>
        {mailPreview
          ? <div className="mail-body" dangerouslySetInnerHTML={{ __html: mailPreview.body }} />
          : <div className="mail-body"><p style={{ color: 'var(--ink-50)' }}>Carregant plantilla…</p></div>
        }
        <div className="detail-actions">
          {(row.status === 'code_assigned' || row.status === 'email_sent') && (
            <button className="primary-btn" onClick={onSend} disabled={isSending}>
              {isSending ? 'Enviant…' : row.status === 'email_sent' ? 'Reenviar email' : 'Enviar email'}
            </button>
          )}
          <button className="ghost-btn" onClick={onEdit}>Editar acreditació</button>
          <button className="ghost-btn">Copiar enllaç</button>
          <button className="ghost-btn danger" onClick={onDelete}>
            Eliminar acreditació
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single row ──────────────────────────────────────────────────────────────
function AccRow({
  row,
  type,
  checked,
  onCheck,
  expanded,
  onExpand,
  onRefresh,
}: {
  row: Accreditation;
  type: AccreditationType;
  checked: boolean;
  onCheck: () => void;
  expanded: boolean;
  onExpand: () => void;
  onRefresh: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const assignMut = useMutation({
    mutationFn: () => assignCode(row.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accreditations', type] }); queryClient.invalidateQueries({ queryKey: ['codes', type] }); setError(null); },
    onError: (e: Error) => setError(e.message),
  });

  const sendMut = useMutation({
    mutationFn: () => sendEmail(row.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accreditations', type] }); setError(null); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAccreditation(row.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accreditations', type] }); queryClient.invalidateQueries({ queryKey: ['codes', type] }); onRefresh(); },
    onError: (e: Error) => setError(e.message),
  });

  const dateStr = new Date(row.created_at).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' });
  const isLoading = assignMut.isPending || sendMut.isPending || deleteMut.isPending;

  return (
    <>
      <tr className={`row ${checked ? 'is-checked' : ''} ${expanded ? 'is-expanded' : ''}`}>
        <td className="col-check">
          <label className="check">
            <input type="checkbox" checked={checked} onChange={onCheck} />
            <span />
          </label>
        </td>
        <td className="cell-name" onClick={onExpand} style={{ cursor: 'pointer' }}>
          <div className="name">
            {row.customer_name}
            {row.variant === 'super' && <span className="variant-tag">Super</span>}
          </div>
          <div className="email">{row.customer_email}</div>
        </td>
        <td className="col-order" onClick={onExpand} style={{ cursor: 'pointer' }}>
          <div className="order-id">{row.order_id}</div>
          {row.outlet && <div className="outlet">{row.outlet}</div>}
        </td>
        <td onClick={onExpand} style={{ cursor: 'pointer' }}>
          {row.code
            ? <code className="code-chip">{row.code}</code>
            : <span className="dash">—</span>
          }
        </td>
        <td onClick={onExpand} style={{ cursor: 'pointer' }}>
          <StatusPill status={row.status} />
        </td>
        <td className="col-date" onClick={onExpand} style={{ cursor: 'pointer' }}>
          <span>{dateStr}</span>
          {row.email_sent_at && (
            <div className="sub-date">
              → {new Date(row.email_sent_at).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
            </div>
          )}
        </td>
        <td className="col-actions">
          {row.status === 'pending' && (
            <button className="row-btn row-btn-primary" onClick={() => assignMut.mutate()} disabled={isLoading}>
              {assignMut.isPending ? '…' : 'Assignar'}
            </button>
          )}
          {row.status === 'code_assigned' && (
            <button className="row-btn row-btn-primary" onClick={() => sendMut.mutate()} disabled={isLoading}>
              {sendMut.isPending ? '…' : 'Enviar'}
            </button>
          )}
          {row.status === 'email_sent' && (
            <button className="row-btn row-btn-ghost" onClick={() => sendMut.mutate()} disabled={isLoading}>
              {sendMut.isPending ? '…' : 'Reenviar'}
            </button>
          )}
          <button className="row-btn-icon" onClick={onExpand} title="Detalls">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
            </svg>
          </button>
        </td>
      </tr>

      {error && (
        <tr>
          <td colSpan={7} style={{ padding: '8px 14px', background: 'var(--accent-08)', color: 'var(--accent)', fontSize: '13px', borderBottom: '1px solid var(--rule-soft)' }}>
            {error}
          </td>
        </tr>
      )}

      {expanded && (
        <tr className="row-detail-wrap">
          <td colSpan={7}>
            <RowDetail
              row={row}
              type={type}
              onSend={() => sendMut.mutate()}
              onDelete={() => { if (confirm('Segur que vols eliminar aquesta acreditació?')) deleteMut.mutate(); }}
              onEdit={() => setEditing(true)}
              isSending={sendMut.isPending}
            />
          </td>
        </tr>
      )}

      {editing && (
        <EditModal
          row={row}
          type={type}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
function AccCard({ row, type }: { row: Accreditation; type: AccreditationType }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const assignMut = useMutation({
    mutationFn: () => assignCode(row.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accreditations', type] }); queryClient.invalidateQueries({ queryKey: ['codes', type] }); setError(null); },
    onError: (e: Error) => setError(e.message),
  });

  const sendMut = useMutation({
    mutationFn: () => sendEmail(row.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accreditations', type] }); setError(null); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAccreditation(row.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accreditations', type] }); queryClient.invalidateQueries({ queryKey: ['codes', type] }); },
    onError: (e: Error) => setError(e.message),
  });

  const isLoading = assignMut.isPending || sendMut.isPending || deleteMut.isPending;

  return (
    <article className="acc-card">
      <header className="card-head">
        <div>
          <div className="name">
            {row.customer_name}
            {row.variant === 'super' && <span className="variant-tag">Super</span>}
          </div>
          <div className="email">{row.customer_email}</div>
        </div>
        <StatusPill status={row.status} />
      </header>

      <dl className="card-meta">
        <div><dt>Comanda</dt><dd>{row.order_id}</dd></div>
        <div><dt>Mitjà</dt><dd>{row.outlet ?? '—'}</dd></div>
        <div>
          <dt>Codi</dt>
          <dd>
            {row.code
              ? <code className="code-chip">{row.code}</code>
              : <span className="dash">—</span>
            }
          </dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{new Date(row.created_at).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}</dd>
        </div>
      </dl>

      {error && (
        <div style={{ marginBottom: '10px', padding: '8px 12px', background: 'var(--accent-08)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--accent)' }}>
          {error}
        </div>
      )}

      <footer className="card-foot">
        {row.status === 'pending' && (
          <button className="primary-btn" onClick={() => assignMut.mutate()} disabled={isLoading}>
            {assignMut.isPending ? '…' : 'Assignar'}
          </button>
        )}
        {row.status === 'code_assigned' && (
          <button className="primary-btn" onClick={() => sendMut.mutate()} disabled={isLoading}>
            {sendMut.isPending ? '…' : 'Enviar'}
          </button>
        )}
        {row.status === 'email_sent' && (
          <button className="ghost-btn" onClick={() => sendMut.mutate()} disabled={isLoading}>
            {sendMut.isPending ? 'Enviant…' : 'Reenviar'}
          </button>
        )}
        <button
          className="ghost-btn danger"
          onClick={() => { if (confirm('Segur que vols eliminar?')) deleteMut.mutate(); }}
          disabled={isLoading}
        >
          Eliminar
        </button>
      </footer>
    </article>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AccreditationList({ accreditations, isLoading, type, variant }: Props) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(new Set<number>());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showNewModal, setShowNewModal] = useState(false);

  // Reset selection and expanded when type changes
  useEffect(() => {
    setSelected(new Set());
    setExpanded(null);
    setFilter('all');
    setQ('');
  }, [type]);

  // Bulk mutations
  const bulkAssignMut = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        const acc = accreditations.find(a => a.id === id);
        if (acc?.status === 'pending') await assignCode(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
      setSelected(new Set());
    },
  });

  const bulkSendMut = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        const acc = accreditations.find(a => a.id === id);
        if (!acc) continue;
        if (acc.status === 'pending') await assignCode(id);
        // After assign, it's code_assigned — send email
        if (acc.status === 'pending' || acc.status === 'code_assigned') {
          await sendEmail(id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
      setSelected(new Set());
    },
  });

  const counts = useMemo(() => ({
    all:           accreditations.length,
    pending:       accreditations.filter(r => r.status === 'pending').length,
    code_assigned: accreditations.filter(r => r.status === 'code_assigned').length,
    email_sent:    accreditations.filter(r => r.status === 'email_sent').length,
  }), [accreditations]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return accreditations.filter(r => {
      if (type === 'nitoman' && variant !== 'all') {
        if (r.variant !== variant) return false;
      }
      if (filter !== 'all' && r.status !== filter) return false;
      if (!term) return true;
      return (
        r.customer_name.toLowerCase().includes(term) ||
        r.customer_email.toLowerCase().includes(term) ||
        (r.code ?? '').toLowerCase().includes(term) ||
        r.order_id.toLowerCase().includes(term)
      );
    });
  }, [accreditations, filter, q, variant, type]);

  const toggle = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map(r => r.id))
    );
  }, [filtered]);

  const allChecked = filtered.length > 0 && filtered.every(r => selected.has(r.id));
  const selectedArr = Array.from(selected);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(new Set());
      if (e.key === 'E' && e.shiftKey && selected.size > 0) {
        bulkSendMut.mutate(selectedArr);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, selectedArr]);

  const downloadCSV = () => {
    const headers = ['ID', 'Comanda', 'Nom', 'Email', 'Codi', 'Estat', 'Data creació', 'Email enviat'];
    const rows = accreditations.map(a => [
      a.id, a.order_id, a.customer_name, a.customer_email,
      a.code ?? '', a.status, a.created_at, a.email_sent_at ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `acreditacions_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const FILTERS: { k: FilterKey; label: string }[] = [
    { k: 'all',           label: 'Totes' },
    { k: 'pending',       label: 'Pendents' },
    { k: 'code_assigned', label: 'Per enviar' },
    { k: 'email_sent',    label: 'Enviades' },
  ];

  if (isLoading) {
    return <div className="loading-state">Carregant acreditacions…</div>;
  }

  return (
    <div>
      {/* Toolbar */}
      <div className={`toolbar ${selected.size > 0 ? 'has-selection' : ''}`}>
        {selected.size === 0 ? (
          <>
            <div className="filter-row">
              {FILTERS.map(f => (
                <button
                  key={f.k}
                  className={`chip ${filter === f.k ? 'is-active' : ''}`}
                  onClick={() => setFilter(f.k)}
                >
                  {f.label}
                  <span className="chip-n">{counts[f.k]}</span>
                </button>
              ))}
            </div>

            <div className="search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
              </svg>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Cerca per nom, email, codi o comanda…"
              />
              {q && (
                <button className="clear" onClick={() => setQ('')} aria-label="Esborrar">×</button>
              )}
            </div>

            <div className="view-toggle">
              <button
                className={viewMode === 'list' ? 'is-on' : ''}
                onClick={() => setViewMode('list')}
                title="Vista llista"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <button
                className={viewMode === 'cards' ? 'is-on' : ''}
                onClick={() => setViewMode('cards')}
                title="Vista targetes"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
            </div>

            <button className="ghost-btn" onClick={downloadCSV} disabled={accreditations.length === 0}>
              Exportar CSV
            </button>

            <button className="primary-btn" onClick={() => setShowNewModal(true)}>
              + Nova acreditació
            </button>
          </>
        ) : (
          <>
            <div className="selection-info">
              <button className="link-soft" onClick={() => setSelected(new Set())}>✕</button>
              <strong>{selected.size}</strong> seleccionades
            </div>
            <div className="selection-actions">
              <button
                className="ghost-btn"
                onClick={() => bulkAssignMut.mutate(selectedArr)}
                disabled={bulkAssignMut.isPending || bulkSendMut.isPending}
              >
                {bulkAssignMut.isPending ? 'Assignant…' : 'Assignar codis'}
              </button>
              <button
                className="primary-btn"
                onClick={() => bulkSendMut.mutate(selectedArr)}
                disabled={bulkAssignMut.isPending || bulkSendMut.isPending}
              >
                {bulkSendMut.isPending ? 'Enviant…' : 'Assignar + Enviar'}
              </button>
              <span className="kbd-hint">
                <kbd>Shift+E</kbd> per enviar · <kbd>Esc</kbd> per sortir
              </span>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {accreditations.length === 0 ? (
        <div className="empty-state">
          <p>Encara no hi ha acreditacions</p>
          <p>Les noves compres apareixeran aquí automàticament</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="table-wrap">
          <table className="acc-table">
            <thead>
              <tr>
                <th className="col-check">
                  <label className="check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                    <span />
                  </label>
                </th>
                <th>Client</th>
                <th>Comanda / Mitjà</th>
                <th>Codi</th>
                <th>Estat</th>
                <th>Data</th>
                <th className="col-actions">Accions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">No hi ha resultats per aquest filtre.</td>
                </tr>
              ) : (
                filtered.map(row => (
                  <AccRow
                    key={row.id}
                    row={row}
                    type={type}
                    checked={selected.has(row.id)}
                    onCheck={() => toggle(row.id)}
                    expanded={expanded === row.id}
                    onExpand={() => setExpanded(expanded === row.id ? null : row.id)}
                    onRefresh={() => setExpanded(null)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p>No hi ha resultats per aquest filtre.</p>
            </div>
          ) : (
            filtered.map(row => (
              <AccCard key={row.id} row={row} type={type} />
            ))
          )}
        </div>
      )}

      {/* Footer kbd hints */}
      <div className="footer-hint">
        <kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Space</kbd> seleccionar · <kbd>E</kbd> enviar · <kbd>⌘K</kbd> cerca
      </div>

      {showNewModal && (
        <NewAccreditationModal
          type={type}
          onClose={() => setShowNewModal(false)}
          onCreated={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
