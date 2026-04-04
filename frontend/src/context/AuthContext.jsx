import { createContext, useEffect, useMemo, useState } from 'react';
import { meApi } from '../actionsAPI/auth.api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    meApi()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('bc_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ user, setUser, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
