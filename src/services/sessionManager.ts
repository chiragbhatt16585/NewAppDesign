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
  authMethod?: 'password' | 'otp';
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private tokenRegenPromise: Promise<string | false> | null = null;
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
        
        // Only clear session if username is missing - preserve session even if token is missing
        // Token can be regenerated automatically
        if (this.currentSession && this.currentSession.username) {
          // Ensure isLoggedIn flag is set for backwards compatibility
          if (!this.currentSession.isLoggedIn) {
            this.currentSession.isLoggedIn = true;
            await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
          }
          
          // If token is missing, regenerate in background so the next API call succeeds
          if (!this.currentSession.token) {
            console.log('[SessionManager] Session found but token missing - regenerating in background');
            this.regenerateToken().catch(() => {});
          }
          
          // Note: API configuration is handled by build scripts, no dynamic update needed
        } else {
          // Only clear if username is missing - this means session is truly invalid
          console.log('❌ Session invalid (no username), clearing session');
          await this.clearSession();
        }
      } else {
        // console.log('No saved session found');
      }
      
      // console.log('=== SESSION MANAGER INITIALIZATION COMPLETE ===');
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
      // Only clear on parse errors - don't clear on other errors
      if (error instanceof SyntaxError) {
        await this.clearSession();
      }
    }
  }

  async createSession(
    username: string,
    token: string,
    password?: string,
    clientName?: string,
    authMethod: 'password' | 'otp' = password ? 'password' : 'otp',
  ): Promise<void> {
    try {
      const session: UserSession = {
        isLoggedIn: true,
        username,
        token,
        lastLoginTime: Date.now(),
        lastActivityTime: Date.now(), // Keep for tracking but don't use for logout
        clientName: clientName || 'dna-infotel', // Default to dna-infotel if not specified
        authMethod,
      };

      this.currentSession = session;
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      // Store credentials in AsyncStorage for password-based token regeneration
      if (password && authMethod === 'password') {
        await credentialStorage.saveCredentials(username, password);
      } else if (authMethod === 'otp') {
        // Only clear stale credentials from a different user — never wipe on app update
        const existing = await credentialStorage.getCredentials();
        const newUser = username.toLowerCase().trim();
        if (
          existing?.username &&
          existing.username.toLowerCase().trim() !== newUser
        ) {
          await credentialStorage.clearCredentials();
        }
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
        } else if (currentUrl.includes('dnagoa.com')) {
          clientName = 'dna-goa';
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
        } else if (domainUrl.includes('dnagoa.com')) {
          clientName = 'dna-goa';
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
      
      // Return session if username exists - token can be regenerated automatically
      // Don't require isLoggedIn flag - it will be set automatically if username exists
      if (this.currentSession && this.currentSession.username) {
        // Ensure isLoggedIn flag is set for backwards compatibility
        if (!this.currentSession.isLoggedIn) {
          this.currentSession.isLoggedIn = true;
          await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        }
        // Infer auth method for sessions created before this field existed
        if (!this.currentSession.authMethod) {
          const creds = await credentialStorage.getCredentials();
          this.currentSession.authMethod = creds?.password ? 'password' : 'otp';
          await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        }
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
      
      // User is logged in if username exists - token can be regenerated
      if (session && session.username) {
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
    if (this.tokenRegenPromise) {
      return this.tokenRegenPromise;
    }

    this.tokenRegenPromise = this.performRegenerateToken();
    try {
      return await this.tokenRegenPromise;
    } finally {
      this.tokenRegenPromise = null;
    }
  }

  private extractTokenFromLoginResponse(response: any): string | null {
    if (!response) {
      return null;
    }
    if (typeof response.token === 'string' && response.token.trim()) {
      return response.token;
    }
    if (typeof response.Authentication === 'string' && response.Authentication.trim()) {
      return response.Authentication;
    }
    if (typeof response.authentication === 'string' && response.authentication.trim()) {
      return response.authentication;
    }
    return null;
  }

  async hasStoredCredentials(): Promise<boolean> {
    const creds = await credentialStorage.getCredentials();
    return !!(creds?.username && creds?.password);
  }

  private extractUserPassword(authData: any): string | null {
    if (!authData || typeof authData !== 'object') {
      return null;
    }

    const raw = authData.user_password;
    if (typeof raw !== 'string') {
      return null;
    }

    const password = raw.trim();
    if (
      !password ||
      password.toLowerCase() === 'null' ||
      password.toLowerCase() === 'undefined'
    ) {
      return null;
    }

    return password;
  }

  /**
   * Save user_password from authUser (or login) only when the API returns a real value.
   * No-op when missing — never clears or overwrites with empty data.
   */
  async storeRegenerationCredentialsFromAuthUser(
    username: string,
    authData: any,
  ): Promise<boolean> {
    try {
      const password = this.extractUserPassword(authData);
      if (!password) {
        return false;
      }

      const session = await this.getCurrentSession();
      if (!session?.username) {
        return false;
      }

      const sessionUser = session.username.toLowerCase().trim();
      const authUser = username.toLowerCase().trim();
      if (sessionUser !== authUser) {
        return false;
      }

      await credentialStorage.saveCredentials(sessionUser, password);
      return true;
    } catch (error) {
      console.warn('[SessionManager] Failed to store credentials from authUser:', error);
      return false;
    }
  }

  async isOtpSession(): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (session?.authMethod === 'otp') {
      return true;
    }
    if (session?.authMethod === 'password') {
      return false;
    }
    return !(await this.hasStoredCredentials());
  }

  private async performRegenerateToken(): Promise<string | false> {
    try {
      const session = await this.getCurrentSession();
      if (!session?.username) {
        console.error('[SessionManager] No current session for token regeneration');
        return false;
      }

      const creds = await credentialStorage.getCredentials();
      const username = (
        creds?.username ||
        session.username
      ).toLowerCase().trim();
      let token: string | null = null;

      if (creds?.password) {
        try {
          console.log('[SessionManager] Regenerating token with saved credentials for:', username);
          const loginResponse = await apiService.authenticate(
            username,
            creds.password,
            '',
            'none',
            undefined,
            'password',
          );
          token = this.extractTokenFromLoginResponse(loginResponse);
        } catch (passwordError: any) {
          console.warn(
            '[SessionManager] Password token regeneration failed:',
            passwordError?.message || passwordError,
          );
        }
      } else {
        console.warn(
          '[SessionManager] No saved password found for token regeneration; username=',
          username,
        );
      }

      if (!token) {
        console.log('[SessionManager] Attempting username-only session token renewal');
        const renewed = await apiService.regenerateSessionToken(username);
        token = renewed || null;
      }

      if (token) {
        if (this.currentSession) {
          this.currentSession.token = token;
          this.currentSession.lastActivityTime = Date.now();
          await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        }
        console.log('[SessionManager] Token regenerated successfully');
        return token;
      }

      console.error('[SessionManager] Token regeneration failed');
      return false;
    } catch (error: any) {
      const message = error?.message || String(error);
      if (
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('internet connection')
      ) {
        console.warn('[SessionManager] Token regeneration skipped (network):', message);
      } else {
        console.error('[SessionManager] Failed to regenerate token:', message);
      }
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

    // Only check if username exists - token can be regenerated automatically
    if (!this.currentSession.username) {
      // console.log('No username in session');
      return false;
    }

    // Session is valid if username exists - token missing is OK (will regenerate)
    // Don't check isLoggedIn flag - it will be set automatically if username exists
    // console.log('✅ Session is valid (username exists, token can be regenerated)');
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

  // Try to restore a usable auth token without logging the user out
  async ensureSessionReady(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session?.username) {
        return false;
      }

      if (session.token) {
        return true;
      }

      const newToken = await this.regenerateToken();
      return !!newToken;
    } catch (error) {
      console.error('[SessionManager] ensureSessionReady failed:', error);
      return false;
    }
  }

  // Enhanced method to check and fix session issues
  async diagnoseAndFixSession(): Promise<{ needsReset: boolean; issues: string[] }> {
    try {
      const issues: string[] = [];
      let needsReset = false;

      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!savedSession) {
        issues.push('No session found in AsyncStorage');
        return { needsReset: true, issues };
      }

      let parsedSession: UserSession;
      try {
        parsedSession = JSON.parse(savedSession);
      } catch {
        issues.push('Session data corrupted (JSON parse error)');
        return { needsReset: true, issues };
      }

      if (!parsedSession.username) {
        issues.push('Session missing username');
        return { needsReset: true, issues };
      }

      // Auto-repair legacy sessions that lost the isLoggedIn flag
      if (!parsedSession.isLoggedIn) {
        issues.push('Session missing isLoggedIn flag - repaired automatically');
        parsedSession.isLoggedIn = true;
        this.currentSession = parsedSession;
        await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(parsedSession));
      }

      const storedUsername = await AsyncStorage.getItem('stored_username');
      const storedPassword = await AsyncStorage.getItem('stored_password');

      if (storedUsername && parsedSession.username && storedUsername !== parsedSession.username) {
        issues.push('Username mismatch between session and stored credentials');
        return { needsReset: true, issues };
      }

      if (!parsedSession.token) {
        issues.push('Session missing token - attempting regeneration');
        const newToken = await this.regenerateToken();
        if (newToken) {
          issues.push('Token regenerated successfully');
        } else if (!storedUsername || !storedPassword) {
          issues.push('Token regeneration failed and stored credentials are missing');
          // Keep session if username exists; API layer may still recover later
        }
      }

      if ((!storedUsername || !storedPassword) && !parsedSession.token) {
        issues.push('Missing stored credentials and no active token');
      }

      // Never force reset for recoverable session state — user should stay logged in
      needsReset = false;
      return { needsReset, issues };
    } catch (error) {
      console.error('Error diagnosing session:', error);
      return { needsReset: false, issues: ['Error during diagnosis'] };
    }
  }

  // New method to automatically refresh session and regenerate token if needed
  async autoRefreshSession(): Promise<{ success: boolean; message: string }> {
    try {
      const session = await this.getCurrentSession();
      if (!session?.username) {
        return { success: false, message: 'No active session found' };
      }

      // Prefer regenerating with saved password whenever credentials exist.
      // Server tokens can expire while local session still has a stale token value.
      const hasCredentials = await this.hasStoredCredentials();
      const needsTokenRegeneration =
        !session.token ||
        hasCredentials ||
        (await this.isTokenExpired(session.token));

      if (needsTokenRegeneration) {
        console.log(
          '[SessionManager] Auto-refresh regenerating token (hasCredentials=',
          hasCredentials,
          ', hasToken=',
          !!session.token,
          ')',
        );
        const newToken = await this.regenerateToken();

        if (newToken) {
          await this.updateToken(newToken);
          await this.refreshSession();
          return { success: true, message: 'Session refreshed and token regenerated' };
        }

        // Keep going with existing token if regen failed (e.g. offline) —
        // makeAuthenticatedRequest will retry on Token Expired later.
        if (session.token) {
          await this.refreshSession();
          return {
            success: true,
            message: 'Token regeneration failed; using existing session token',
          };
        }

        return { success: false, message: 'Failed to regenerate token' };
      }

      await this.refreshSession();
      return { success: true, message: 'Session refreshed' };
    } catch (error) {
      console.error('Error during auto refresh:', error);
      return { success: false, message: 'Error refreshing session' };
    }
  }

  // Check if token is expired (basic check - can be enhanced with JWT parsing)
  // We do NOT expire token based on inactivity — let the server decide. When the server
  // returns 401, makeAuthenticatedRequest will try regeneration. This avoids "Session expired"
  // when opening the app after a day while the server token may still be valid.
  private async isTokenExpired(_token: string): Promise<boolean> {
    return false;
  }

  // Enhanced method to check if session needs refresh
  async shouldAutoRefresh(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session) return false;

      // Check if it's been more than 1 hour since last activity
      const lastActivity = session.lastActivityTime || 0;
      const hoursSinceLastActivity = (Date.now() - lastActivity) / (60 * 60 * 1000);
      
      // Proactively refresh token after 30 minutes of inactivity
      const shouldRefresh = hoursSinceLastActivity > 0.5;
      
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