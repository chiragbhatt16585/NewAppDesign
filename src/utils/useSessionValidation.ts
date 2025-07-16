import { useCallback } from 'react';
import { Alert } from 'react-native';
import sessionManager from '../services/sessionManager';
import { navigateToLogin } from './navigationUtils';

export const useSessionValidation = () => {
  const checkSessionAndHandle = useCallback(async (navigation: any): Promise<boolean> => {
    try {
      const sessionCheck = await sessionManager.checkSessionBeforeApiCall();
      
      if (!sessionCheck.isValid) {
        // Session validation failed - logging removed to prevent spam
        
        // Only show alert for complete session loss, not missing tokens
        if (sessionCheck.message.includes('No active session') || 
            sessionCheck.message.includes('Session validation failed')) {
          Alert.alert(
            'Authentication Required',
            sessionCheck.message,
            [
              {
                text: 'Login Again',
                style: 'destructive',
                onPress: () => {
                  navigateToLogin(navigation);
                }
              }
            ]
          );
          return false;
        }
        
        // For missing tokens, don't show alert - let API handle regeneration
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      Alert.alert(
        'Authentication Error',
        'Please login again to continue.',
        [
          {
            text: 'Login Again',
            style: 'destructive',
            onPress: () => {
              navigateToLogin(navigation);
            }
          }
        ]
      );
      return false;
    }
  }, []);

  const validateSessionBeforeAction = useCallback(async (
    navigation: any, 
    action: () => Promise<void>,
    errorMessage: string = 'Failed to perform action'
  ): Promise<void> => {
    const isSessionValid = await checkSessionAndHandle(navigation);
    
    if (isSessionValid) {
      try {
        await action();
      } catch (error: any) {
        console.error('Action failed:', error);
        Alert.alert('Error', `${errorMessage}: ${error.message}`);
      }
    }
  }, [checkSessionAndHandle]);

  return {
    checkSessionAndHandle,
    validateSessionBeforeAction
  };
}; 