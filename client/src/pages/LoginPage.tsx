import { useState, FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error d\'autenticació');
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">
            <img src="/LogoNits-positiu.png" alt="FesNits" width="48" height="48" style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div className="login-title">FesNits</div>
            <div className="login-sub">Sistema d'Acreditacions · 23a edició</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">{error}</div>
          )}

          <div className="form-field">
            <label htmlFor="username" className="form-label">Usuari</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="form-input"
              required
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">Contrasenya</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="primary-btn login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Entrant…' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-30)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            14 — 19 Juliol 2026 · Vic
          </span>
        </div>
      </div>
    </div>
  );
}
