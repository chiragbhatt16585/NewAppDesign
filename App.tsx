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
import autoDataReloader from './src/services/autoDataReloader';
import testCredentialStorage from './src/services/credentialStorageTest';
import {testSessionValidation} from './src/services/sessionValidationTest';
import {debugSessionStatus} from './src/services/sessionDebugTest';
import {testSessionPersistence} from './src/services/sessionPersistenceTest';
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
      console.log('=== INITIALIZING APP ===');
      
      // Initialize session manager first
      await sessionManager.initialize();
      
      // Initialize auto data reloader (this sets up app state listeners)
      console.log('Initializing auto data reloader...');
      // The autoDataReloader is already initialized as a singleton
      
      // Test session persistence
      await testSessionPersistence();
      
      // Check if user is already logged in and session is valid
      const loggedIn = await sessionManager.isLoggedIn();
      console.log('App initialization - user logged in:', loggedIn);
      
      if (loggedIn) {
        // Session is valid - proceed to app (no automatic logout)
        console.log('✅ User is logged in, proceeding to app');
        
        // Trigger initial auto reload if needed
        const shouldReload = await autoDataReloader.shouldAutoReload();
        if (shouldReload) {
          console.log('Initial auto reload needed, triggering...');
          await autoDataReloader.autoReloadUserData();
        }
        
        setIsLoggedIn(true);
        setIsAuthInitialized(true);
        return;
      }

      console.log('❌ User is not logged in, checking biometric auth...');
      
      // If not logged in, check biometric auth
      await biometricAuthService.initialize();
      const isBiometricEnabled = await biometricAuthService.isAuthEnabled();
      
      if (isBiometricEnabled) {
        console.log('Biometric auth enabled, showing biometric screen');
        setShowBiometricAuth(true);
      } else {
        console.log('No biometric auth, user will go to login screen');
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
