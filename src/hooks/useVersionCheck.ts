import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import versionCheckService, { VersionInfo } from '../services/versionCheck';
import { getClientConfig } from '../config/client-config';

const VERSION_CHECK_KEY = 'last_version_check';
const VERSION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useVersionCheck = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [lastDismissedTime, setLastDismissedTime] = useState(0);

  const clientConfig = getClientConfig();
  const versionCheckConfig = clientConfig.versionCheck;

  // Check if version check is enabled
  const isVersionCheckEnabled = versionCheckConfig?.enabled ?? true;

  // Get check interval from config (in hours, convert to milliseconds)
  const checkInterval = (versionCheckConfig?.checkInterval ?? 24) * 60 * 60 * 1000;

  /**
   * Check if enough time has passed since last check
   */
  const shouldCheckVersion = useCallback(async (): Promise<boolean> => {
    try {
      const lastCheck = await AsyncStorage.getItem(VERSION_CHECK_KEY);
      if (!lastCheck) return true;

      const lastCheckTime = parseInt(lastCheck, 10);
      const now = Date.now();
      
      return (now - lastCheckTime) >= checkInterval;
    } catch (error) {
      console.error('Error checking last version check time:', error);
      return true; // If error, allow check
    }
  }, [checkInterval]);

  /**
   * Update last check time
   */
  const updateLastCheckTime = useCallback(async () => {
    try {
      await AsyncStorage.setItem(VERSION_CHECK_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error updating last check time:', error);
    }
  }, []);

  /**
   * Perform version check
   */
  const checkForUpdates = useCallback(async (showModal: boolean = true) => {
    if (!isVersionCheckEnabled || isChecking) return;

    try {
      setIsChecking(true);
      const versionInfo = await versionCheckService.checkForUpdates();
      
      if (versionInfo && versionInfo.needsUpdate) {
        setVersionInfo(versionInfo);
        if (showModal) {
          setShowUpdateModal(true);
        }
      }
      
      await updateLastCheckTime();
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isVersionCheckEnabled, isChecking, updateLastCheckTime]);

  /**
   * Check for updates on app state change (when app comes to foreground)
   */
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && isVersionCheckEnabled) {
      const shouldCheck = await shouldCheckVersion();
      if (shouldCheck) {
        checkForUpdates(true);
      }
    }
  }, [isVersionCheckEnabled, shouldCheckVersion, checkForUpdates]);

  /**
   * Handle update button press
   */
  const handleUpdate = useCallback(() => {
    if (versionInfo) {
      versionCheckService.openStore(versionInfo.updateUrl);
    }
  }, [versionInfo]);


  /**
   * Close update modal
   */
  const closeUpdateModal = useCallback(() => {
    setShowUpdateModal(false);
  }, []);

  /**
   * Force check for updates (manual check)
   */
  const forceCheckForUpdates = useCallback(() => {
    checkForUpdates(true);
  }, [checkForUpdates]);

  // Set up app state listener
  useEffect(() => {
    if (!isVersionCheckEnabled) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check immediately on mount
    checkForUpdates(true);

    return () => {
      subscription?.remove();
    };
  }, [isVersionCheckEnabled, handleAppStateChange]); // Removed checkForUpdates from dependencies

  return {
    versionInfo,
    isChecking,
    showUpdateModal,
    isVersionCheckEnabled,
    checkForUpdates: forceCheckForUpdates,
    handleUpdate,
    closeUpdateModal,
  };
};
