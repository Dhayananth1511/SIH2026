import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from './types';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchRole: (role: 'officer' | 'institution' | 'admin') => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/officer')) {
        const saved = localStorage.getItem('user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.role === 'officer' || parsed.role?.includes('officer')) return parsed;
          } catch {}
        }
        const officerUser: User = {
          id: 10,
          email: 'arun@gov.in',
          full_name: 'Arun (AICTE Scrutiny Officer)',
          role: 'officer',
          is_active: true,
          created_at: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(officerUser));
        localStorage.setItem('token', 'demo-officer-session-token');
        return officerUser;
      }

      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/officer')) {
      const savedTok = localStorage.getItem('token');
      if (savedTok) return savedTok;
      const demoTok = 'demo-officer-session-token';
      localStorage.setItem('token', demoTok);
      return demoTok;
    }
    const savedTok = localStorage.getItem('token');
    return savedTok || null;
  });

  const login = (tok: string, u: User) => {
    setToken(tok);
    setUser(u);
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const switchRole = (newRole: 'officer' | 'institution' | 'admin') => {
    let u: User;
    if (newRole === 'officer') {
      u = {
        id: 10,
        email: 'arun@gov.in',
        full_name: 'Dr. Arun Sharma (AICTE Scrutiny Officer)',
        role: 'officer',
        is_active: true,
        created_at: new Date().toISOString()
      };
      login('officer-session-token', u);
    } else if (newRole === 'admin') {
      u = {
        id: 9,
        email: 'admin@gov.in',
        full_name: 'System Administrator',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      };
      login('admin-session-token', u);
    } else {
      u = {
        id: 12,
        email: 'arun@college.edu.in',
        full_name: 'ABC Institute of Technology (Principal)',
        role: 'institution',
        is_active: true,
        created_at: new Date().toISOString()
      };
      login('institution-session-token', u);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
