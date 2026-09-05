import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import dataCache from '../services/dataCache';
import { pinStorage } from '../services/pinStorage';
import biometricAuthService from '../services/biometricAuth';
import menuService from '../services/menuService';
import realmAuthService from '../services/realmAuthService';
import { ensureDeviceRegistrationAfterLogin } from '../services/notificationService';
import {
  registerCleverTapUserOnLogin,
  syncCleverTapWithAuthUser,
} from '../services/cleverTapService';

/** Identify the current session user in CleverTap (login + already-logged-in app updates). */
const identifyCleverTapSessionUser = (username?: string | null): void => {
  if (!username) {
    return;
  }
  registerCleverTapUserOnLogin(username);
  void apiService
    .authUser(username)
    .then(authUserData => {
      syncCleverTapWithAuthUser(username, authUserData as Record<string, unknown>);
    })
    .catch(authUserError => {
      console.warn(
        '[AuthContext] authUser fetch failed for CleverTap identity sync:',
        authUserError,
      );
    });
};
import { getClientConfig } from '../config/client-config';
// Session monitoring disabled for persistent login
// import sessionMonitor from '../services/sessionMonitor';

interface AuthContextType {
  isAuthenticated: boolean;
  userData: any | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{success: boolean; error?: string; consentRequired?: boolean}>;
  loginWithOtp: (
    phoneNumber: string,
    otp: string,
  ) => Promise<{success: boolean; error?: string; consentRequired?: boolean}>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // In production, return a default auth instead of throwing
    if (__DEV__) {
      console.error('AuthContext is undefined - useAuth must be used within an AuthProvider');
      throw new Error('useAuth must be used within an AuthProvider');
    }
    // Fallback auth for production
    return {
      isAuthenticated: false,
      userData: null,
      login: async () => false,
      loginWithOtp: async () => false,
      logout: async () => {},
      loading: false,
    };
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

          // Always try to refresh/regenerate token on app start
          const refreshResult = await sessionManager.autoRefreshSession();
          if (refreshResult.success) {
            console.log('✅ Session auto-refreshed on startup:', refreshResult.message);
          } else {
            console.log('⚠️ Session auto-refresh on startup did not renew token:', refreshResult.message);
          }

