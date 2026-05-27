import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAccreditations, fetchAvailableCodes } from '../api/accreditations';
import AccreditationList from '../components/AccreditationList';
import type { Accreditation, AccreditationType } from '../types';

const TYPE_DEFS: Record<AccreditationType, { label: string; sub: string }> = {
  premsa:       { label: 'Premsa',       sub: 'Mitjans i crítica' },
  professional: { label: 'Professional', sub: 'Indústria audiovisual' },
  nitoman:      { label: 'Nitòman',      sub: 'Abonats al festival' },
  casals:       { label: 'Casals',       sub: 'Casals d\'estiu' },
};

const TYPE_COLORS: Record<AccreditationType, string> = {
  premsa:       'var(--premsa)',
  professional: 'var(--professional)',
  nitoman:      'var(--nitoman)',
  casals:       'var(--accent)',
};

const NITOMAN_VARIANTS = [
  { key: 'all',    label: 'Tots' },
  { key: 'nitoman', label: 'Nitòman' },
  { key: 'super',   label: 'Super Nitòman' },
] as const;

type NitomanVariant = 'all' | 'nitoman' | 'super';

interface StatsHeroProps {
  type: AccreditationType;
  rows: Accreditation[];
  codesAvailable: number;
  variant: NitomanVariant;
  onVariantChange: (v: NitomanVariant) => void;
}

function StatsHero({ type, rows, codesAvailable, variant, onVariantChange }: StatsHeroProps) {
  const total        = rows.length;
  const pending      = rows.filter(r => r.status === 'pending').length;
  const codeAssigned = rows.filter(r => r.status === 'code_assigned').length;
  const sent         = rows.filter(r => r.status === 'email_sent').length;
  const superCount   = rows.filter(r => r.variant === 'super').length;
  const stdCount     = rows.filter(r => r.variant === 'nitoman').length;
  const low          = codesAvailable < pending + codeAssigned + 3;
  const isNitoman    = type === 'nitoman';
  const def          = TYPE_DEFS[type];
  const typeColor    = TYPE_COLORS[type];

  const flow = [
    { n: total,        label: 'Sol·licituds',  hint: 'Rebudes en total',                  tone: 'mute' },
    { n: pending,      label: 'Esperant codi', hint: 'Encara sense codi assignat',         tone: 'warn' },
    { n: codeAssigned, label: 'Per enviar',    hint: 'Codi assignat, falta enviar email',  tone: 'info' },
    { n: sent,         label: 'Email enviat',  hint: 'Tot completat',                      tone: 'ok'   },
  ] as const;

  return (
    <section className="hero">
      <div className="hero-head">
        <div className="hero-eyebrow">
          <span className="eyebrow-marker" style={{ background: typeColor }} />
          Espai independent · {def.sub}
        </div>
        <h1 className="hero-title">{def.label}</h1>
        <p className="hero-lede">
          Gestiona les sol·licituds, assigna codis i envia confirmacions per la secció{' '}
          <em>{def.label}</em> del festival.
        </p>

        {isNitoman && (
          <div className="variant-switch" role="tablist" aria-label="Variant">
            {NITOMAN_VARIANTS.map(v => (
              <button
                key={v.key}
                role="tab"
                aria-selected={variant === v.key}
                className={`vs-btn ${variant === v.key ? 'is-on' : ''}`}
                onClick={() => onVariantChange(v.key as NitomanVariant)}
              >
                {v.label}
                <span className="vs-n">
                  {v.key === 'all' ? total : v.key === 'super' ? superCount : stdCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flow-strip" role="list" aria-label="Estat del pipeline">
        {flow.map((s, i) => (
          <div key={s.label} style={{ display: 'contents' }}>
            <div className={`flow-step tone-${s.tone}`} role="listitem">
              <div className="flow-n">{s.n}</div>
              <div className="flow-l">{s.label}</div>
              <div className="flow-h">{s.hint}</div>
            </div>
            {i < flow.length - 1 && (
              <div className="flow-arrow" aria-hidden="true">→</div>
            )}
          </div>
        ))}
        <div className={`flow-aside ${low ? 'tone-alert' : 'tone-mute'}`}>
          <div className="flow-n">{codesAvailable}</div>
          <div className="flow-l">Codis lliures{low ? ' · baix' : ''}</div>
          <div className="flow-h">Pool disponible</div>
        </div>
      </div>

      {low && (
        <div className="alert">
          <span className="alert-bullet">⚠</span>
          <span>
            <strong>Pool de codis baix</strong> — quedaran insuficients per cobrir les
            acreditacions pendents.{' '}
            <Link to={`/${type}/codes`} className="link">Afegir codis</Link>
          </span>
        </div>
      )}
    </section>
  );
}

export default function TypeDashboard() {
  const { type } = useParams<{ type: AccreditationType }>();
  const [variant, setVariant] = useState<NitomanVariant>('all');

  const { data: accreditations = [], isLoading } = useQuery({
    queryKey: ['accreditations', type],
    queryFn: () => fetchAccreditations(type),
    refetchInterval: 30000,
    enabled: !!type,
  });

  const { data: codesData } = useQuery({
    queryKey: ['codes', type, 'available'],
    queryFn: () => fetchAvailableCodes(type!),
    enabled: !!type,
  });

  if (!type) return null;

  const codesAvailable = codesData?.count ?? 0;

  return (
    <div>
      <StatsHero
        type={type}
        rows={accreditations}
        codesAvailable={codesAvailable}
        variant={variant}
        onVariantChange={setVariant}
      />

      <AccreditationList
        accreditations={accreditations}
        isLoading={isLoading}
        type={type}
        variant={variant}
      />
    </div>
  );
}
