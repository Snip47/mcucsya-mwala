import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authAPI, User, getBaseUrl } from '../api';

const ADMIN_ID = '42671263';

interface AuthContextType {
  user:        User | null;
  token:       string | null;
  loading:     boolean;
  login:       (national_id: string, password: string, role: string) => Promise<void>;
  logout:      () => void;
  updatePhoto: (url: string) => void;
  refreshUser: () => Promise<void>;
  isAdmin:     boolean;
  isMP:        boolean;
  isLeader:    boolean;
  isMember:    boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  // Auto-kick if deleted/rejected
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        await axios.get(`${getBaseUrl()}/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        logout();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const login = async (national_id: string, password: string, role: string) => {
    if (role === 'admin' && national_id !== ADMIN_ID) {
      throw { response: { data: { detail: 'You are not authorized to access the admin panel.' } } };
    }
    const res = await authAPI.loginWithRole(national_id, password, role);
    const { access_token, user: u } = res.data;
    setToken(access_token);
    setUser(u);
    localStorage.setItem('token', access_token);
    localStorage.setItem('user',  JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updatePhoto = (url: string) => {
    if (!user) return;
    const updated = { ...user, profile_photo: url };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res    = await axios.get(`${getBaseUrl()}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fresh = res.data;
      setUser(fresh);
      localStorage.setItem('user', JSON.stringify(fresh));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout, updatePhoto, refreshUser,
      isAdmin:  user?.role === 'admin',
      isMP:     user?.role === 'mp',
      isLeader: user?.role === 'leader' || user?.role === 'admin',
      isMember: user?.role === 'member',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);