          const updatedSession = await sessionManager.getCurrentSession();
          if (updatedSession) {
            setIsAuthenticated(true);
            setUserData({
              username: updatedSession.username,
              token: updatedSession.token,
            });
            identifyCleverTapSessionUser(updatedSession.username);
            setLoading(false);
            return;
          }
        }
      }

      // Only diagnose session issues if user is not logged in
      console.log('User not logged in, checking for session issues...');
      const sessionDiagnosis = await sessionManager.diagnoseAndFixSession();

      if (sessionDiagnosis.needsReset) {
        console.log('Session issues detected during auth check:', sessionDiagnosis.issues);
        await sessionManager.resetSession();
      } else if (sessionDiagnosis.issues.length > 0) {
        const recovered = await sessionManager.autoRefreshSession();
        if (recovered.success) {
          const recoveredSession = await sessionManager.getCurrentSession();
          if (recoveredSession?.username) {
            setIsAuthenticated(true);
            setUserData({
              username: recoveredSession.username,
              token: recoveredSession.token,
            });
            identifyCleverTapSessionUser(recoveredSession.username);
            setLoading(false);
            return;
          }
        }
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

  const login = async (
    username: string,
    password: string,
  ): Promise<{success: boolean; error?: string; consentRequired?: boolean}> => {
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
      
      // CRITICAL: Clear all cached data BEFORE login to ensure fresh data for new user
      // This must happen synchronously to prevent old data from being displayed
      console.log('[AuthContext] Clearing all caches before login...');
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
        console.log('[AuthContext] 🚨 Different user detected - performing full cleanup');
        // Clear any remaining AsyncStorage items
        await AsyncStorage.multiRemove([
          'userData',
          'plansData',
          'authData',
          'navigationState',
        ]);
        console.log('[AuthContext] ✅ All storage cleared for user switch');
      }
      
      console.log('[AuthContext] Caches cleared before login');
      
      // Get current client from storage
      const clientName = await AsyncStorage.getItem('current_client') || 'dna-infotel';
      const clientConfig = getClientConfig();
      console.log('=== AUTH CONTEXT LOGIN ===');
      console.log('Using client for login:', clientName);
      console.log('Client Config:', clientConfig.clientId);
      console.log('API URL:', clientConfig.api.baseURL);
      console.log('Username:', username);
      console.log('Password length:', password ? password.length : 0);
      
      console.log('[AuthContext] Calling apiService.authenticate...');
      const response = await apiService.authenticate(username, password, '', 'no', undefined, 'password');
      
      console.log('=== AUTH CONTEXT - AUTHENTICATE RESPONSE ===');
      console.log('Response received:', response ? 'Yes' : 'No');
      console.log('Response type:', typeof response);
      console.log('Full Response:', JSON.stringify(response, null, 2));
      if (response) {
        console.log('Response has token:', response.token ? 'Yes' : 'No');
        console.log('Response token length:', response.token ? response.token.length : 0);
        console.log('Response keys:', Object.keys(response));
      }
      console.log('=== END AUTH CONTEXT - AUTHENTICATE RESPONSE ===');
      
      if (response && response.token) {
        // CRITICAL: Set isAuthenticated to FALSE first to trigger cleanup in all components
        // This ensures HomeScreen and other screens clear their state BEFORE we set it to true
        console.log('[AuthContext] 🚨 Setting isAuthenticated to FALSE to trigger cleanup...');
        setIsAuthenticated(false);
        setUserData(null);
        
        // Wait a bit to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
      // CRITICAL: Clear ALL caches and storage BEFORE creating session
      console.log('[AuthContext] 🚨 Clearing ALL caches and storage before login...');
      await dataCache.clearAllCache();
      menuService.clearCache();
      
      // CRITICAL: Clear API service's in-memory authUser cache
      // This prevents old user's data from being returned
      apiService.clearAuthUserCache();
      console.log('[AuthContext] ✅ API authUser cache cleared');
        
        // Clear Realm data
        try {
          await realmAuthService.logout();
          console.log('[AuthContext] ✅ Realm data cleared');
        } catch (realmError) {
          console.warn('[AuthContext] Error clearing Realm data:', realmError);
        }
        
        // Clear ALL AsyncStorage items that might contain user data
        try {
          await AsyncStorage.multiRemove([
            'userData',
            'plansData',
            'authData',
            'navigationState',
            'showBiometricAfterLogin',
            'domainName',
            'user_pin',
            'biometricAuthConfig',
          ]);
          console.log('[AuthContext] ✅ All AsyncStorage cleared');
        } catch (storageError) {
          console.warn('[AuthContext] Error clearing AsyncStorage:', storageError);
        }
        
        // NOW create the session
        await sessionManager.createSession(username, response.token, password, clientName, 'password');
        // Login response may include user_password — store only if present
        await sessionManager.storeRegenerationCredentialsFromAuthUser(username, response);
        
        // Store current username for next login comparison
        await AsyncStorage.setItem('last_logged_in_username', username);
        
        // CRITICAL: Set authenticated state AFTER everything is cleared
        // This ensures all components start fresh with no old data
        setIsAuthenticated(true);
        setUserData({
          username,
          token: response.token,
        });
        identifyCleverTapSessionUser(username);
        console.log('[AuthContext] ✅✅✅ Login successful, session created for:', username);
        console.log('[AuthContext] ✅✅✅ All old data cleared, ready for fresh data fetch');
        
        // Device registration in background (non-blocking) - don't wait for it
        // This prevents blocking the login flow, especially on iOS with 3-second delay
        const realm = getClientConfig().clientId;
        ensureDeviceRegistrationAfterLogin(realm)
          .then(deviceRegistered => {
            if (!deviceRegistered) {
              console.warn('[AuthContext] Device registration did not complete after password login');
            } else {
              console.log('[AuthContext] Device registration completed successfully');
            }
          })
          .catch(registrationError => {
            console.warn('[AuthContext] Device registration failed after password login:', registrationError);
          });

        apiService
          .checkCustomerOnboardingFlow(username)
          .then(onboardingData => {
            console.log(
              '[AuthContext] selfcareCheckCustomerOnboardingFlow data:',
              onboardingData,
            );
          })
          .catch(onboardingError => {
            console.warn(
              '[AuthContext] selfcareCheckCustomerOnboardingFlow failed:',
              onboardingError,
            );
          });
        
        // Session monitoring disabled for persistent login
        // sessionMonitor.startMonitoring();
        return {success: true, consentRequired: response.consent_required === true};
      }
      return {success: false, error: 'Invalid response from server. Please try again.'};
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Login failed. Please check your credentials and try again.';
      return {success: false, error: errorMessage};
    } finally {
      setLoading(false);
    }
  };

  const loginWithOtp = async (
    phoneNumber: string,
    otp: string,
  ): Promise<{success: boolean; error?: string; consentRequired?: boolean}> => {
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
      
      // OTP verification call without auth_type/login_from/resend_otp
      const response = await apiService.verifyOtp(phoneNumber, otp);
      
      if (response && response.token) {
        await sessionManager.createSession(phoneNumber, response.token, undefined, clientName, 'otp');
        // OTP login may not include password — authUser will store user_password when available
        await sessionManager.storeRegenerationCredentialsFromAuthUser(phoneNumber, response);
        
        // Store current username for next login comparison
        await AsyncStorage.setItem('last_logged_in_username', phoneNumber);
        
        setIsAuthenticated(true);
        setUserData({
          username: phoneNumber,
          token: response.token,
        });
        identifyCleverTapSessionUser(phoneNumber);
        console.log('[AuthContext] OTP login successful, session created');
        
        // Device registration in background (non-blocking) - don't wait for it
        // This prevents blocking the login flow, especially on iOS with 3-second delay
        const realm = getClientConfig().clientId;
        ensureDeviceRegistrationAfterLogin(realm)
          .then(deviceRegistered => {
            if (!deviceRegistered) {
              console.warn('[AuthContext] Device registration did not complete after OTP login');
            } else {
              console.log('[AuthContext] Device registration completed successfully');
            }
          })
          .catch(registrationError => {
            console.warn('[AuthContext] Device registration failed after OTP login:', registrationError);
          });

        apiService
          .checkCustomerOnboardingFlow(phoneNumber)
          .then(onboardingData => {
            console.log(
              '[AuthContext] selfcareCheckCustomerOnboardingFlow data:',
              onboardingData,
            );
          })
          .catch(onboardingError => {
            console.warn(
              '[AuthContext] selfcareCheckCustomerOnboardingFlow failed:',
              onboardingError,
            );
          });
        
        // Session monitoring disabled for persistent login
        // sessionMonitor.startMonitoring();
        return {success: true, consentRequired: response.consent_required === true};
      }
      return {success: false, error: 'Invalid response from server. Please try again.'};
    } catch (error: any) {
      console.error('OTP login error:', error);
      const errorMessage = error?.message || 'OTP verification failed. Please check your OTP and try again.';
      return {success: false, error: errorMessage};
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      console.log('[AuthContext] 🚨 Starting logout process - CLEARING EVERYTHING...');
      
      // CRITICAL: Reset auth state FIRST to trigger cleanup in all components
      // This ensures HomeScreen and other components immediately clear their state
      setIsAuthenticated(false);
      setUserData(null);
      console.log('[AuthContext] ✅ Auth state reset immediately');
      
      // Clear all cached data
      try {
        await dataCache.clearAllCache();
        console.log('[AuthContext] ✅ Data cache cleared');
      } catch (cacheError) {
        console.warn('[AuthContext] Error clearing data cache:', cacheError);
      }
      
      // CRITICAL: Clear API service's in-memory authUser cache
      try {
        apiService.clearAuthUserCache();
        console.log('[AuthContext] ✅ API authUser cache cleared');
      } catch (apiCacheError) {
        console.warn('[AuthContext] Error clearing API cache:', apiCacheError);
      }
      
      // Clear menu service cache (in-memory cache)
      try {
        menuService.clearCache();
        console.log('[AuthContext] ✅ Menu service cache cleared');
      } catch (menuError) {
        console.warn('[AuthContext] Error clearing menu cache:', menuError);
      }
      
      // Clear Realm data if available
      try {
        await realmAuthService.logout();
        console.log('[AuthContext] ✅ Realm data cleared');
      } catch (realmError) {
        console.warn('[AuthContext] Error clearing Realm data:', realmError);
      }
      
      // Clear ALL AsyncStorage data - be aggressive
      try {
        await AsyncStorage.multiRemove([
          'userData',
          'plansData', 
          'authData',
          'navigationState',
          'showBiometricAfterLogin',
          'domainName',
          'user_pin',
          'biometricAuthConfig',
          'last_logged_in_username', // Clear username tracking
          'stored_username',
          'stored_password',
          'current_client',
          'current_api_url',
        ]);
        console.log('[AuthContext] ✅ AsyncStorage cleared');
      } catch (storageError) {
        console.warn('[AuthContext] Error clearing AsyncStorage:', storageError);
      }
      
      // Clear PIN storage
      try {
        await pinStorage.clearPin();
        console.log('[AuthContext] ✅ PIN cleared');
      } catch (pinError) {
        console.warn('[AuthContext] Error clearing PIN:', pinError);
      }
      
      // Disable biometric auth
      try {
        await biometricAuthService.disableAuth();
        console.log('[AuthContext] ✅ Biometric auth disabled');
      } catch (bioError) {
        console.warn('[AuthContext] Error disabling biometric:', bioError);
      }
      
      // Perform API logout (non-blocking - don't wait if it fails)
      try {
        await Promise.race([
          apiService.logout(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        console.log('[AuthContext] ✅ API logout completed');
      } catch (apiError) {
        console.warn('[AuthContext] API logout failed or timed out (non-critical):', apiError);
      }
      
      // Clear session
      try {
        await sessionManager.logout();
        console.log('[AuthContext] ✅ Session cleared');
      } catch (sessionError) {
        console.warn('[AuthContext] Error clearing session:', sessionError);
      }
      
      // Session monitoring disabled for persistent login
      // sessionMonitor.stopMonitoring();
      
      console.log('[AuthContext] ✅✅✅ Logout process completed - ALL DATA CLEARED ✅✅✅');
    } catch (error) {
      console.error('[AuthContext] ❌ Logout error:', error);
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