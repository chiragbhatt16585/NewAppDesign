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
      // console.error('Error getting current version:', error);
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
      // console.error('Error getting build number:', error);
      return '1';
    }
  }

  private parseVersionField(raw: unknown): Record<string, any> | null {
    if (raw == null || raw === '') {
      return null;
    }

    if (typeof raw === 'object') {
      return raw as Record<string, any>;
    }

    if (typeof raw !== 'string') {
      return null;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        return JSON.parse(parsed);
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private extractVersionData(authData: AuthUserResponse): {
    versionData: Record<string, any>;
    versionSource: string;
  } | null {
    const versionData = this.parseVersionField(authData.end_user_app_version);
    if (versionData) {
      return { versionData, versionSource: 'end_user_app_version' };
    }

    return null;
  }

  /**
   * Check for app updates from server using existing authUser API
   */
  async checkForUpdates(options?: { forceRefresh?: boolean }): Promise<VersionInfo | null> {
    if (this.isChecking) {
      return null;
    }

    try {
      this.isChecking = true;
      
      const isIOS = Platform.OS === 'ios';
      const currentAppVersion = await this.getCurrentVersion();
      const currentBuildNumber = await this.getBuildNumber();
      
      // Get username from session manager
      const username = await this.getCurrentUsername();
      if (!username) {
        return null;
      }

      if (options?.forceRefresh) {
        apiService.clearAuthUserCache();
      }

      // Get version info from authUser API
      const authData = await apiService.authUser(username);
      const extracted = this.extractVersionData(authData);

      if (!extracted) {
        if (__DEV__) {
          console.log('[VersionCheck] No version data in authUser response');
        }
        return null;
      }

      const { versionData, versionSource } = extracted;

      // Use only stable production keys for update checks.
      // Beta keys should not affect production apps.
      const serverVersionForCompare = this.getStableServerVersion(versionData, isIOS);
      // console.log('🔎 VersionCheck compare input:', {
      //   platform: Platform.OS,
      //   currentAppVersion,
      //   currentBuildNumber,
      //   serverVersionForCompare,
      //   androidAppVersion: versionData?.androidAppVersion,
      //   androidBetaAppVersion: versionData?.androidBetaAppVersion,
      //   iOSAppVersion: versionData?.iOSAppVersion,
      //   iOSBetaAppVersion: versionData?.iOSBetaAppVersion,
      // });

      // console.log('Version check details:', {
      //   isIOS,
      //   currentVersion,
      //   serverVersionRawForCompare,
      //   serverVersionForCompare,
      //   iOSAppVersion: versionData.iOSAppVersion,
      //   iOSBetaAppVersion: versionData.iOSBetaAppVersion,
      //   androidAppVersion: versionData.androidAppVersion,
      //   androidBetaAppVersion: versionData.androidBetaAppVersion
      // });

      // Decide if update is needed based on platform-specific comparison
      let needsUpdate = false;
      let currentVersionForResult = isIOS ? currentAppVersion : currentBuildNumber;
      if (isIOS) {
        const comparisonResult = this.compareVersions(
          currentAppVersion.toString(),
          serverVersionForCompare,
        );
        needsUpdate = serverVersionForCompare !== '' && comparisonResult < 0;
        // console.log('🔎 VersionCheck iOS decision:', {
        //   current: currentAppVersion.toString(),
        //   server: serverVersionForCompare,
        //   comparisonResult,
        //   needsUpdate,
        // });
        
        // console.log('iOS Version comparison:', {
        //   currentVersion: currentVersion.toString(),
        //   serverVersion: serverVersionForCompare,
        //   comparisonResult,
        //   needsUpdate,
        //   currentVersionType: typeof currentVersion,
        //   serverVersionType: typeof serverVersionForCompare
        // });
      } else {
        // Android backend values may be either build number (e.g. "14")
        // or semantic version (e.g. "1.0.1"). Compare accordingly.
        if (this.isSemanticVersion(serverVersionForCompare)) {
          const comparisonResult = this.compareVersions(
            currentAppVersion.toString(),
            serverVersionForCompare,
          );
          needsUpdate = serverVersionForCompare !== '' && comparisonResult < 0;
          currentVersionForResult = currentAppVersion;
          // console.log('🔎 VersionCheck Android semantic decision:', {
          //   currentVersion: currentAppVersion.toString(),
          //   serverVersion: serverVersionForCompare,
          //   comparisonResult,
          //   needsUpdate,
          // });
        } else {
          const currentBuild = Number(currentBuildNumber);
          const serverBuild = Number(serverVersionForCompare);
          needsUpdate =
            !Number.isNaN(currentBuild) &&
            !Number.isNaN(serverBuild) &&
            currentBuild < serverBuild;
          currentVersionForResult = currentBuildNumber;
          // console.log('🔎 VersionCheck Android build decision:', {
          //   currentBuildNumber,
          //   serverVersionForCompare,
          //   currentBuild,
          //   serverBuild,
          //   needsUpdate,
          // });
        }
        
        // console.log('Android Version comparison:', {
        //   currentVersion: currentVersion.toString(),
        //   serverVersion: serverVersionForCompare,
        //   currentBuild,
        //   serverBuild,
        //   needsUpdate
        // });
      }

      if (__DEV__) {
        console.log('[VersionCheck] decision:', {
          versionSource,
          platform: Platform.OS,
          currentAppVersion,
          currentBuildNumber,
          androidAppVersion: versionData?.androidAppVersion,
          androidBetaAppVersion: versionData?.androidBetaAppVersion,
          serverVersionForCompare,
          currentVersionForResult,
          needsUpdate,
        });
      }

      if (needsUpdate) {
        const serverVersion = this.getStableServerVersion(versionData, isIOS);
        const updateUrl = this.getStoreUrl();
        
        return {
          currentVersion: currentVersionForResult,
          latestVersion: serverVersion,
          needsUpdate,
          updateUrl,
          forceUpdate: true, // Mandatory update - no "Later" option
          updateMessage: 'A new version is available. Please update to continue using the app.'
        };
      }

      // console.log('✅ VersionCheck no update required:', {
      //   platform: Platform.OS,
      //   currentVersion: currentVersionForResult,
      //   serverVersion: serverVersionForCompare,
      // });

      return null;
    } catch (error) {
      // console.error('Error checking for updates:', error);
      return null;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Get stable (production) server version for current platform.
   */
  private getStableServerVersion(versionData: any, isIOS: boolean): string {
    const stableVersionRaw = isIOS
      ? versionData?.iOSAppVersion
      : versionData?.androidAppVersion;
    return stableVersionRaw != null ? String(stableVersionRaw).trim() : '';
  }

  /**
   * Returns true when version looks like semantic format (x.y or x.y.z ...)
   */
  private isSemanticVersion(version: string): boolean {
    return /^\d+(\.\d+)+$/.test((version || '').trim());
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
        // User is not logged in - this is expected, not an error
        // Version check will be performed after login
        return null;
      }

      // Call authUser API
      const authData = await apiService.authUser(username);
      const extracted = this.extractVersionData(authData);
      const versionData = extracted?.versionData ?? null;

      if (!versionData) {
        // console.log('No version data found in end_user_app_version');
        return null;
      }

      const isIOS = Platform.OS === 'ios';
      const serverVersion = isIOS ? versionData.iOSAppVersion : versionData.androidAppVersion;
      const betaVersion = isIOS ? versionData.iOSBetaAppVersion : versionData.androidBetaAppVersion;
      
      // Check if update is needed by comparing versions
      const currentVersion = isIOS ? await this.getCurrentVersion() : await this.getBuildNumber();
      const needsUpdate = serverVersion && serverVersion.toString() !== currentVersion.toString();
      
      // console.log('Version comparison:', {
      //   currentVersion,
      //   serverVersion,
      //   betaVersion,
      //   needsUpdate,
      //   isIOS
      // });

      if (!serverVersion) {
        // console.log('No server version found in version data');
        return null;
      }

      return {
        serverVersion,
        betaVersion,
        showUpdateDialog: needsUpdate
      };
    } catch (error) {
      // console.error('Error fetching version from authUser API:', error);
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
      
      // First check if user is logged in
      const isLoggedIn = await sessionManager.isLoggedIn();
      if (!isLoggedIn) {
        // User is not logged in, this is expected - don't log as error
        return null;
      }
      
      // Get username from session
      const username = await sessionManager.getUsername();
      return username;
    } catch (error) {
      // console.error('Error getting username:', error);
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
          // console.log('User chose to update later');
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
        // console.error('Cannot open store URL:', url);
        Alert.alert('Error', 'Cannot open store. Please update manually from your app store.');
      }
    } catch (error) {
      // console.error('Error opening store:', error);
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
      // console.error('Error in checkAndShowUpdateDialog:', error);
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
      // console.error('Error in silent check:', error);
      return false;
    }
  }
}

export default VersionCheckService.getInstance();
