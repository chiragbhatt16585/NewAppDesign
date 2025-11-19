import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import dataCache from '../services/dataCache';
import { pinStorage } from '../services/pinStorage';
import biometricAuthService from '../services/biometricAuth';
import menuService from '../services/menuService';
import realmAuthService from '../services/realmAuthService';
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
      
      console.log('[AuthContext] Starting login process for:', username);
      
      // Check if this is a different user logging in
      const previousUsername = await AsyncStorage.getItem('last_logged_in_username');
      const isDifferentUser = previousUsername && previousUsername !== username;
      
      if (isDifferentUser) {
        console.log('[AuthContext] Different user detected! Previous:', previousUsername, 'New:', username);
        console.log('[AuthContext] Performing full cache clear for user switch...');
      }
      
      // Clear all cached data before login to ensure fresh data for new user
      await dataCache.clearAllCache();
      menuService.clearCache();
      
      // Always clear Realm data on login to ensure fresh start
      try {
        await realmAuthService.logout();
        console.log('[AuthContext] Realm data cleared before login');
      } catch (realmError) {
        console.warn('[AuthContext] Error clearing Realm data:', realmError);
      }
      
      // If different user, perform additional cleanup
      if (isDifferentUser) {
        console.log('[AuthContext] Different user detected - performing additional cleanup');
        // Clear any remaining AsyncStorage items
        await AsyncStorage.multiRemove([
          'userData',
          'plansData',
          'authData',
          'navigationState',
        ]);
      }
      
      console.log('[AuthContext] Caches cleared before login');
      
      // Get current client from storage
      const clientName = await AsyncStorage.getItem('current_client') || 'dna-infotel';
      console.log('Using client for login:', clientName);
      
      const response = await apiService.authenticate(username, password);
      
      if (response && response.token) {
        await sessionManager.createSession(username, response.token, password, clientName);
        
        // Store current username for next login comparison
        await AsyncStorage.setItem('last_logged_in_username', username);
        
        setIsAuthenticated(true);
        setUserData({
          username,
          token: response.token,
        });
        console.log('[AuthContext] Login successful, session created');
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
      
      console.log('[AuthContext] Starting OTP login process for:', phoneNumber);
      
      // Check if this is a different user logging in
      const previousUsername = await AsyncStorage.getItem('last_logged_in_username');
      const isDifferentUser = previousUsername && previousUsername !== phoneNumber;
      
      if (isDifferentUser) {
        console.log('[AuthContext] Different user detected! Previous:', previousUsername, 'New:', phoneNumber);
        console.log('[AuthContext] Performing full cache clear for user switch...');
      }
      
      // Clear all cached data before login to ensure fresh data for new user
      await dataCache.clearAllCache();
      menuService.clearCache();
      
      // Always clear Realm data on login to ensure fresh start
      try {
        await realmAuthService.logout();
        console.log('[AuthContext] Realm data cleared before OTP login');
      } catch (realmError) {
        console.warn('[AuthContext] Error clearing Realm data:', realmError);
      }
      
      // If different user, perform additional cleanup
      if (isDifferentUser) {
        console.log('[AuthContext] Different user detected - performing additional cleanup');
        // Clear any remaining AsyncStorage items
        await AsyncStorage.multiRemove([
          'userData',
          'plansData',
          'authData',
          'navigationState',
        ]);
      }
      
      console.log('[AuthContext] Caches cleared before OTP login');
      
      // Get current client from storage
      const clientName = await AsyncStorage.getItem('current_client') || 'dna-infotel';
      console.log('Using client for OTP login:', clientName);
      
      const response = await apiService.authenticate('', '', otp, 'none', phoneNumber);
      
      if (response && response.token) {
        await sessionManager.createSession(phoneNumber, response.token, undefined, clientName);
        
        // Store current username for next login comparison
        await AsyncStorage.setItem('last_logged_in_username', phoneNumber);
        
        setIsAuthenticated(true);
        setUserData({
          username: phoneNumber,
          token: response.token,
        });
        console.log('[AuthContext] OTP login successful, session created');
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
      
      console.log('[AuthContext] Starting logout process...');
      
      // Clear all cached data first
      await dataCache.clearAllCache();
      console.log('[AuthContext] Data cache cleared');
      
      // Clear menu service cache (in-memory cache)
      try {
        menuService.clearCache();
        console.log('[AuthContext] Menu service cache cleared');
      } catch (menuError) {
        console.warn('[AuthContext] Error clearing menu cache:', menuError);
      }
      
      // Clear Realm data if available
      try {
        await realmAuthService.logout();
        console.log('[AuthContext] Realm data cleared');
      } catch (realmError) {
        console.warn('[AuthContext] Error clearing Realm data:', realmError);
      }
      
      // Clear any other stored data
      await AsyncStorage.multiRemove([
        'userData',
        'plansData', 
        'authData',
        'navigationState',
        'showBiometricAfterLogin',
        'domainName',
        'user_pin',
        'biometricAuthConfig',
        'last_logged_in_username' // Clear username tracking
      ]);
      console.log('[AuthContext] AsyncStorage cleared');
      
      // Clear PIN storage
      await pinStorage.clearPin();
      console.log('[AuthContext] PIN cleared');
      
      // Disable biometric auth
      await biometricAuthService.disableAuth();
      console.log('[AuthContext] Biometric auth disabled');
      
      // Perform API logout
      await apiService.logout();
      console.log('[AuthContext] API logout completed');
      
      // Clear session
      await sessionManager.logout();
      console.log('[AuthContext] Session cleared');
      
      // Reset auth state
      setIsAuthenticated(false);
      setUserData(null);
      console.log('[AuthContext] Auth state reset');
      
      // Session monitoring disabled for persistent login
      // sessionMonitor.stopMonitoring();
      
      console.log('[AuthContext] Logout process completed successfully');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Even if API logout fails, clear all local data
      try {
        await dataCache.clearAllCache();
        
        // Clear menu service cache
        try {
          menuService.clearCache();
        } catch (menuError) {
          console.warn('[AuthContext] Error clearing menu cache in error handler:', menuError);
        }
        
        // Clear Realm data
        try {
          await realmAuthService.logout();
        } catch (realmError) {
          console.warn('[AuthContext] Error clearing Realm data in error handler:', realmError);
        }
        
        await AsyncStorage.multiRemove([
          'userData',
          'plansData', 
          'authData',
          'navigationState',
          'showBiometricAfterLogin',
          'domainName',
          'user_pin',
          'biometricAuthConfig',
          'last_logged_in_username' // Clear username tracking
        ]);
        
        // Clear PIN storage
        await pinStorage.clearPin();
        
        // Disable biometric auth
        await biometricAuthService.disableAuth();
        await sessionManager.logout();
        setIsAuthenticated(false);
        setUserData(null);
        console.log('[AuthContext] Fallback logout cleanup completed');
      } catch (cleanupError) {
        console.error('[AuthContext] Error during fallback cleanup:', cleanupError);
      }
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