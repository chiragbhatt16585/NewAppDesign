import AsyncStorage from '@react-native-async-storage/async-storage';
import credentialStorage from './credentialStorage';

export interface UserSession {
  isLoggedIn: boolean;
  username: string;
  token: string;
  lastLoginTime: number;
  lastActivityTime: number; // Track when user last used the app
  sessionExpiry?: number;
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
      console.log('Starting session manager initialization...');
      
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
        
        // Check if session is still valid
        if (this.currentSession && this.isSessionValid()) {
          console.log('Valid session found, user is logged in');
        } else {
          console.log('Session invalid, clearing session');
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
      await this.clearSession();
    }
  }

  async createSession(username: string, token: string, password?: string): Promise<void> {
    try {
      const session: UserSession = {
        isLoggedIn: true,
        username,
        token,
        lastLoginTime: Date.now(),
        lastActivityTime: Date.now(), // Keep for tracking but don't use for logout
      };

      this.currentSession = session;
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      // Store credentials in AsyncStorage for token regeneration
      if (password) {
        await credentialStorage.saveCredentials(username, password);
      }
      
      console.log('Session created successfully');
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async getCurrentSession(): Promise<UserSession | null> {
    try {
      // Always try to get from AsyncStorage first
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
        console.log('Session loaded from storage:', this.currentSession?.username);
      }
      
      // Return session if it exists and has required fields
      if (this.currentSession && this.currentSession.username && this.currentSession.token) {
        return this.currentSession;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null && session.isLoggedIn;
  }

  async getToken(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession();
      console.log('Getting token from session:', session?.token ? 'Token exists' : 'No token');
      return session?.token || null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async getUsername(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession();
      console.log('Getting username from session:', session?.username);
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
      await credentialStorage.deleteCredentials();
      
      // Clear navigation state to prevent redirecting to protected screens
      await AsyncStorage.removeItem('navigationState');
      
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  async logout(): Promise<void> {
    await this.clearSession();
  }

  // New method to regenerate token using stored password
  async regenerateToken(): Promise<string | false> {
    try {
      const newToken = await credentialStorage.regenerateToken();
      if (newToken) {
        // Update session with new token
        if (this.currentSession) {
          this.currentSession.token = newToken;
          this.currentSession.lastActivityTime = Date.now();
          await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
          console.log('Token regenerated and session updated');
        }
        return newToken;
      }
      return false;
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      return false;
    }
  }

  // New method to update activity time
  async updateActivityTime(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.lastActivityTime = Date.now();
        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        console.log('Activity time updated');
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
    if (!this.currentSession) return false;

    // Check if token exists
    if (!this.currentSession.token) {
      console.log('No token in session');
      return false;
    }

    // Session is valid (no automatic logout)
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
        console.log('Session refreshed');
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
        console.log('Token updated successfully');
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
        console.log('No token in session, but keeping session for potential regeneration');
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
}

export default SessionManager.getInstance(); 