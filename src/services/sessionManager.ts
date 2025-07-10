import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSession {
  isLoggedIn: boolean;
  username: string;
  token: string;
  lastLoginTime: number;
  sessionExpiry?: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private readonly SESSION_KEY = 'user_session';
  private readonly SESSION_EXPIRY_HOURS = 24 * 7; // 7 days

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (savedSession) {
        this.currentSession = JSON.parse(savedSession);
        
        // Check if session is still valid
        if (this.currentSession && this.isSessionValid()) {
          console.log('Valid session found, user is logged in');
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

  async createSession(username: string, token: string): Promise<void> {
    try {
      const session: UserSession = {
        isLoggedIn: true,
        username,
        token,
        lastLoginTime: Date.now(),
        sessionExpiry: Date.now() + (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000),
      };

      this.currentSession = session;
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
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
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  async logout(): Promise<void> {
    await this.clearSession();
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

    return true;
  }

  async refreshSession(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.lastLoginTime = Date.now();
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
        this.currentSession.lastLoginTime = Date.now();
        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        console.log('Token updated successfully');
      }
    } catch (error) {
      console.error('Failed to update token:', error);
    }
  }
}

export default SessionManager.getInstance(); 