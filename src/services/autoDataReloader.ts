import { apiService } from './api';
import sessionManager from './sessionManager';
import { AppState, AppStateStatus } from 'react-native';

export interface AutoReloadResult {
  success: boolean;
  message: string;
  data?: any;
}

export class AutoDataReloader {
  private static instance: AutoDataReloader;
  private appStateSubscription: any = null;
  private lastBackgroundTime: number = 0;
  private readonly BACKGROUND_THRESHOLD_HOURS = 4; // Reload after 4 hours in background
  
  private constructor() {
    this.initializeAppStateListener();
  }
  
  static getInstance(): AutoDataReloader {
    if (!AutoDataReloader.instance) {
      AutoDataReloader.instance = new AutoDataReloader();
    }
    return AutoDataReloader.instance;
  }

  private initializeAppStateListener(): void {
    // Remove existing listener if any
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    try {
      console.log('=== APP STATE CHANGE ===', nextAppState);
      
      if (nextAppState === 'background') {
        // App is going to background, record the time
        this.lastBackgroundTime = Date.now();
        console.log('App going to background, recording time:', new Date(this.lastBackgroundTime).toISOString());
      } else if (nextAppState === 'active') {
        // App is becoming active, check if we need to reload data
        await this.checkAndReloadOnAppActive();
      }
    } catch (error) {
      console.error('Error handling app state change:', error);
    }
  }

  private async checkAndReloadOnAppActive(): Promise<void> {
    try {
      // Check if user is logged in
      const isLoggedIn = await sessionManager.isLoggedIn();
      if (!isLoggedIn) {
        console.log('User not logged in, skipping background reload check');
        return;
      }

      // Check if enough time has passed since going to background
      const timeInBackground = Date.now() - this.lastBackgroundTime;
      const hoursInBackground = timeInBackground / (60 * 60 * 1000);
      
      console.log('Time in background:', {
        hours: Math.round(hoursInBackground * 100) / 100,
        threshold: this.BACKGROUND_THRESHOLD_HOURS
      });

      if (hoursInBackground >= this.BACKGROUND_THRESHOLD_HOURS) {
        console.log('App was in background for', Math.round(hoursInBackground), 'hours, triggering auto reload');
        await this.autoReloadUserData();
      } else {
        console.log('App was in background for less than', this.BACKGROUND_THRESHOLD_HOURS, 'hours, skipping reload');
      }
    } catch (error) {
      console.error('Error checking and reloading on app active:', error);
    }
  }

  // Automatically reload user data when app opens
  async autoReloadUserData(): Promise<AutoReloadResult> {
    try {
      console.log('=== AUTO RELOADING USER DATA ===');
      
      // Check if user is logged in
      const isLoggedIn = await sessionManager.isLoggedIn();
      if (!isLoggedIn) {
        console.log('User not logged in, skipping auto reload');
        return { success: false, message: 'User not logged in' };
      }

      const session = await sessionManager.getCurrentSession();
      if (!session) {
        console.log('No session found, skipping auto reload');
        return { success: false, message: 'No session found' };
      }

      console.log('Auto reloading data for user:', session.username);

      // Check if session needs refresh
      const shouldRefresh = await sessionManager.shouldAutoRefresh();
      if (shouldRefresh) {
        console.log('Session needs refresh, refreshing first...');
        const refreshResult = await sessionManager.autoRefreshSession();
        
        if (!refreshResult.success) {
          console.log('Session refresh failed, but continuing with data reload');
        }
      }

      // Reload user account data
      const accountData = await this.reloadAccountData();
      
      // Reload user data
      const userData = await this.reloadUserData();

      // Check if at least one data reload was successful
      const hasAccountData = accountData !== null;
      const hasUserData = userData !== null;
      
      if (hasAccountData || hasUserData) {
        console.log('✅ Auto reload completed successfully');
        console.log('Account data loaded:', hasAccountData);
        console.log('User data loaded:', hasUserData);
        
        return {
          success: true,
          message: 'Data reloaded successfully',
          data: {
            account: accountData,
            user: userData
          }
        };
      } else {
        console.log('❌ Auto reload failed - no data could be loaded');
        return {
          success: false,
          message: 'Failed to reload any data'
        };
      }

    } catch (error) {
      console.error('Error during auto reload:', error);
      return { success: false, message: 'Error reloading data' };
    }
  }

  // Reload account details
  private async reloadAccountData(): Promise<any> {
    try {
      console.log('Reloading account data...');
      
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        console.log('No session found for account data reload');
        return null;
      }

      console.log('Reloading account data for user:', session.username);
      const accountData = await apiService.authUser(session.username);

      console.log('✅ Account data reloaded successfully');
      return accountData;
    } catch (error: any) {
      console.error('Error reloading account data:', error.message || error);
      
      // Check if it's a session expiration error
      if (error.message && error.message.includes('Session expired')) {
        console.log('Session expired during account data reload, attempting to continue...');
        // Don't return null immediately, let the process continue
      }
      
      return null;
    }
  }

  // Reload user data
  private async reloadUserData(): Promise<any> {
    try {
      console.log('Reloading user data...');
      
      const userData = await apiService.getUserData();
      
      console.log('✅ User data reloaded successfully');
      return userData;
    } catch (error: any) {
      console.error('Error reloading user data:', error.message || error);
      
      // Check if it's a session expiration error
      if (error.message && error.message.includes('Session expired')) {
        console.log('Session expired during user data reload, attempting to continue...');
        // Don't return null immediately, let the process continue
      }
      
      return null;
    }
  }

  // Check if auto reload is needed
  async shouldAutoReload(): Promise<boolean> {
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session) return false;

      // Auto reload if more than 2 hours since last activity
      const lastActivity = session.lastActivityTime || 0;
      const hoursSinceLastActivity = (Date.now() - lastActivity) / (60 * 60 * 1000);
      
      const shouldReload = hoursSinceLastActivity > 2; // Reload if more than 2 hours
      
      console.log('Auto reload check:', {
        hoursSinceLastActivity: Math.round(hoursSinceLastActivity),
        shouldReload
      });
      
      return shouldReload;
    } catch (error) {
      console.error('Error checking if should auto reload:', error);
      return false;
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

export default AutoDataReloader.getInstance(); 