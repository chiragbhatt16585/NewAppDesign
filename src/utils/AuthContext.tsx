import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
// Session monitoring disabled for persistent login
// import sessionMonitor from '../services/sessionMonitor';

interface AuthContextType {
  isAuthenticated: boolean;
  userData: any | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithOtp: (phoneNumber: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('AuthContext is undefined - useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isLoggedIn = await sessionManager.isLoggedIn();
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn) {
        const session = await sessionManager.getCurrentSession();
        if (session) {
          setUserData({
            username: session.username,
            token: session.token,
          });
          // Session monitoring disabled for persistent login
          // sessionMonitor.startMonitoring();
        }
      } else {
        // Session monitoring disabled for persistent login
        // sessionMonitor.stopMonitoring();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.authenticate(username, password);
      
      if (response && response.token) {
        await sessionManager.createSession(username, response.token, password);
        setIsAuthenticated(true);
        setUserData({
          username,
          token: response.token,
        });
        // Session monitoring disabled for persistent login
        // sessionMonitor.startMonitoring();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOtp = async (phoneNumber: string, otp: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.authenticate('', '', otp, 'none', phoneNumber);
      
      if (response && response.token) {
        await sessionManager.createSession(phoneNumber, response.token);
        setIsAuthenticated(true);
        setUserData({
          username: phoneNumber,
          token: response.token,
        });
        // Session monitoring disabled for persistent login
        // sessionMonitor.startMonitoring();
        return true;
      }
      return false;
    } catch (error) {
      console.error('OTP login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiService.logout();
      await sessionManager.logout();
      setIsAuthenticated(false);
      setUserData(null);
      // Session monitoring disabled for persistent login
      // sessionMonitor.stopMonitoring();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API logout fails, clear local session
      await sessionManager.logout();
      setIsAuthenticated(false);
      setUserData(null);
      // sessionMonitor.stopMonitoring();
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    userData,
    login,
    loginWithOtp,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 