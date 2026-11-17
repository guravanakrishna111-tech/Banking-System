import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initial Auth Check
  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const profileRes = await api.get('/accounts/auth/profile/');
      setUser(profileRes.data);
      const isAdm = profileRes.data.role === 'ADMIN';
      setIsAdmin(isAdm);
      localStorage.setItem('isAdmin', isAdm ? 'true' : 'false');

      if (!isAdm) {
        await refreshAccounts();
        await refreshNotifications();
      }
    } catch (err) {
      console.error('Failed to fetch user data on mount:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = async () => {
    try {
      const res = await api.get('/accounts/my-accounts/');
      const accList = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setAccounts(accList);
      if (accList.length > 0) {
        // Keep current or select the first active account
        setCurrentAccount((prev) => {
          if (prev && accList.some((a) => a.id === prev.id)) {
            return accList.find((a) => a.id === prev.id);
          }
          return accList[0];
        });
      }
    } catch (err) {
      console.error('Failed to refresh accounts:', err);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/accounts/auth/profile/');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await api.get('/accounts/notifications/');
      const notifs = res.data.results || res.data;
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await api.patch(`/accounts/notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.post('/accounts/notifications/mark-all-read/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const login = async (usernameOrEmail, password) => {
    const res = await api.post('/accounts/auth/login/', {
      username_or_email: usernameOrEmail,
      password: password,
    });
    const { token: userToken, user: userData, is_admin } = res.data;
    localStorage.setItem('token', userToken);
    localStorage.setItem('isAdmin', is_admin ? 'true' : 'false');
    setToken(userToken);
    setUser(userData);
    setIsAdmin(is_admin);
    return res.data;
  };

  const adminLogin = async (usernameOrEmail, password) => {
    const res = await api.post('/accounts/auth/admin-login/', {
      username_or_email: usernameOrEmail,
      password: password,
    });
    const { token: adminToken, user: userData } = res.data;
    localStorage.setItem('token', adminToken);
    localStorage.setItem('isAdmin', 'true');
    setToken(adminToken);
    setUser(userData);
    setIsAdmin(true);
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/accounts/auth/register/', userData);
    const { token: userToken, user: newUser } = res.data;
    localStorage.setItem('token', userToken);
    localStorage.setItem('isAdmin', 'false');
    setToken(userToken);
    setUser(newUser);
    setIsAdmin(false);
    return res.data;
  };

  const logout = () => {
    api.post('/accounts/auth/logout/').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    setAccounts([]);
    setCurrentAccount(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        loading,
        accounts,
        currentAccount,
        setCurrentAccount,
        notifications,
        unreadCount,
        login,
        adminLogin,
        register,
        logout,
        refreshAccounts,
        refreshProfile,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
