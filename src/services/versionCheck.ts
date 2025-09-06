import { Platform, Alert, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getClientConfig } from '../config/client-config';
import { apiService } from './api';

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  updateUrl: string;
  forceUpdate: boolean;
  updateMessage?: string;
}

export interface AuthUserResponse {
  end_user_app_version?: string;
  [key: string]: any;
}

class VersionCheckService {
  private static instance: VersionCheckService;
  private isChecking = false;

  static getInstance(): VersionCheckService {
    if (!VersionCheckService.instance) {
      VersionCheckService.instance = new VersionCheckService();
    }
    return VersionCheckService.instance;
  }

  /**
   * Get current app version
   */
  async getCurrentVersion(): Promise<string> {
    try {
      return await DeviceInfo.getVersion();
    } catch (error) {
      console.error('Error getting current version:', error);
      return '1.0.0';
    }
  }

  /**
   * Get build number
   */
  async getBuildNumber(): Promise<string> {
    try {
      return await DeviceInfo.getBuildNumber();
    } catch (error) {
      console.error('Error getting build number:', error);
      return '1';
    }
  }

  /**
   * Check for app updates from server using existing authUser API
   */
  async checkForUpdates(): Promise<VersionInfo | null> {
    if (this.isChecking) {
      console.log('Version check already in progress');
      return null;
    }

    try {
      this.isChecking = true;
      
      const isIOS = Platform.OS === 'ios';
      const currentVersion = isIOS ? await this.getCurrentVersion() : await this.getBuildNumber();
      
      // Get username from session manager
      const username = await this.getCurrentUsername();
      if (!username) {
        console.log('No username found for version check');
        return null;
      }

      // Get version info from authUser API
      const authData = await apiService.authUser(username);
      
      // Parse the end_user_app_version JSON string
      let versionData = null;
      if (authData.end_user_app_version) {
        try {
          versionData = JSON.parse(authData.end_user_app_version);
          console.log('Parsed version data from end_user_app_version:', versionData);
          console.log('Available version fields:', Object.keys(versionData));
        } catch (parseError) {
          console.error('Error parsing end_user_app_version:', parseError);
          return null;
        }
      }

      if (!versionData) {
        console.log('No version data found in end_user_app_version');
        return null;
      }
      
      // Check if current version is in the allowed versions list
      const allowedVersions = [
        versionData.androidAppVersion,
        versionData.iOSAppVersion,
        versionData.androidBetaAppVersion,
        versionData.iOSBetaAppVersion
      ].filter(Boolean); // Remove any undefined values
      
      const needsUpdate = !allowedVersions.includes(currentVersion.toString());
      
      console.log('Version comparison result:', {
        currentVersion,
        allowedVersions,
        needsUpdate,
        isIOS,
        versionData: {
          androidAppVersion: versionData.androidAppVersion,
          iOSAppVersion: versionData.iOSAppVersion,
          androidBetaAppVersion: versionData.androidBetaAppVersion,
          iOSBetaAppVersion: versionData.iOSBetaAppVersion
        }
      });

      if (needsUpdate) {
        const updateUrl = this.getStoreUrl();
        
        console.log('Update needed, returning version info:', {
          currentVersion,
          latestVersion: serverVersion,
          needsUpdate,
          updateUrl,
          forceUpdate: true
        });
        
        return {
          currentVersion,
          latestVersion: serverVersion,
          needsUpdate,
          updateUrl,
          forceUpdate: true, // Mandatory update - no "Later" option
          updateMessage: 'A new version is available. Please update to continue using the app.'
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Get version information from authUser API response
   */
  private async getVersionFromAuthUser(): Promise<{
    serverVersion: string;
    betaVersion?: string;
    showUpdateDialog: boolean;
  } | null> {
    try {
      // Get username from session manager
      const username = await this.getCurrentUsername();
      if (!username) {
        console.log('No username found for version check');
        return null;
      }

      // Call authUser API
      const authData = await apiService.authUser(username);
      
      // Parse the end_user_app_version JSON string
      let versionData = null;
      if (authData.end_user_app_version) {
        try {
          versionData = JSON.parse(authData.end_user_app_version);
          console.log('Parsed version data from end_user_app_version:', versionData);
          console.log('Available version fields:', Object.keys(versionData));
        } catch (parseError) {
          console.error('Error parsing end_user_app_version:', parseError);
          return null;
        }
      }

      if (!versionData) {
        console.log('No version data found in end_user_app_version');
        return null;
      }

      const isIOS = Platform.OS === 'ios';
      const serverVersion = isIOS ? versionData.iOSAppVersion : versionData.androidAppVersion;
      const betaVersion = isIOS ? versionData.iOSBetaAppVersion : versionData.androidBetaAppVersion;
      
      // Check if update is needed by comparing versions
      const currentVersion = isIOS ? await this.getCurrentVersion() : await this.getBuildNumber();
      const needsUpdate = serverVersion && serverVersion.toString() !== currentVersion.toString();
      
      console.log('Version comparison:', {
        currentVersion,
        serverVersion,
        betaVersion,
        needsUpdate,
        isIOS
      });

      if (!serverVersion) {
        console.log('No server version found in version data');
        return null;
      }

      return {
        serverVersion,
        betaVersion,
        showUpdateDialog: needsUpdate
      };
    } catch (error) {
      console.error('Error fetching version from authUser API:', error);
      return null;
    }
  }

  /**
   * Get current username from session manager
   */
  private async getCurrentUsername(): Promise<string | null> {
    try {
      // Import sessionManager dynamically to avoid circular dependencies
      const sessionManager = require('./sessionManager').default;
      return await sessionManager.getUsername();
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  }

  /**
   * Compare two version strings
   * Returns: -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    const maxLength = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  /**
   * Get store URL based on platform
   */
  private getStoreUrl(): string {
    const clientConfig = getClientConfig();
    const versionCheckConfig = clientConfig.versionCheck;
    
    if (Platform.OS === 'ios') {
      return versionCheckConfig?.appStoreId 
        ? `https://apps.apple.com/app/id${versionCheckConfig.appStoreId}`
        : 'https://apps.apple.com/in/app/dna-broadband/id1559045355';
    } else {
      return versionCheckConfig?.packageName 
        ? `https://play.google.com/store/apps/details?id=${versionCheckConfig.packageName}`
        : 'https://play.google.com/store/apps/details?id=com.h8.dnasubscriber&hl=en_IN';
    }
  }

  /**
   * Show update dialog
   */
  showUpdateDialog(versionInfo: VersionInfo): void {
    const { latestVersion, updateUrl, forceUpdate, updateMessage } = versionInfo;
    
    const title = forceUpdate ? 'Update Required' : 'Update Available';
    const message = updateMessage || 
      `A new version (${latestVersion}) is available. Please update to continue using the app.`;
    
    const buttons: any[] = [
      {
        text: 'Update Now',
        onPress: async () => {
          await this.openStore(updateUrl);
        },
      },
      {
        text: 'Later',
        onPress: () => {
          console.log('User chose to update later');
          // User can continue with current app version
        },
      },
    ];

    Alert.alert(title, message, buttons, { cancelable: true });
  }

  /**
   * Open store URL
   */
  async openStore(url: string): Promise<void> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open store URL:', url);
        Alert.alert('Error', 'Cannot open store. Please update manually from your app store.');
      }
    } catch (error) {
      console.error('Error opening store:', error);
      Alert.alert('Error', 'Cannot open store. Please update manually from your app store.');
    }
  }

  /**
   * Check for updates and show dialog if needed
   */
  async checkAndShowUpdateDialog(): Promise<boolean> {
    try {
      const versionInfo = await this.checkForUpdates();
      
      if (versionInfo && versionInfo.needsUpdate) {
        // Don't show dialog here - let the modal system handle it
        // The useVersionCheck hook will handle showing the UpdateModal
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in checkAndShowUpdateDialog:', error);
      return false;
    }
  }

  /**
   * Check for updates silently (for background checks)
   */
  async checkSilently(): Promise<boolean> {
    try {
      const versionInfo = await this.checkForUpdates();
      return versionInfo ? versionInfo.needsUpdate : false;
    } catch (error) {
      console.error('Error in silent check:', error);
      return false;
    }
  }
}

export default VersionCheckService.getInstance();
