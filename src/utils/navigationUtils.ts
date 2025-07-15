import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Navigate to login screen and clear navigation state
 * This ensures that when the user logs in again, they start from a clean state
 */
export const navigateToLogin = async (navigation: any) => {
  try {
    // Clear navigation state to prevent redirecting to protected screens
    await AsyncStorage.removeItem('navigationState');
    console.log('Navigation state cleared before redirecting to login');
    
    // Navigate to login
    navigation.navigate('Login');
  } catch (error) {
    console.error('Error clearing navigation state:', error);
    // Still navigate to login even if clearing state fails
    navigation.navigate('Login');
  }
};

/**
 * Clear navigation state without navigating
 * Useful when logging out programmatically
 */
export const clearNavigationState = async () => {
  try {
    await AsyncStorage.removeItem('navigationState');
    console.log('Navigation state cleared');
  } catch (error) {
    console.error('Error clearing navigation state:', error);
  }
}; 