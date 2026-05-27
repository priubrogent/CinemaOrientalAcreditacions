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

  return (
    <div className="main">
      <div className="toolbar">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: 0, letterSpacing: '-0.02em' }}>
            Casals
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '4px 0 0' }}>
            Inscripcions rebudes — FesNits 2026
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
          {inscriptions.length} inscripció{inscriptions.length !== 1 ? 'ns' : ''}
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
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
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
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{casal.nom_casal}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>{casal.email}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {casal.dates.map(d => (
                      <span key={d} style={{ display: 'block' }}>{d}</span>
                    ))}
                  </td>
                  <td style={{ textAlign: 'center' }}>{casal.nombre_nens}</td>
                  <td style={{ textAlign: 'center' }}>{casal.nombre_monitors}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {casal.nombre_nens + casal.nombre_monitors}
                  </td>
                  <td>
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
                  <td>
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
