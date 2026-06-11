import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  guestLogin: () => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('skyscript_token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const res = await authApi.getProfile();
      const userData = res.data;
      setUser(userData);
    } catch (err) {
      localStorage.removeItem('skyscript_token');
      setUser(null);
    }
  };

  const login = async (credentials: any) => {
    const res = await authApi.login(credentials);
    localStorage.setItem('skyscript_token', res.data.token);
    setUser(res.data.user);
  };

  const guestLogin = async () => {
    const res = await authApi.guestLogin();
    localStorage.setItem('skyscript_token', res.data.token);
    setUser(res.data.user);
  };

  const signup = async (data: any) => {
    const res = await authApi.signup(data);
    localStorage.setItem('skyscript_token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('skyscript_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      guestLogin,
      signup, 
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
