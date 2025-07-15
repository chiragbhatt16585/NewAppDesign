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
          
          // Check if session is about to expire (within 24 hours)
          if (this.isSessionExpiringSoon()) {
            console.log('Session is expiring soon, user should be notified');
          }

          // Check for inactivity logout
          if (this.shouldLogoutDueToInactivity()) {
            console.log('User inactive for 7 days, logging out automatically');
            await this.clearSession();
            return;
          }
        } else {
          console.log('Session expired or invalid, clearing session');
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
        lastActivityTime: Date.now(), // Initialize activity time
        sessionExpiry: Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000),
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
    if (!this.currentSession) {
      try {
        const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
        if (savedSession) {
          this.currentSession = JSON.parse(savedSession);
        }
      } catch (error) {
        console.error('Failed to get current session:', error);
      }
    }

    if (this.currentSession && this.isSessionValid()) {
      return this.currentSession;
    }

    return null;
  }

  async isLoggedIn(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null && session.isLoggedIn;
  }

  async getToken(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.token || null;
  }

  async getUsername(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.username || null;
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
          this.currentSession.sessionExpiry = Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
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

  // New method to check if user should be logged out due to inactivity
  private shouldLogoutDueToInactivity(): boolean {
    if (!this.currentSession || !this.currentSession.lastActivityTime) return false;
    
    const inactivityThreshold = Date.now() - (this.INACTIVITY_LOGOUT_HOURS * 60 * 60 * 1000);
    const shouldLogout = this.currentSession.lastActivityTime < inactivityThreshold;
    
    if (shouldLogout) {
      console.log('User inactive for 7 days, should logout');
    }
    
    return shouldLogout;
  }

  private isSessionValid(): boolean {
    if (!this.currentSession) return false;

    // Check if session has expired
    if (this.currentSession.sessionExpiry && Date.now() > this.currentSession.sessionExpiry) {
      console.log('Session has expired');
      return false;
    }

    // Check if token exists
    if (!this.currentSession.token) {
      console.log('No token in session');
      return false;
    }

    // Check for inactivity logout
    if (this.shouldLogoutDueToInactivity()) {
      console.log('Session invalid due to inactivity');
      return false;
    }

    return true;
  }

  private isSessionExpiringSoon(): boolean {
    if (!this.currentSession || !this.currentSession.sessionExpiry) return false;
    
    const warningTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
    return this.currentSession.sessionExpiry < warningTime;
  }

  async refreshSession(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.lastLoginTime = Date.now();
        this.currentSession.lastActivityTime = Date.now(); // Update activity time on refresh
        this.currentSession.sessionExpiry = Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
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
        this.currentSession.sessionExpiry = Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
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
    if (!this.currentSession || !this.currentSession.sessionExpiry) {
      return { isExpiringSoon: false, hoursRemaining: 0 };
    }
    
    const now = Date.now();
    const hoursRemaining = Math.max(0, Math.floor((this.currentSession.sessionExpiry - now) / (60 * 60 * 1000)));
    const isExpiringSoon = hoursRemaining <= 24;
    
    return { isExpiringSoon, hoursRemaining };
  }

  async getInactivityInfo(): Promise<{ isInactive: boolean; hoursSinceLastActivity: number }> {
    if (!this.currentSession || !this.currentSession.lastActivityTime) {
      return { isInactive: false, hoursSinceLastActivity: 0 };
    }
    
    const now = Date.now();
    const hoursSinceLastActivity = Math.floor((now - this.currentSession.lastActivityTime) / (60 * 60 * 1000));
    const isInactive = hoursSinceLastActivity >= this.INACTIVITY_LOGOUT_HOURS;
    
    return { isInactive, hoursSinceLastActivity };
  }

  async getDaysSinceLastActivity(): Promise<number> {
    if (!this.currentSession || !this.currentSession.lastActivityTime) return 0;
    
    const now = Date.now();
    const daysSinceLastActivity = Math.floor((now - this.currentSession.lastActivityTime) / (24 * 60 * 60 * 1000));
    return daysSinceLastActivity;
  }
}

export default SessionManager.getInstance(); 