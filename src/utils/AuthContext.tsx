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
      console.log('=== CHECKING AUTH STATUS ===');
      
      // First check if user is logged in
      const isLoggedIn = await sessionManager.isLoggedIn();
      console.log('Is logged in:', isLoggedIn);
      
      if (isLoggedIn) {
        const session = await sessionManager.getCurrentSession();
        if (session) {
          console.log('Valid session found:', session.username);
          
          // Check if session needs auto refresh (after long periods of inactivity)
          const shouldRefresh = await sessionManager.shouldAutoRefresh();
          if (shouldRefresh) {
            console.log('Session needs auto refresh, refreshing...');
            const refreshResult = await sessionManager.autoRefreshSession();
            
            if (refreshResult.success) {
              console.log('✅ Session auto-refreshed successfully:', refreshResult.message);
              // Get updated session after refresh
              const updatedSession = await sessionManager.getCurrentSession();
              if (updatedSession) {
                setIsAuthenticated(true);
                setUserData({
                  username: updatedSession.username,
                  token: updatedSession.token,
                });
                setLoading(false);
                return;
              }
            } else {
              console.log('❌ Session auto-refresh failed:', refreshResult.message);
              // Continue with existing session if refresh failed
            }
          }
          
          // Use existing session
          setIsAuthenticated(true);
          setUserData({
            username: session.username,
            token: session.token,
          });
          setLoading(false);
          return;
        }
      }
      
      // Only diagnose session issues if user is not logged in
      console.log('User not logged in, checking for session issues...');
      const sessionDiagnosis = await sessionManager.diagnoseAndFixSession();
      
      if (sessionDiagnosis.needsReset) {
        console.log('Session issues detected during auth check:', sessionDiagnosis.issues);
        console.log('Resetting session...');
        
        // Reset the session
        await sessionManager.resetSession();
      }
      
      // Set as not authenticated
      setIsAuthenticated(false);
      setUserData(null);
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, assume not authenticated
      setIsAuthenticated(false);
      setUserData(null);
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