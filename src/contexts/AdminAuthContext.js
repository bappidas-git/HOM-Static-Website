import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('authToken');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('adminUser');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, remember = false) => {
    const response = await adminService.login(email, password);
    const { token } = response;

    // Verify password against the simulated backend
    const users = await adminService.getAll({ email });
    const matchedUser = users.find(u => u.email === email && u.password === password);

    if (!matchedUser) {
      throw new Error('Invalid email or password');
    }

    const safeUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      avatar: matchedUser.avatar,
    };

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('authToken', token);
    storage.setItem('adminUser', JSON.stringify(safeUser));

    // Also keep in localStorage for the interceptor
    localStorage.setItem('authToken', token);
    localStorage.setItem('adminUser', JSON.stringify(safeUser));

    setUser(safeUser);
    return safeUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('adminUser');
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
