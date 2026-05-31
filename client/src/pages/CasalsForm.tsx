import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitCasalInscription } from '../api/casals';

const DATES = [
  { value: 'Dimarts 19/07', label: 'Dimarts 19 de juliol' },
  { value: 'Dimecres 20/07', label: 'Dimecres 20 de juliol' },
  { value: 'Dijous 21/07', label: 'Dijous 21 de juliol' },
  { value: 'Divendres 22/07', label: 'Divendres 22 de juliol' },
];

export default function CasalsForm() {
  const [nomCasal, setNomCasal] = useState('');
  const [date, setDate] = useState('');
  const [nombreNens, setNombreNens] = useState('');
  const [nombreMonitors, setNombreMonitors] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [comentaris, setComentaris] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: submitCasalInscription,
  });

  function validate() {
    const errs: Record<string, string> = {};
    if (!nomCasal.trim()) errs.nomCasal = 'Camp obligatori';
    if (!date) errs.dates = 'Selecciona una data';
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
      dates: [date],
      nombre_nens: parseInt(nombreNens),
      nombre_monitors: parseInt(nombreMonitors),
      email: email.trim(),
      telefon: telefon.trim(),
      comentaris: comentaris.trim() || undefined,
    });
  }

  if (mutation.isSuccess) {
    return (
      <div className="casals-page">
        <div className="casals-card">
          <div className="casals-success">
            <div className="casals-success-icon" aria-hidden="true">✓</div>
            <h2>Inscripció enviada!</h2>
            <p>Hem rebut la inscripció del casal <strong>{nomCasal}</strong>.</p>
            <p>Ens posarem en contacte amb vosaltres aviat per confirmar els detalls.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="casals-page">
      <div className="casals-card">
        <div className="casals-header">
          <img src="/LogoNits-positiu.png" alt="FesNits" className="casals-logo" />
          <h1 className="casals-title">Inscripció de Casals</h1>
          <p className="casals-subtitle">FesNits 2026 · Festival de Cinema Oriental</p>
        </div>

        {mutation.isError && (
          <div className="casals-error-banner" role="alert">
            {(mutation.error as Error).message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="casals-form">
          <div className="casals-field">
            <label className="casals-label" htmlFor="nom_casal">
              Nom del casal <span className="casals-required" aria-hidden="true">*</span>
            </label>
            <input
              id="nom_casal"
              type="text"
              className={`casals-input${errors.nomCasal ? ' is-invalid' : ''}`}
              value={nomCasal}
              onChange={e => setNomCasal(e.target.value)}
              placeholder="Nom del casal d'estiu"
            />
            {errors.nomCasal && <span className="casals-field-error">{errors.nomCasal}</span>}
          </div>

          <div className="casals-field">
            <span className="casals-label">
              Data disponible <span className="casals-required" aria-hidden="true">*</span>
            </span>
            <div className={`casals-checkgroup${errors.dates ? ' is-invalid' : ''}`}>
              {DATES.map(({ value, label }) => (
                <label key={value} className="casals-check-label">
                  <input
                    type="radio"
                    name="date"
                    className="casals-checkbox"
                    checked={date === value}
                    onChange={() => setDate(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {errors.dates && <span className="casals-field-error">{errors.dates}</span>}
          </div>

          <div className="casals-row">
            <div className="casals-field">
              <label className="casals-label" htmlFor="nombre_nens">
                Nombre de nens <span className="casals-required" aria-hidden="true">*</span>
              </label>
              <input
                id="nombre_nens"
                type="number"
                min="1"
                className={`casals-input${errors.nombreNens ? ' is-invalid' : ''}`}
                value={nombreNens}
                onChange={e => setNombreNens(e.target.value)}
                placeholder="0"
              />
              {errors.nombreNens && <span className="casals-field-error">{errors.nombreNens}</span>}
            </div>

            <div className="casals-field">
              <label className="casals-label" htmlFor="nombre_monitors">
                Nombre de monitors <span className="casals-required" aria-hidden="true">*</span>
              </label>
              <input
                id="nombre_monitors"
                type="number"
                min="1"
                className={`casals-input${errors.nombreMonitors ? ' is-invalid' : ''}`}
                value={nombreMonitors}
                onChange={e => setNombreMonitors(e.target.value)}
                placeholder="0"
              />
              {errors.nombreMonitors && <span className="casals-field-error">{errors.nombreMonitors}</span>}
            </div>
          </div>

          <div className="casals-field">
            <label className="casals-label" htmlFor="email">
              Email de contacte <span className="casals-required" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`casals-input${errors.email ? ' is-invalid' : ''}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contacte@casal.cat"
            />
            {errors.email && <span className="casals-field-error">{errors.email}</span>}
          </div>

          <div className="casals-field">
            <label className="casals-label" htmlFor="telefon">
              Número de contacte <span className="casals-required" aria-hidden="true">*</span>
            </label>
            <input
              id="telefon"
              type="tel"
              className={`casals-input${errors.telefon ? ' is-invalid' : ''}`}
              value={telefon}
              onChange={e => setTelefon(e.target.value)}
              placeholder="6XX XXX XXX"
            />
            {errors.telefon && <span className="casals-field-error">{errors.telefon}</span>}
          </div>

          <div className="casals-field">
            <label className="casals-label" htmlFor="comentaris">
              Comentaris
            </label>
            <textarea
              id="comentaris"
              className="casals-textarea"
              value={comentaris}
              onChange={e => setComentaris(e.target.value)}
              placeholder="Informació addicional, necessitats especials…"
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="casals-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Enviant…' : 'Enviar inscripció'}
          </button>
        </form>
      </div>
    </div>
  );
}
