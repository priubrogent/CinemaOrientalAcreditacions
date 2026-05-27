import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCasalInscriptions, validateCasalInscription } from '../api/casals';
import type { CasalInscription } from '../types';

function ValidateAction({ casal }: { casal: CasalInscription }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(casal.dates[0] ?? '');

  const mutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) =>
      validateCasalInscription(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casals'] });
    },
  });

  if (casal.validated) {
    return (
      <span className="casals-badge casals-badge-validat">
        ✓ {casal.validated_date}
      </span>
    );
  }

  return (
    <div className="casals-validate-wrap">
      <select
        className="casals-date-select"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
      >
        {casal.dates.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <button
        className="casals-btn-validate"
        disabled={mutation.isPending || !selectedDate}
        onClick={() => mutation.mutate({ id: casal.id, date: selectedDate })}
      >
        {mutation.isPending ? '…' : 'Validar'}
      </button>
    </div>
  );
}

export default function CasalsAdmin() {
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
                <th>Acció</th>
              </tr>
            </thead>
            <tbody>
              {inscriptions.map((casal: CasalInscription) => (
                <tr key={casal.id}>
                  <td data-label="Nom del casal">
                    <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{casal.nom_casal}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>{casal.email}</div>
                  </td>
                  <td data-label="Dates sol·licitades" style={{ fontSize: 12 }}>
                    {casal.dates.map(d => (
                      <span key={d} style={{ display: 'block' }}>{d}</span>
                    ))}
                  </td>
                  <td data-label="Nens" style={{ textAlign: 'center' }}>{casal.nombre_nens}</td>
                  <td data-label="Monitors" style={{ textAlign: 'center' }}>{casal.nombre_monitors}</td>
                  <td data-label="Total" style={{ textAlign: 'center', fontWeight: 600 }}>
                    {casal.nombre_nens + casal.nombre_monitors}
                  </td>
                  <td data-label="Estat">
                    {casal.validated ? (
                      <span className="casals-badge casals-badge-validat">
                        Validat
                      </span>
                    ) : (
                      <span className="casals-badge casals-badge-pendent">
                        Pendent
                      </span>
                    )}
                  </td>
                  <td data-label="Acció">
                    <ValidateAction casal={casal} />
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
