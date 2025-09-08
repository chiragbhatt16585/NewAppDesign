import AsyncStorage from '@react-native-async-storage/async-storage';
import { credentialStorage } from './credentialStorage';
import { pinStorage } from './pinStorage';
import biometricAuthService from './biometricAuth';
import { apiService } from './api';

export interface UserSession {
  isLoggedIn: boolean;
  username: string;
  token: string;
  lastLoginTime: number;
  lastActivityTime: number; // Track when user last used the app
  sessionExpiry?: number;
  clientName?: string; // Store which client this session belongs to
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private readonly SESSION_KEY = 'user_session';
  private readonly SESSION_EXPIRY_HOURS = 24 * 7; // 7 days
  private readonly SESSION_WARNING_HOURS = 24 * 6; // 6 days - warn before expiry
  private readonly INACTIVITY_LOGOUT_HOURS = 24 * 7; // 7 days of inactivity

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // console.log('=== STARTING SESSION MANAGER INITIALIZATION ===');
      
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      // console.log('Saved session exists:', !!savedSession);
      
      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
        // console.log('Session loaded:', this.currentSession?.username);
        // console.log('Session isLoggedIn:', this.currentSession?.isLoggedIn);
        // console.log('Session client:', this.currentSession?.clientName);
        
        // Check if session is still valid
        if (this.currentSession && this.isSessionValid()) {
          // console.log('✅ Valid session found, user is logged in');
          
          // Note: API configuration is handled by build scripts, no dynamic update needed
        } else {
          // console.log('❌ Session invalid, clearing session');
          await this.clearSession();
        }
      } else {
        // console.log('No saved session found');
      }
      
      // console.log('=== SESSION MANAGER INITIALIZATION COMPLETE ===');
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
      await this.clearSession();
    }
  }

  async createSession(username: string, token: string, password?: string, clientName?: string): Promise<void> {
    try {
      const session: UserSession = {
        isLoggedIn: true,
        username,
        token,
        lastLoginTime: Date.now(),
        lastActivityTime: Date.now(), // Keep for tracking but don't use for logout
        clientName: clientName || 'dna-infotel', // Default to dna-infotel if not specified
      };

      this.currentSession = session;
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      // Store credentials in AsyncStorage for token regeneration
      if (password) {
        await credentialStorage.saveCredentials(username, password);
      }
      
      // Store current client for token regeneration
      await this.storeCurrentClient();
      
      // Note: API configuration is handled by build scripts, no dynamic update needed
      
      // console.log('Session created successfully for client:', clientName);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  // Store current client for token regeneration
  private async storeCurrentClient(): Promise<void> {
    try {
      // Determine current client based on API URL
      const currentUrl = await AsyncStorage.getItem('current_api_url');
      let clientName = 'dna-infotel'; // Default
      
      if (currentUrl) {
        if (currentUrl.includes('microscan.co.in')) {
          clientName = 'microscan';
        } else if (currentUrl.includes('dnainfotel.com')) {
          clientName = 'dna-infotel';
        } else if (currentUrl.includes('7stardigitalnetwork.com')) {
          clientName = 'one-sevenstar';
        } else if (currentUrl.includes('logonbroadband.com')) {
          clientName = 'logon-broadband';
        }
      } else {
        // If no stored URL, try to detect from current API configuration
        const { domainUrl } = await import('./api');
        if (domainUrl.includes('microscan.co.in')) {
          clientName = 'microscan';
        } else if (domainUrl.includes('dnainfotel.com')) {
          clientName = 'dna-infotel';
        } else if (domainUrl.includes('7stardigitalnetwork.com')) {
          clientName = 'one-sevenstar';
        } else if (domainUrl.includes('logonbroadband.com')) {
          clientName = 'logon-broadband';
        }
        
        await AsyncStorage.setItem('current_api_url', `https://${domainUrl}`);
      }
      
      await AsyncStorage.setItem('current_client', clientName);
      // console.log('Current client stored:', clientName);
    } catch (error) {
      console.error('Failed to store current client:', error);
    }
  }

  async getCurrentSession(): Promise<UserSession | null> {
    try {
      // Always try to get from AsyncStorage first
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      
      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
      }
      
      // Return session if it exists and has required fields
      if (this.currentSession && this.currentSession.username && this.currentSession.isLoggedIn) {
        return this.currentSession;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      
      if (session && session.username && session.isLoggedIn) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession();
      return session?.token || null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async getUsername(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession();
      return session?.username || null;
    } catch (error) {
      console.error('Failed to get username:', error);
      return null;
    }
  }

  async clearSession(): Promise<void> {
    try {
      this.currentSession = null;
      await AsyncStorage.removeItem(this.SESSION_KEY);
      // Clear credentials from AsyncStorage
      // console.log('[SessionManager] Clearing credentials from AsyncStorage');
      await credentialStorage.clearCredentials();
      // Clear navigation state to prevent redirecting to protected screens
      await AsyncStorage.removeItem('navigationState');
      // console.log('[SessionManager] Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear current session
      this.currentSession = null;
      
      // Clear all session-related data
      await AsyncStorage.multiRemove([
        this.SESSION_KEY,
        'stored_username',
        'stored_password',
        'current_client',
        'current_api_url',
        'navigationState',
        'userData',
        'plansData',
        'authData',
        'showBiometricAfterLogin',
        'domainName',
        'user_pin',
        'biometricAuthConfig'
      ]);
      
      // Clear credentials
      await credentialStorage.clearCredentials();
      
      // Clear PIN
      await pinStorage.clearPin();
      
      // Disable biometric auth
      await biometricAuthService.disableAuth();
      
      console.log('Session logout completed - all data cleared');
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback to basic session clear
      await this.clearSession();
    }
  }

  // New method to regenerate token using stored password
  async regenerateToken(): Promise<string | false> {
    try {
      // console.log('[SessionManager] Attempting to regenerate token...');
      
      // Check if we have a current session
      if (!this.currentSession) {
        console.error('[SessionManager] No current session for token regeneration');
        return false;
      }
      
      // Get stored credentials
      const creds = await credentialStorage.getCredentials();
      if (!creds) {
        console.error('[SessionManager] No stored credentials for token regeneration');
        return false;
      }
      
      const { username, password } = creds;
      // console.log('[SessionManager] Found stored credentials for user:', username);
      
      // Perform login to get new token
      // console.log('[SessionManager] Attempting authentication...');
      const loginResponse = await apiService.authenticate(username, password);
      
      if (loginResponse && loginResponse.token) {
        // console.log('[SessionManager] Authentication successful, updating session...');
        
        if (this.currentSession) {
          this.currentSession.token = loginResponse.token;
          this.currentSession.lastActivityTime = Date.now();
          await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
          // console.log('[SessionManager] Token regenerated and session updated successfully');
        }
        return loginResponse.token;
      } else {
        console.error('[SessionManager] Authentication failed - no token received');
        return false;
      }
    } catch (error: any) {
      console.error('[SessionManager] Failed to regenerate token:', error.message || error);
      return false;
    }
  }

  // New method to update activity time
  async updateActivityTime(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.lastActivityTime = Date.now();
        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        // console.log('Activity time updated');
      }
    } catch (error) {
      console.error('Failed to update activity time:', error);
    }
  }

  // Method kept for reference but not used for automatic logout
  private shouldLogoutDueToInactivity(): boolean {
    // Disabled automatic logout - sessions persist until manual logout
    return false;
  }

  private isSessionValid(): boolean {
    if (!this.currentSession) {
      // console.log('No current session');
      return false;
    }

    // Check if username exists
    if (!this.currentSession.username) {
      // console.log('No username in session');
      return false;
    }

    // Check if session is marked as logged in
    if (!this.currentSession.isLoggedIn) {
      // console.log('Session marked as not logged in');
      return false;
    }

    // Session is valid (no automatic logout) - token can be regenerated
    // console.log('✅ Session is valid');
    return true;
  }

  private isSessionExpiringSoon(): boolean {
    // Disabled session expiry - sessions persist until manual logout
    return false;
  }

  async refreshSession(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.lastLoginTime = Date.now();
        this.currentSession.lastActivityTime = Date.now(); // Update activity time on refresh
        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        // console.log('Session refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }

  async updateToken(newToken: string): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.token = newToken;
        this.currentSession.lastActivityTime = Date.now();
        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        // console.log('Token updated successfully');
      }
    } catch (error) {
      console.error('Failed to update token:', error);
    }
  }

  async shouldRefreshSession(): Promise<boolean> {
    if (!this.currentSession || !this.currentSession.sessionExpiry) return false;
    
    const refreshThreshold = Date.now() + (60 * 60 * 1000); // 1 hour from now
    return this.currentSession.sessionExpiry < refreshThreshold;
  }

  async getSessionExpiryInfo(): Promise<{ isExpiringSoon: boolean; hoursRemaining: number }> {
    // Sessions don't expire automatically - they persist until manual logout
    return { isExpiringSoon: false, hoursRemaining: 0 };
  }

  async getInactivityInfo(): Promise<{ isInactive: boolean; hoursSinceLastActivity: number }> {
    if (!this.currentSession || !this.currentSession.lastActivityTime) {
      return { isInactive: false, hoursSinceLastActivity: 0 };
    }
    
    const now = Date.now();
    const hoursSinceLastActivity = Math.floor((now - this.currentSession.lastActivityTime) / (60 * 60 * 1000));
    // Sessions don't become inactive automatically - they persist until manual logout
    const isInactive = false;
    
    return { isInactive, hoursSinceLastActivity };
  }

  async getDaysSinceLastActivity(): Promise<number> {
    if (!this.currentSession || !this.currentSession.lastActivityTime) return 0;
    
    const now = Date.now();
    const daysSinceLastActivity = Math.floor((now - this.currentSession.lastActivityTime) / (24 * 60 * 60 * 1000));
    return daysSinceLastActivity;
  }

  // New method to check session validity before API calls
  async checkSessionBeforeApiCall(): Promise<{ isValid: boolean; shouldRedirect: boolean; message: string }> {
    try {
      // First check if session exists
      if (!this.currentSession) {
        return {
          isValid: false,
          shouldRedirect: true,
          message: 'No active session found. Please login again.'
        };
      }

      // Check if token exists - but don't clear session immediately
      if (!this.currentSession.token) {
        // console.log('No token in session, but keeping session for potential regeneration');
        return {
          isValid: false,
          shouldRedirect: false, // Don't redirect, let API handle token regeneration
          message: 'Authentication token missing. Please login again.'
        };
      }

      // Session is valid (no automatic logout)
      return {
        isValid: true,
        shouldRedirect: false,
        message: ''
      };
    } catch (error) {
      console.error('Error checking session before API call:', error);
      return {
        isValid: false,
        shouldRedirect: true,
        message: 'Session validation failed. Please login again.'
      };
    }
  }

  // New method to completely reset session and clear all data
  async resetSession(): Promise<void> {
    try {
      // console.log('=== RESETTING SESSION AND CLEARING ALL DATA ===');
      
      // Clear current session
      this.currentSession = null;
      
      // Clear AsyncStorage session
      await AsyncStorage.removeItem(this.SESSION_KEY);
      
      // Clear stored credentials
      await AsyncStorage.removeItem('stored_username');
      await AsyncStorage.removeItem('stored_password');
      
      // Clear current client and API URL
      await AsyncStorage.removeItem('current_client');
      await AsyncStorage.removeItem('current_api_url');
      
      // console.log('Session and all stored data cleared successfully');
    } catch (error) {
      console.error('Error resetting session:', error);
      throw error;
    }
  }

  // Enhanced method to check and fix session issues
  async diagnoseAndFixSession(): Promise<{ needsReset: boolean; issues: string[] }> {
    try {
      // console.log('=== DIAGNOSING SESSION ISSUES ===');
      
      const issues: string[] = [];
      let needsReset = false;
      
      // Check if session exists in AsyncStorage
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!savedSession) {
        issues.push('No session found in AsyncStorage');
        needsReset = true;
      } else {
        try {
          const parsedSession = JSON.parse(savedSession);
          // console.log('Parsed session:', parsedSession);
          
          // Check session structure - be more lenient
          if (!parsedSession.username) {
            issues.push('Session missing username');
            needsReset = true;
          }
          
          // Don't reset if token is missing - let API handle token regeneration
          if (!parsedSession.token) {
            issues.push('Session missing token - will attempt regeneration');
            // Don't set needsReset = true here - let the API try to regenerate
          }
          
          if (!parsedSession.isLoggedIn) {
            issues.push('Session marked as not logged in');
            needsReset = true;
          }
          
          // Check stored credentials - be more lenient
          const storedUsername = await AsyncStorage.getItem('stored_username');
          const storedPassword = await AsyncStorage.getItem('stored_password');
          
          if (!storedUsername || !storedPassword) {
            issues.push('Missing stored credentials for token regeneration');
            // Only reset if we also don't have a valid token
            if (!parsedSession.token) {
              needsReset = true;
            }
          }
          
          // Check if username matches between session and stored credentials
          if (storedUsername && parsedSession.username && storedUsername !== parsedSession.username) {
            issues.push('Username mismatch between session and stored credentials');
            needsReset = true;
          }
          
          // If we have a valid session structure, don't reset even if some issues exist
          if (parsedSession.username && parsedSession.isLoggedIn) {
            // console.log('Session has valid structure, keeping it');
            needsReset = false;
          }
          
        } catch (parseError) {
          issues.push('Session data corrupted (JSON parse error)');
          needsReset = true;
        }
      }
      
      // console.log('Session diagnosis complete:', { needsReset, issues });
      return { needsReset, issues };
      
    } catch (error) {
      console.error('Error diagnosing session:', error);
      return { needsReset: true, issues: ['Error during diagnosis'] };
    }
  }

  // New method to automatically refresh session and regenerate token if needed
  async autoRefreshSession(): Promise<{ success: boolean; message: string }> {
    try {
      // console.log('=== AUTO REFRESHING SESSION ===');
      
      const session = await this.getCurrentSession();
      if (!session) {
        // console.log('No session found for auto refresh');
        return { success: false, message: 'No active session found' };
      }

      // console.log('Current session found:', session.username);
      
      // Check if token needs regeneration (if missing or expired)
      const needsTokenRegeneration = !session.token || await this.isTokenExpired(session.token);
      
      if (needsTokenRegeneration) {
        // console.log('Token needs regeneration, attempting...');
        const newToken = await this.regenerateToken();
        
        if (newToken) {
          // console.log('✅ Token regenerated successfully');
          await this.updateToken(newToken);
          await this.refreshSession();
          return { success: true, message: 'Session refreshed and token regenerated' };
        } else {
          // console.log('❌ Token regeneration failed');
          return { success: false, message: 'Failed to regenerate token' };
        }
      } else {
        // console.log('✅ Token is still valid, just refreshing session');
        await this.refreshSession();
        return { success: true, message: 'Session refreshed' };
      }
      
    } catch (error) {
      console.error('Error during auto refresh:', error);
      return { success: false, message: 'Error refreshing session' };
    }
  }

  // Check if token is expired (basic check - can be enhanced with JWT parsing)
  private async isTokenExpired(token: string): Promise<boolean> {
    try {
      // For now, we'll assume tokens expire after 24 hours of inactivity
      // In a real implementation, you might want to parse JWT and check expiration
      const lastActivity = this.currentSession?.lastActivityTime || 0;
      const hoursSinceLastActivity = (Date.now() - lastActivity) / (60 * 60 * 1000);
      
      // Consider token expired if more than 24 hours of inactivity
      const isExpired = hoursSinceLastActivity > 24;
      
      // console.log('Token expiry check:', {
      //   hoursSinceLastActivity: Math.round(hoursSinceLastActivity),
      //   isExpired
      // });
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false; // Assume not expired if we can't check
    }
  }

  // Enhanced method to check if session needs refresh
  async shouldAutoRefresh(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session) return false;

      // Check if it's been more than 1 hour since last activity
      const lastActivity = session.lastActivityTime || 0;
      const hoursSinceLastActivity = (Date.now() - lastActivity) / (60 * 60 * 1000);
      
      const shouldRefresh = hoursSinceLastActivity > 1; // Refresh if more than 1 hour
      
      // console.log('Auto refresh check:', {
      //   hoursSinceLastActivity: Math.round(hoursSinceLastActivity),
      //   shouldRefresh
      // });
      
      return shouldRefresh;
    } catch (error) {
      console.error('Error checking if should auto refresh:', error);
      return false;
    }
  }
}

export default SessionManager.getInstance(); 