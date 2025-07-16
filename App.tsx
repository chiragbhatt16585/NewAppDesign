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
import {testSessionValidation} from './src/services/sessionValidationTest';
import {debugSessionStatus} from './src/services/sessionDebugTest';
import {testSessionPersistence} from './src/services/sessionTest';
import {testKYCFunctionality} from './src/services/kycTest';
import {testClientConfiguration} from './src/services/clientConfigTest';
import './src/i18n';

function AppContent() {
  const {isDark} = useTheme();
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Add error boundary for AuthProvider

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Test credential storage functionality
      await testCredentialStorage();
      
      // Initialize session manager first
      await sessionManager.initialize();
      
      // Test session validation functionality
      await testSessionValidation();
      
      // Debug session status
      await debugSessionStatus();
      
      // Test session persistence
      await testSessionPersistence();
      
      // Test client configuration
      await testClientConfiguration();
      
      // Test KYC functionality
      await testKYCFunctionality();
      
      // Check if user is already logged in and session is valid
      const loggedIn = await sessionManager.isLoggedIn();
      
      if (loggedIn) {
        // Session is valid - proceed to app (no automatic logout)
        setIsLoggedIn(true);
        setIsAuthInitialized(true);
        return;
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
