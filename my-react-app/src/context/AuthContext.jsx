import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_USERS = [
  { id: 1, name: 'Alice Admin', email: 'admin@example.com', password: 'admin123', role: 'admin', isActive: true },
  { id: 2, name: 'Charlie Clerk', email: 'clerk@example.com', password: 'clerk123', role: 'clerk', isActive: true },
];

const STORAGE_KEY = 'auth_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  function login(email, password) {
    const match = MOCK_USERS.find(
      (u) => u.email === email && u.password === password && u.isActive
    );
    if (!match) {
      throw new Error('Invalid credentials');
    }
    const { password: _, ...safeUser } = match;
    setUser(safeUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    return safeUser;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/login');
  }

  function requireAuth() {
    if (!user) {
      navigate('/login');
    }
  }

  const value = useMemo(() => ({
    user,
    login,
    logout,
    requireAuth,
    isAuthenticated: !!user,
    role: user?.role || null,
  }), [user]);

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
