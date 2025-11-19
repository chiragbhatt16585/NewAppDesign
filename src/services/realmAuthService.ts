import { realmApi } from './realmDatabase';
import { apiService } from './api';
import clientConfig from '../config/client-config';

export interface UserSession {
  username: string;
  token: string;
  lastActivityTime: number;
}

export class RealmAuthService {
  private static instance: RealmAuthService;
  private realm: any = null;

  private constructor() {}

  static getInstance(): RealmAuthService {
    if (!RealmAuthService.instance) {
      RealmAuthService.instance = new RealmAuthService();
    }
    return RealmAuthService.instance;
  }

  setRealm(realm: any) {
    this.realm = realm;
  }

  // Login with username and password
  async login(username: string, password: string): Promise<boolean> {
    try {
      console.log('=== REALM AUTH: LOGIN ATTEMPT ===');
      console.log('Username:', username);

      if (!this.realm) {
        console.error('Realm not initialized');
        return false;
      }

      // Call API to authenticate
      const response = await apiService.authenticate(username, password);
      
      if (response && response.token) {
        console.log('=== REALM AUTH: LOGIN SUCCESS ===');
        
        // Save credentials to Realm
        realmApi.saveCredentials(this.realm, username, password, response.token);
        
        // Save user session to Realm
        realmApi.saveUserSession(this.realm, username, response.token);
        
        // Save client configuration
        const currentClient = clientConfig.getCurrentClient();
        realmApi.saveClientConfig(
          this.realm, 
          currentClient.name, 
          currentClient.apiUrl, 
          currentClient.displayName
        );
        
        console.log('User data saved to Realm successfully');
        return true;
      } else {
        console.log('=== REALM AUTH: LOGIN FAILED - NO TOKEN ===');
        return false;
      }
    } catch (error: any) {
      console.error('=== REALM AUTH: LOGIN ERROR ===');
      console.error('Error:', error);
      return false;
    }
  }

  // Login with OTP
  async loginWithOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      console.log('=== REALM AUTH: OTP LOGIN ATTEMPT ===');
      console.log('Phone:', phoneNumber);

      if (!this.realm) {
        console.error('Realm not initialized');
        return false;
      }

      // Call API to authenticate with OTP
      const response = await apiService.authenticate('', '', otp, 'no', phoneNumber);
      
