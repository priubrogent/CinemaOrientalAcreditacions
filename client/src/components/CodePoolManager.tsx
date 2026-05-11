import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCodes, addBulkCodes } from '../api/accreditations';
import type { AccreditationType } from '../types';

const TYPE_LABELS: Record<AccreditationType, string> = {
  premsa: 'Premsa', professional: 'Professional', nitoman: 'Nitòman',
};

export default function CodePoolManager() {
  const { type } = useParams<{ type: AccreditationType }>();
  const [bulkInput, setBulkInput] = useState('');
  const [importResult, setImportResult] = useState<{ inserted: number; duplicates: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['codes', type],
    queryFn: () => fetchCodes(type),
    enabled: !!type,
  });

  const addBulkMut = useMutation({
    mutationFn: (codeList: string[]) => addBulkCodes(codeList, type!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
      queryClient.invalidateQueries({ queryKey: ['codes', type, 'available'] });
      setBulkInput('');
      setImportResult(result);
      setTimeout(() => setImportResult(null), 4000);
    },
  });

  const handleImport = () => {
    const list = bulkInput.split('\n').map(c => c.trim()).filter(Boolean);
    if (list.length === 0) return;
    addBulkMut.mutate(list);
  };

  if (!type) return null;

  const available = codes.filter(c => !c.is_used);
  const used      = codes.filter(c => c.is_used);
  const pendingCount = bulkInput.split('\n').filter(c => c.trim()).length;

  const typeColor = type === 'premsa' ? 'var(--premsa)' : type === 'professional' ? 'var(--professional)' : 'var(--nitoman)';

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-head">
          <div className="hero-eyebrow">
            <span className="eyebrow-marker" style={{ background: typeColor }} />
            Pool de codis
          </div>
          <h1 className="hero-title">Codis · {TYPE_LABELS[type]}</h1>
          <p className="hero-lede">
            Importa codis al pool i fes-ne seguiment. Els codis s'assignen en ordre FIFO.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-n">{codes.length}</div>
            <div className="stat-l">Total</div>
          </div>
          <div className="stat tone-ok">
            <div className="stat-n">{available.length}</div>
            <div className="stat-l">Disponibles</div>
          </div>
          <div className="stat tone-info">
            <div className="stat-n">{used.length}</div>
            <div className="stat-l">Assignats</div>
          </div>
        </div>
      </section>

      {/* Import */}
      <div className="code-import">
        <h3>Afegir codis</h3>
        <p>Enganxa un codi per línia. Els duplicats s'ignoraran automàticament.</p>
        <textarea
          value={bulkInput}
          onChange={e => { setBulkInput(e.target.value); setImportResult(null); }}
          placeholder={`${type.toUpperCase()}-26-001\n${type.toUpperCase()}-26-002\n${type.toUpperCase()}-26-003`}
          rows={6}
        />
        <div className="ci-foot">
          <span className="hint">
            {importResult
              ? `✓ ${importResult.inserted} codis importats${importResult.duplicates > 0 ? `, ${importResult.duplicates} duplicats ignorats` : ''}`
              : pendingCount > 0
              ? `${pendingCount} codi${pendingCount !== 1 ? 's' : ''} a la cua`
              : '0 codis a la cua'
            }
          </span>
          <button
            className="primary-btn"
            onClick={handleImport}
            disabled={addBulkMut.isPending || !bulkInput.trim()}
          >
            {addBulkMut.isPending ? 'Important…' : 'Importar al pool'}
          </button>
        </div>
      </div>

      {/* Available codes grid */}
      <div className="code-list">
        <h3>Codis disponibles</h3>
        {isLoading ? (
          <div className="loading-state">Carregant codis…</div>
        ) : available.length === 0 ? (
          <div className="empty-state">
            <p>No hi ha codis disponibles</p>
            <p>Afegeix codis al pool per poder-los assignar</p>
          </div>
        ) : (
          <div className="code-grid">
            {available.map(code => (
              <code key={code.id} className="code-tile">{code.code}</code>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
