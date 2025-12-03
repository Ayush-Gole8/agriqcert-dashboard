import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginAsRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<UserRole, User> = {
  farmer: {
    id: 'farmer-001',
    email: 'farmer@agriqcert.com',
    name: 'Maria Santos',
    role: 'farmer',
    organization: 'Santos Organic Farm',
    createdAt: '2024-01-15T08:00:00Z',
  },
  qa_inspector: {
    id: 'inspector-001',
    email: 'inspector@agriqcert.com',
    name: 'Carlos Rodriguez',
    role: 'qa_inspector',
    organization: 'CertQA Services',
    createdAt: '2024-02-01T09:00:00Z',
  },
  certifier: {
    id: 'certifier-001',
    email: 'certifier@agriqcert.com',
    name: 'Ana Martinez',
    role: 'certifier',
    organization: 'AgriCert Authority',
    createdAt: '2024-01-01T08:00:00Z',
  },
  admin: {
    id: 'admin-001',
    email: 'admin@agriqcert.com',
    name: 'System Admin',
    role: 'admin',
    organization: 'AgriQCert',
    createdAt: '2023-12-01T08:00:00Z',
  },
  verifier: {
    id: 'verifier-001',
    email: 'verifier@agriqcert.com',
    name: 'External Verifier',
    role: 'verifier',
    createdAt: '2024-03-01T08:00:00Z',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('agriqcert_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('agriqcert_user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // Mock login - find user by email or default to farmer
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = Object.values(mockUsers).find(u => u.email === email) || mockUsers.farmer;
    
    localStorage.setItem('agriqcert_user', JSON.stringify(user));
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const loginAsRole = useCallback(async (role: UserRole) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUsers[role];
    localStorage.setItem('agriqcert_user', JSON.stringify(user));
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('agriqcert_user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const signup = useCallback(async (email: string, _password: string, name: string, role: UserRole) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: `${role}-${Date.now()}`,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem('agriqcert_user', JSON.stringify(newUser));
    setAuthState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, loginAsRole, logout, signup }}>
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