      if (response && response.token) {
        console.log('=== REALM AUTH: OTP LOGIN SUCCESS ===');
        
        // Save user session to Realm (no password for OTP login)
        realmApi.saveUserSession(this.realm, phoneNumber, response.token);
        
        // Save client configuration
        const currentClient = clientConfig.getCurrentClient();
        realmApi.saveClientConfig(
          this.realm, 
          currentClient.name, 
          currentClient.apiUrl, 
          currentClient.displayName
        );
        
        console.log('User data saved to Realm successfully');
        return true;
      } else {
        console.log('=== REALM AUTH: OTP LOGIN FAILED - NO TOKEN ===');
        return false;
      }
    } catch (error: any) {
      console.error('=== REALM AUTH: OTP LOGIN ERROR ===');
      console.error('Error:', error);
      return false;
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      if (!this.realm) {
        console.error('Realm not initialized');
        return false;
      }

      const isLoggedIn = realmApi.isUserLoggedIn(this.realm);
      console.log('=== REALM AUTH: IS LOGGED IN ===', isLoggedIn);
      return isLoggedIn;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Get current user session
  async getCurrentSession(): Promise<UserSession | null> {
    try {
      if (!this.realm) {
        console.error('Realm not initialized');
        return null;
      }

      const user = realmApi.getCurrentUser(this.realm);
      console.log('=== REALM AUTH: GET CURRENT SESSION ===', user);
      return user;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Get authentication token
  async getToken(): Promise<string | null> {
    try {
      if (!this.realm) {
        console.error('Realm not initialized');
        return null;
      }

      const session = realmApi.getUserSession(this.realm);
      const token = session ? (session as any).token : null;
      console.log('=== REALM AUTH: GET TOKEN ===', token ? 'Token exists' : 'No token');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Get username
  async getUsername(): Promise<string | null> {
    try {
      if (!this.realm) {
        console.error('Realm not initialized');
        return null;
      }

      const credentials = realmApi.getCredentials(this.realm);
      const username = credentials ? (credentials as any).username : null;
      console.log('=== REALM AUTH: GET USERNAME ===', username);
      return username;
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  }

  // Update session activity
  async updateActivityTime(): Promise<void> {
    try {
      if (!this.realm) {
        console.error('Realm not initialized');
        return;
      }

      realmApi.updateSessionActivity(this.realm);
      console.log('=== REALM AUTH: ACTIVITY UPDATED ===');
    } catch (error) {
      console.error('Error updating activity time:', error);
    }
  }

  // Regenerate token using stored credentials
  async regenerateToken(): Promise<string | false> {
    try {
      console.log('=== REALM AUTH: REGENERATING TOKEN ===');

      if (!this.realm) {
        console.error('Realm not initialized');
        return false;
      }

      const credentials = realmApi.getCredentials(this.realm);
      if (!credentials) {
        console.log('No credentials found in Realm');
        return false;
      }

      const { username, password } = credentials as any;
      
      // Call API to regenerate token
      const response = await apiService.authenticate(username, password);
      
      if (response && response.token) {
        console.log('Token regenerated successfully');
        
        // Update session with new token
        realmApi.saveUserSession(this.realm, username, response.token);
        realmApi.updateSessionActivity(this.realm);
        
        return response.token;
      } else {
        console.log('Token regeneration failed');
        return false;
      }
    } catch (error: any) {
      console.error('Error regenerating token:', error);
      return false;
    }
  }

  // Update token
  async updateToken(newToken: string): Promise<void> {
    try {
      if (!this.realm) {
        console.error('Realm not initialized');
        return;
      }

      const session = realmApi.getUserSession(this.realm);
      if (session) {
        this.realm.write(() => {
          (session as any).token = newToken;
          (session as any).lastActivityTime = Date.now();
        });
        console.log('=== REALM AUTH: TOKEN UPDATED ===');
      }
    } catch (error) {
      console.error('Error updating token:', error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      console.log('=== REALM AUTH: LOGOUT ===');

      if (!this.realm) {
        console.log('Realm not initialized - skipping Realm cleanup (this is normal if Realm was never used)');
        return;
      }

      // Check if realm is closed or invalid
      if (this.realm.isClosed) {
        console.log('Realm is closed - skipping Realm cleanup');
        return;
      }

      // Clear all data from Realm
      try {
        realmApi.clearAllData(this.realm);
        console.log('User logged out and data cleared from Realm');
      } catch (realmError: any) {
        // If Realm operations fail, log but don't throw - logout should still succeed
        console.warn('Error clearing Realm data (non-critical):', realmError?.message || realmError);
      }
    } catch (error) {
      // Log error but don't throw - logout should always succeed even if Realm cleanup fails
      console.warn('Error during Realm logout (non-critical):', error);
    }
  }

  // Clear session only (keep credentials)
  async clearSession(): Promise<void> {
    try {
      console.log('=== REALM AUTH: CLEAR SESSION ===');

      if (!this.realm) {
        console.error('Realm not initialized');
        return;
      }

      // Clear only session data, keep credentials
      realmApi.deleteUserSession(this.realm);
      
      console.log('Session cleared from Realm');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Diagnose and fix authentication issues
  async diagnoseAndFixAuth(): Promise<{ needsReset: boolean; issues: string[] }> {
    try {
      console.log('=== REALM AUTH: DIAGNOSING ===');
      
      if (!this.realm) {
        return { needsReset: true, issues: ['Realm not initialized'] };
      }

      const issues: string[] = [];
      let needsReset = false;

      // Check credentials
      const credentials = realmApi.getCredentials(this.realm);
      if (!credentials) {
        issues.push('No credentials found');
        needsReset = true;
      } else {
        if (!(credentials as any).username) {
          issues.push('Credentials missing username');
          needsReset = true;
        }
        if (!(credentials as any).Authentication) {
          issues.push('Credentials missing token');
          needsReset = true;
        }
      }

      // Check session
      const session = realmApi.getUserSession(this.realm);
      if (!session) {
        issues.push('No user session found');
        needsReset = true;
      } else {
        if (!(session as any).token) {
          issues.push('Session missing token');
          needsReset = true;
        }
        if (!(session as any).isActive) {
          issues.push('Session not active');
          needsReset = true;
        }
      }

      // Check if credentials and session match
      if (credentials && session) {
        const credUsername = (credentials as any).username;
        const sessionUsername = (session as any).username;
        if (credUsername !== sessionUsername) {
          issues.push('Username mismatch between credentials and session');
          needsReset = true;
        }
      }

      console.log('=== REALM AUTH: DIAGNOSIS COMPLETE ===', { needsReset, issues });
      return { needsReset, issues };
      
    } catch (error: any) {
      console.error('Error diagnosing auth:', error);
      return { needsReset: true, issues: ['Error during diagnosis'] };
    }
  }

  // Reset all authentication data
  async resetAuth(): Promise<void> {
    try {
      console.log('=== REALM AUTH: RESETTING ALL DATA ===');

      if (!this.realm) {
        console.error('Realm not initialized');
        return;
      }

      // Clear all data from Realm
      realmApi.clearAllData(this.realm);
      
      console.log('All authentication data cleared from Realm');
    } catch (error) {
      console.error('Error resetting auth:', error);
    }
  }
}

// Export singleton instance
export const realmAuthService = RealmAuthService.getInstance();
export default realmAuthService; 