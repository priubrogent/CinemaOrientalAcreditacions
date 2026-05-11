import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { AccreditationType } from '../../types';

const TYPE_DEFS: Record<AccreditationType, { label: string; sub: string }> = {
  premsa:       { label: 'Premsa',       sub: 'Mitjans i crítica' },
  professional: { label: 'Professional', sub: 'Indústria audiovisual' },
  nitoman:      { label: 'Nitòman',      sub: 'Abonats al festival' },
};

const TYPE_COLORS: Record<AccreditationType, string> = {
  premsa:       'var(--premsa)',
  professional: 'var(--professional)',
  nitoman:      'var(--nitoman)',
};

export default function Sidebar() {
  const { user, accessibleTypes } = useAuth();
  const { type: currentType } = useParams<{ type: AccreditationType }>();

  const isAdmin = user?.is_admin;
  const isSingle = accessibleTypes.length === 1;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 44 44" width="38" height="38">
            <circle cx="22" cy="22" r="21" fill="currentColor"/>
            <path d="M28 12 a14 14 0 1 0 0 20 a11 11 0 1 1 0 -20 z" fill="var(--paper)"/>
            <circle cx="30" cy="16" r="1.6" fill="var(--paper)"/>
            <circle cx="33" cy="22" r="1.2" fill="var(--paper)"/>
            <circle cx="30" cy="28" r="1.6" fill="var(--paper)"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">FesNits</div>
          <div className="brand-sub">Acreditacions · 23a edició</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-group">
          <div className="nav-heading">
            {isSingle ? 'El teu espai' : 'Els teus espais'}
          </div>

          {accessibleTypes.map((type) => {
            const def = TYPE_DEFS[type];
            const isActive = currentType === type;
            return (
              <div key={type}>
                <NavLink
                  to={`/${type}`}
                  className={`nav-type ${isActive ? 'is-active' : ''}`}
                >
                  <span className="nav-type-label">
                    <span
                      className="nav-marker"
                      style={{ background: TYPE_COLORS[type] }}
                    />
                    {def.label}
                  </span>
                  <span className="nav-sub">{def.sub}</span>
                </NavLink>

                {isActive && (
                  <div className="nav-children">
                    {([
                      ['list', 'Acreditacions', `/${type}`],
                      ['codes', 'Codis', `/${type}/codes`],
                      ['templates', 'Plantilles', `/${type}/templates`],
                      ['settings', 'Configuració', `/${type}/settings`],
                    ] as [string, string, string][]).map(([key, label, path]) => (
                      <NavLink
                        key={key}
                        to={path}
                        end={key === 'list'}
                        className={({ isActive: a }) =>
                          `nav-child ${a ? 'is-active' : ''}`
                        }
                      >
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <div className="nav-group">
            <div className="nav-heading">Administració</div>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-child ${isActive ? 'is-active' : ''}`}
            >
              Usuaris
            </NavLink>
            <NavLink
              to="/admin/activity"
              className={({ isActive }) => `nav-child ${isActive ? 'is-active' : ''}`}
            >
              Activitat global
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-foot">
        <div className="festival-dates">
          <div className="dates-num">14 — 19</div>
          <div className="dates-meta">Juliol 2026 · Vic</div>
        </div>
      </div>
    </aside>
  );
}
