'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { type UserSession, isRouteAllowed } from '@/lib/permissions';

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  canAccess: (route: string) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  canAccess: () => false,
  refresh: async () => {},
});

function PathnameWatcher({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  React.useEffect(() => {
    onChange();
  }, [pathname, onChange]);
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchUser = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const canAccess = React.useCallback(
    (route: string) => {
      if (!user) return false;
      return isRouteAllowed(route, user.rol);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, canAccess, refresh: fetchUser }}>
      <React.Suspense fallback={null}>
        <PathnameWatcher onChange={fetchUser} />
      </React.Suspense>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
