import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kflix_token');
    if (token) {
      authAPI.getMe()
        .then(u => setUser(u))
        .catch(() => _clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authAPI.login(credentials);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (credentials) => {
    const u = await authAPI.signup(credentials);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    _clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isAdmin: user?.role === 'admin',
      loading,
      login,
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function _clear() {
  ['kflix_token','kflix_role','kflix_logged_in','kflix_username'].forEach(k => localStorage.removeItem(k));
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
