import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest, getMeRequest } from '../services/authService';

function normalizeRole(role) {
  if (role === 'Admin') return 'admin';
  if (role === 'StockClerk') return 'clerk';
  return role;
}

const STORAGE_KEY = 'auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    getMeRequest(token)
      .then((me) => {
        if (me) setUser({ ...me, role: normalizeRole(me.role), token });
        else localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token, user: me } = await loginRequest(email, password);
    const normalized = { ...me, role: normalizeRole(me.role), token };
    localStorage.setItem(STORAGE_KEY, token);
    setUser(normalized);
    return normalized;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/login');
  }

  function requireAuth() {
    if (!user) navigate('/login');
  }

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    requireAuth,
    isAuthenticated: !!user,
    role: user?.role || null,
  }), [user, loading]);

  if (loading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { AuthContext };
