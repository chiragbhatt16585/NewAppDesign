import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import sessionMonitor from '../services/sessionMonitor';

/**
 * Hook to track user activity in React Native components
 * Automatically updates activity time when component is mounted and when app becomes active
 */
export const useActivityTracker = () => {
  // Track activity when component mounts
  useEffect(() => {
    sessionMonitor.trackUserActivity();
  }, []);

  // Function to manually track activity (call this on user interactions)
  const trackActivity = useCallback(async () => {
    await sessionMonitor.trackUserActivity();
  }, []);

  return { trackActivity };
};

/**
 * Hook to track user activity with automatic tracking when app becomes active
 * @param enabled - Whether to enable automatic tracking
 */
export const useAutoActivityTracker = (enabled: boolean = true) => {
  const { trackActivity } = useActivityTracker();

  useEffect(() => {
    if (!enabled) return;

    // Track activity on mount
    trackActivity();

    // Track activity when app becomes active
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        trackActivity();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [enabled, trackActivity]);

  return { trackActivity };
}; 