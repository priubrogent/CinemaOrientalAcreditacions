import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AccreditationType } from '../types';
import { login as apiLogin, logout as apiLogout, getCurrentUser, toggleNotifications as apiToggleNotifications } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  hasTypeAccess: (type: AccreditationType) => boolean;
  accessibleTypes: AccreditationType[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const loggedInUser = await apiLogin({ username, password });
    setUser(loggedInUser);
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  async function toggleNotifications(enabled: boolean) {
    const newValue = await apiToggleNotifications(enabled);
    if (user) {
      setUser({ ...user, notifications_enabled: newValue });
    }
  }

  function hasTypeAccess(type: AccreditationType): boolean {
    if (!user) return false;
    if (user.is_admin) return true;
    return user.types.includes(type);
  }

  const accessibleTypes: AccreditationType[] = user
    ? user.is_admin
      ? ['premsa', 'professional', 'nitoman', 'casals']
      : user.types
    : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        toggleNotifications,
        hasTypeAccess,
        accessibleTypes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
