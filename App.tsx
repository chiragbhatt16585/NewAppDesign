  /**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import BiometricAuthScreen from './src/screens/BiometricAuthScreen';
import {ThemeProvider, useTheme} from './src/utils/ThemeContext';
import {LanguageProvider} from './src/utils/LanguageContext';
import {AuthProvider} from './src/utils/AuthContext';
import biometricAuthService from './src/services/biometricAuth';
import sessionManager from './src/services/sessionManager';
import testCredentialStorage from './src/services/credentialStorageTest';
import './src/i18n';

function AppContent() {
  const {isDark} = useTheme();
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Add error boundary for AuthProvider
  console.log('AppContent rendering, AuthProvider should be available');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Test credential storage functionality
      console.log('Testing credential storage...');
      await testCredentialStorage();
      
      // Initialize session manager first
      await sessionManager.initialize();
      
      // Check if user is already logged in and session is valid
      const loggedIn = await sessionManager.isLoggedIn();
      
      if (loggedIn) {
        // Additional check: verify session is still valid by checking activity
        const session = await sessionManager.getCurrentSession();
        if (session) {
          const inactivityInfo = await sessionManager.getInactivityInfo();
          if (inactivityInfo.isInactive) {
            console.log('Session expired due to inactivity, clearing session');
            await sessionManager.clearSession();
            setIsLoggedIn(false);
          } else {
            console.log('User is already logged in, proceeding to app');
            setIsLoggedIn(true);
            setIsAuthInitialized(true);
            return;
          }
        } else {
          setIsLoggedIn(false);
        }
      }

      // If not logged in, check biometric auth
      await biometricAuthService.initialize();
      const isBiometricEnabled = await biometricAuthService.isAuthEnabled();
      
      if (isBiometricEnabled) {
        setShowBiometricAuth(true);
      } else {
        // No biometric auth, user will go to login screen
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // Fallback to login screen
      setIsLoggedIn(false);
    } finally {
      setIsAuthInitialized(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowBiometricAuth(false);
    setIsLoggedIn(true);
  };

  if (!isAuthInitialized) {
    return null; // Show loading state
  }

  if (showBiometricAuth) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <BiometricAuthScreen
          navigation={null}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator initialRoute={isLoggedIn ? undefined : 'Login'} />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
