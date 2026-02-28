import { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { AccreditationType } from '../../types';

const TYPE_DISPLAY_NAMES: Record<AccreditationType, string> = {
  premsa: 'Premsa',
  professional: 'Professional',
  nitoman: 'Nitoman',
};

interface NavItemProps {
  to: string;
  children: React.ReactNode;
  end?: boolean;
}

function NavItem({ to, children, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-4 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

interface TypeSectionProps {
  type: AccreditationType;
  isExpanded: boolean;
  onToggle: () => void;
}

function TypeSection({ type, isExpanded, onToggle }: TypeSectionProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isExpanded) {
      // Navigate to the type's main page when expanding
      navigate(`/${type}`);
    }
    onToggle();
  };

  return (
    <div className="mb-2">
      <button
        onClick={handleClick}
        className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm font-semibold rounded-md transition-colors ${
          isExpanded
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>{TYPE_DISPLAY_NAMES[type]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="ml-2 mt-1 space-y-1">
          <NavItem to={`/${type}`} end>
            Acreditacions
          </NavItem>
          <NavItem to={`/${type}/codes`}>Codis</NavItem>
          <NavItem to={`/${type}/templates`}>Plantilles</NavItem>
          <NavItem to={`/${type}/settings`}>Configuració</NavItem>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { user, accessibleTypes } = useAuth();
  const { type: currentType } = useParams<{ type: AccreditationType }>();
  const [expandedType, setExpandedType] = useState<AccreditationType | null>(null);

  // Update expanded type when URL changes
  useEffect(() => {
    if (currentType && accessibleTypes.includes(currentType)) {
      setExpandedType(currentType);
    }
  }, [currentType, accessibleTypes]);

  const handleToggle = (type: AccreditationType) => {
    setExpandedType(expandedType === type ? null : type);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">ASFF</h1>
        <p className="text-xs text-gray-500">Sistema d'Acreditacions</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {accessibleTypes.map((type) => (
            <TypeSection
              key={type}
              type={type}
              isExpanded={expandedType === type}
              onToggle={() => handleToggle(type)}
            />
          ))}
        </div>

        {user?.is_admin && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Administració
            </p>
            <NavItem to="/admin/users">Usuaris</NavItem>
          </div>
        )}
      </nav>
    </aside>
  );
}
