import { Alert } from 'react-native';
import sessionManager from './sessionManager';

export class SessionMonitor {
  private static instance: SessionMonitor;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes
  private readonly WARNING_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
  private readonly INACTIVITY_WARNING_DAYS = 6; // Warn after 6 days of inactivity

  private constructor() {}

  static getInstance(): SessionMonitor {
    if (!SessionMonitor.instance) {
      SessionMonitor.instance = new SessionMonitor();
    }
    return SessionMonitor.instance;
  }

  startMonitoring(): void {
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    this.checkInterval = setInterval(async () => {
      await this.checkSessionStatus();
    }, this.CHECK_INTERVAL);

    // Also check immediately
    this.checkSessionStatus();
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Call this method when user performs any action in the app
  async trackUserActivity(): Promise<void> {
    try {
      await sessionManager.updateActivityTime();
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  private async checkSessionStatus(): Promise<void> {
    try {
      const isLoggedIn = await sessionManager.isLoggedIn();
      if (!isLoggedIn) {
        return; // User is not logged in, no need to monitor
      }

      // Check for inactivity logout first
      const inactivityInfo = await sessionManager.getInactivityInfo();
      if (inactivityInfo.isInactive) {
        this.handleInactivityLogout();
        return;
      }

      // Check for inactivity warning
      const daysSinceLastActivity = await sessionManager.getDaysSinceLastActivity();
      if (daysSinceLastActivity >= this.INACTIVITY_WARNING_DAYS) {
        this.showInactivityWarning(daysSinceLastActivity);
      }

      // Check session expiry
      const sessionInfo = await sessionManager.getSessionExpiryInfo();
      if (sessionInfo.isExpiringSoon) {
        this.showSessionWarning(sessionInfo.hoursRemaining);
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  }

  private handleInactivityLogout(): void {
    Alert.alert(
      'Automatic Logout',
      'You have been automatically logged out due to 7 days of inactivity. Please login again to continue.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await sessionManager.clearSession();
            // You might want to navigate to login screen here
            console.log('User logged out due to inactivity');
          }
        }
      ]
    );
  }

  private showInactivityWarning(daysSinceLastActivity: number): void {
    const daysRemaining = 7 - daysSinceLastActivity;
    const message = `You haven't used the app for ${daysSinceLastActivity} days. You will be automatically logged out in ${daysRemaining} days if you don't use the app.`;

    Alert.alert(
      'Inactivity Warning',
      message,
      [
        {
          text: 'Continue Using App',
          onPress: async () => {
            await sessionManager.updateActivityTime();
            console.log('User activity updated');
          }
        },
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  }

  private showSessionWarning(hoursRemaining: number): void {
    let message = '';
    
    if (hoursRemaining <= 1) {
      message = 'Your session will expire in less than 1 hour. Please save your work and login again if needed.';
    } else if (hoursRemaining <= 6) {
      message = `Your session will expire in ${hoursRemaining} hours. Please save your work and login again if needed.`;
    } else {
      message = `Your session will expire in ${hoursRemaining} hours.`;
    }

    Alert.alert(
      'Session Expiry Warning',
      message,
      [
        {
          text: 'OK',
          onPress: () => console.log('User acknowledged session warning')
        }
      ]
    );
  }

  async checkSessionBeforeAction(): Promise<boolean> {
    try {
      // Check for inactivity first
      const inactivityInfo = await sessionManager.getInactivityInfo();
      if (inactivityInfo.isInactive) {
        Alert.alert(
          'Session Expired',
          'You have been logged out due to inactivity. Please login again to continue.',
          [
            {
              text: 'Login Again',
              style: 'destructive',
              onPress: async () => {
                await sessionManager.clearSession();
                // You might want to navigate to login screen here
              }
            }
          ]
        );
        return false;
      }

      // Check session expiry
      const sessionInfo = await sessionManager.getSessionExpiryInfo();
      if (sessionInfo.isExpiringSoon && sessionInfo.hoursRemaining <= 2) {
        Alert.alert(
          'Session Expiring Soon',
          'Your session will expire soon. Do you want to continue or login again?',
          [
            {
              text: 'Continue',
              style: 'default'
            },
            {
              text: 'Login Again',
              style: 'destructive',
              onPress: async () => {
                await sessionManager.clearSession();
                // You might want to navigate to login screen here
              }
            }
          ]
        );
        return true; // User chose to continue
      }
      
      return true; // Session is fine
    } catch (error) {
      console.error('Error checking session before action:', error);
      return true; // Default to allowing action
    }
  }

  // Method to get inactivity status for display
  async getInactivityStatus(): Promise<{
    daysSinceLastActivity: number;
    daysUntilLogout: number;
    isInactive: boolean;
  }> {
    try {
      const daysSinceLastActivity = await sessionManager.getDaysSinceLastActivity();
      const daysUntilLogout = Math.max(0, 7 - daysSinceLastActivity);
      const isInactive = daysSinceLastActivity >= 7;

      return {
        daysSinceLastActivity,
        daysUntilLogout,
        isInactive
      };
    } catch (error) {
      console.error('Error getting inactivity status:', error);
      return {
        daysSinceLastActivity: 0,
        daysUntilLogout: 7,
        isInactive: false
      };
    }
  }
}

export default SessionMonitor.getInstance(); 