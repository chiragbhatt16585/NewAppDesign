import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import versionCheckService from './versionCheck';
import { apiService } from './api';

/**
 * Debug function to help troubleshoot version check issues
 * Call this function to see detailed version comparison information
 */
export async function debugVersionCheck() {
  console.log('🔍 === VERSION CHECK DEBUG ===');
  
  try {
    // Get current app version
    const currentVersion = await DeviceInfo.getVersion();
    const buildNumber = await DeviceInfo.getBuildNumber();
    const isIOS = Platform.OS === 'ios';
    
    console.log('📱 Device Info:', {
      platform: Platform.OS,
      currentVersion,
      buildNumber,
      isIOS
    });

    // Get username for API call
    const sessionManager = require('./sessionManager').default;
    const username = await sessionManager.getUsername();
    
    if (!username) {
      console.log('❌ No username found - cannot check versions');
      return;
    }

    //console.log('👤 Username:', username);

    // Call authUser API to get version data
    const authData = await apiService.authUser(username);
    //console.log('🌐 API Response (end_user_app_version):', authData.end_user_app_version);

    // Parse version data
    let versionData = null;
    if (authData.end_user_app_version) {
      try {
        versionData = JSON.parse(authData.end_user_app_version);
        // console.log('📊 Parsed Version Data:', versionData);
        // console.log('🔑 Available Fields:', Object.keys(versionData));
      } catch (parseError) {
        //console.log('❌ Error parsing version data:', parseError);
        return;
      }
    }

    if (!versionData) {
      console.log('❌ No version data found');
      return;
    }

    // Show platform-specific versions
    if (isIOS) {
      console.log('🍎 iOS Versions:', {
        iOSAppVersion: versionData.iOSAppVersion,
        iOSBetaAppVersion: versionData.iOSBetaAppVersion,
        currentAppVersion: currentVersion
      });
    } else {
      console.log('🤖 Android Versions:', {
        androidAppVersion: versionData.androidAppVersion,
        androidBetaAppVersion: versionData.androidBetaAppVersion,
        currentBuildNumber: buildNumber
      });
    }

    // Test the version check service
    console.log('🧪 Testing version check service...');
    const versionInfo = await versionCheckService.checkForUpdates();
    
    if (versionInfo) {
      console.log('📋 Version Check Result:', {
        currentVersion: versionInfo.currentVersion,
        latestVersion: versionInfo.latestVersion,
        needsUpdate: versionInfo.needsUpdate,
        forceUpdate: versionInfo.forceUpdate,
        updateMessage: versionInfo.updateMessage
      });
    } else {
      console.log('✅ No update needed or version check failed');
    }

    // Manual comparison test
    console.log('🔬 Manual Comparison Test:');
    const serverVersionRaw = isIOS
      ? (versionData.iOSAppVersion ?? versionData.iOSBetaAppVersion)
      : (versionData.androidAppVersion ?? versionData.androidBetaAppVersion);
    
    const serverVersion = serverVersionRaw != null ? String(serverVersionRaw) : '';
    const currentVersionStr = isIOS ? currentVersion : buildNumber;
    
    console.log('📊 Manual Comparison:', {
      currentVersion: currentVersionStr,
      serverVersion: serverVersion,
      areEqual: currentVersionStr === serverVersion,
      currentType: typeof currentVersionStr,
      serverType: typeof serverVersion
    });

    // Test compareVersions function if iOS
    if (isIOS) {
      const comparisonResult = versionCheckService['compareVersions'](currentVersionStr, serverVersion);
      console.log('🔍 Version Comparison Result:', {
        current: currentVersionStr,
        server: serverVersion,
        comparisonResult,
        needsUpdate: comparisonResult < 0
      });
    }

  } catch (error) {
    console.error('❌ Debug version check failed:', error);
  }
  
  console.log('🔍 === END VERSION CHECK DEBUG ===');
}

/**
 * Quick test to see if versions are equal
 */
export async function quickVersionTest() {
  try {
    const currentVersion = await DeviceInfo.getVersion();
    const sessionManager = require('./sessionManager').default;
    const username = await sessionManager.getUsername();
    
    if (!username) {
      console.log('❌ No username');
      return;
    }

    const authData = await apiService.authUser(username);
    const versionData = JSON.parse(authData.end_user_app_version);
    
    const isIOS = Platform.OS === 'ios';
    const serverVersion = isIOS 
      ? (versionData.iOSAppVersion ?? versionData.iOSBetaAppVersion)
      : (versionData.androidAppVersion ?? versionData.androidBetaAppVersion);
    
    console.log('🚀 Quick Test:', {
      current: currentVersion,
      server: serverVersion,
      equal: currentVersion === String(serverVersion),
      platform: Platform.OS
    });
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}
