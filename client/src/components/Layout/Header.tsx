import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  const initial = user?.username?.charAt(0).toUpperCase() ?? 'U';
  const role = user?.is_admin ? 'Admin' : 'Operador';

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Hamburger — mobile only */}
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Obrir menú">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="breadcrumb">
          <span className="crumb-muted">Festival Nits de Cinema Oriental</span>
          <span className="crumb-sep">/</span>
          <span>Sistema d'Acreditacions</span>
        </div>
      </div>

      <div className="topbar-right">
        <button className="ghost-btn topbar-search-btn" title="Cerca global (⌘K)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7"/>
            <path d="m20 20-3-3"/>
          </svg>
          <span className="search-label">Cerca</span>
          <kbd className="search-kbd">⌘K</kbd>
        </button>

        <button className="ghost-btn icon-only" title="Notificacions">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10 21a2 2 0 0 0 4 0"/>
          </svg>
          {user?.notifications_enabled && <span className="dot-badge" />}
        </button>

        <div className="user-chip" ref={menuRef}>
          <button className="user-chip-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="user-ava">{initial}</div>
            <div className="user-meta topbar-user-meta">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{role}</div>
            </div>
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-item" style={{ cursor: 'default', color: 'var(--ink-50)', fontSize: '12px' }}>
                {user?.email}
              </div>
              <div className="user-dropdown-sep" />
              <button className="user-dropdown-item danger" onClick={handleLogout}>
                Tancar sessió
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
