import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import autoDataReloader from '../services/autoDataReloader';
import sessionManager from '../services/sessionManager';

export interface UseAutoDataReloadOptions {
  enabled?: boolean;
  onReloadStart?: () => void;
  onReloadSuccess?: (data: any) => void;
  onReloadError?: (error: string) => void;
  backgroundThresholdHours?: number;
}

export const useAutoDataReload = (options: UseAutoDataReloadOptions = {}) => {
  const {
    enabled = true,
    onReloadStart,
    onReloadError,
    onReloadSuccess,
    backgroundThresholdHours = 4
  } = options;

  // Manual reload function
  const reloadData = useCallback(async () => {
    try {
      if (onReloadStart) onReloadStart();
      
      const result = await autoDataReloader.autoReloadUserData();
      
      if (result.success) {
        if (onReloadSuccess) onReloadSuccess(result.data);
        console.log('✅ Manual data reload successful');
      } else {
        if (onReloadError) onReloadError(result.message);
        console.log('❌ Manual data reload failed:', result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (onReloadError) onReloadError(errorMessage);
      console.error('Error during manual data reload:', error);
      return { success: false, message: errorMessage };
    }
  }, [onReloadStart, onReloadSuccess, onReloadError]);

  // Check if reload is needed
  const checkIfReloadNeeded = useCallback(async () => {
    try {
      const shouldReload = await autoDataReloader.shouldAutoReload();
      return shouldReload;
    } catch (error) {
      console.error('Error checking if reload needed:', error);
      return false;
    }
  }, []);

  // Handle app state changes for background/foreground detection
  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active, check if we need to reload
        const isLoggedIn = await sessionManager.isLoggedIn();
        if (isLoggedIn) {
          const shouldReload = await checkIfReloadNeeded();
          if (shouldReload) {
            console.log('App became active and reload is needed, triggering auto reload');
            await reloadData();
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [enabled, reloadData, checkIfReloadNeeded]);

  return {
    reloadData,
    checkIfReloadNeeded,
    autoDataReloader
  };
};

// Hook for screens that need to reload data when they come into focus
export const useScreenDataReload = (options: UseAutoDataReloadOptions = {}) => {
  const { reloadData, checkIfReloadNeeded } = useAutoDataReload(options);

  const reloadOnFocus = useCallback(async () => {
    try {
      const shouldReload = await checkIfReloadNeeded();
      if (shouldReload) {
        console.log('Screen focused and reload is needed, triggering reload');
        await reloadData();
      }
    } catch (error) {
      console.error('Error during screen focus reload:', error);
    }
  }, [reloadData, checkIfReloadNeeded]);

  return {
    reloadData,
    reloadOnFocus,
    checkIfReloadNeeded
  };
}; 