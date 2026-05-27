import { NavLink, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { AccreditationType } from '../../types';

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

// Sub-pages per type. Casals only has one page.
const TYPE_CHILDREN: Record<AccreditationType, [string, string, string][]> = {
  premsa:       [['list', 'Acreditacions', '/premsa'], ['codes', 'Codis', '/premsa/codes'], ['templates', 'Plantilles', '/premsa/templates'], ['settings', 'Configuració', '/premsa/settings']],
  professional: [['list', 'Acreditacions', '/professional'], ['codes', 'Codis', '/professional/codes'], ['templates', 'Plantilles', '/professional/templates'], ['settings', 'Configuració', '/professional/settings']],
  nitoman:      [['list', 'Acreditacions', '/nitoman'], ['codes', 'Codis', '/nitoman/codes'], ['templates', 'Plantilles', '/nitoman/templates'], ['settings', 'Configuració', '/nitoman/settings']],
  casals:       [['inscripcions', 'Inscripcions', '/admin/casals']],
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, accessibleTypes } = useAuth();
  const { type: currentType } = useParams<{ type: AccreditationType }>();
  const location = useLocation();

  const isAdmin = user?.is_admin;
  const isSingle = accessibleTypes.length === 1;

  // Casals route is /admin/casals, not /:type, so detect it via location
  function isTypeActive(type: AccreditationType) {
    if (type === 'casals') return location.pathname.startsWith('/admin/casals');
    return currentType === type;
  }

  const nav = (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      {/* Close button — mobile only */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Tancar menú">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Brand */}
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <img src="/LogoNits-positiu.png" alt="Logo Nits" width="38" height="38" style={{ objectFit: 'contain' }} />
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
            const children = TYPE_CHILDREN[type];
            const isActive = isTypeActive(type);
            // For casals, the NavLink "to" is /admin/casals; for others /:type
            const rootPath = type === 'casals' ? '/admin/casals' : `/${type}`;

            return (
              <div key={type}>
                <NavLink
                  to={rootPath}
                  className={`nav-type ${isActive ? 'is-active' : ''}`}
                  onClick={onClose}
                  end={type === 'casals'}
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
                    {children.map(([key, label, path]) => (
                      <NavLink
                        key={key}
                        to={path}
                        end
                        className={({ isActive: a }) =>
                          `nav-child ${a ? 'is-active' : ''}`
                        }
                        onClick={onClose}
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
              onClick={onClose}
            >
              Usuaris
            </NavLink>
            <NavLink
              to="/admin/activity"
              className={({ isActive }) => `nav-child ${isActive ? 'is-active' : ''}`}
              onClick={onClose}
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

  return (
    <>
      {nav}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}
    </>
  );
}
