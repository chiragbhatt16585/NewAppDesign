  /**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import {StatusBar, AppState, View, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import BiometricAuthScreen from './src/screens/BiometricAuthScreen';
import {ThemeProvider, useTheme} from './src/utils/ThemeContext';
import {LanguageProvider} from './src/utils/LanguageContext';
import {AuthProvider} from './src/utils/AuthContext';
import biometricAuthService from './src/services/biometricAuth';
import sessionManager from './src/services/sessionManager';
import autoDataReloader from './src/services/autoDataReloader';
import { pinStorage } from './src/services/pinStorage';
import testCredentialStorage from './src/services/credentialStorageTest';
import {testSessionValidation} from './src/services/sessionValidationTest';
import {debugSessionStatus} from './src/services/sessionDebugTest';
import {testSessionPersistence} from './src/services/sessionPersistenceTest';
import {testKYCFunctionality} from './src/services/kycTest';
import {testClientConfiguration} from './src/services/clientConfigTest';
import {testBiometricAvailability} from './src/services/biometricTest';
import {useVersionCheck} from './src/hooks/useVersionCheck';
import UpdateModal from './src/components/UpdateModal';
import { initializePushNotifications, registerPendingPushToken } from './src/services/notificationService';
import { initializeFirebase } from './src/services/firebaseInit';
import appLifecycleManager from './src/services/appLifecycleManager';

import './src/i18n';

function AppContent() {
  const {isDark} = useTheme();
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastAuthTime, setLastAuthTime] = useState(0);
  const [isRecentlyAuthenticated, setIsRecentlyAuthenticated] = useState(false);
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [hasAuthenticatedThisSession, setHasAuthenticatedThisSession] = useState(false);

  // Version check hook
  const {
    versionInfo,
    isChecking,
    showUpdateModal,
    isVersionCheckEnabled,
    checkForUpdates,
    handleUpdate,
    closeUpdateModal,
  } = useVersionCheck();

  // Add error boundary for AuthProvider

  useEffect(() => {
    initializeApp();
    
    // Initialize Firebase first
    console.log('🔥 Initializing Firebase...');
    const firebaseInitialized = initializeFirebase();
    if (!firebaseInitialized) {
      console.error('❌ Firebase initialization failed');
    }
    
    (async () => {
      try {
        const client = (await AsyncStorage.getItem('current_client')) || 'dna-infotel';
        initializePushNotifications(client);
      } catch {
        initializePushNotifications('dna-infotel');
      }
    })();
  }, []);

  // Check for biometric auth flag after login
  useEffect(() => {
    const checkBiometricAfterLogin = async () => {
      try {
        const showBiometric = await AsyncStorage.getItem('showBiometricAfterLogin');
        if (showBiometric === 'true' && isLoggedIn && !hasAuthenticatedThisSession) {
          console.log('Showing biometric auth after login');
          await AsyncStorage.removeItem('showBiometricAfterLogin');
          setShowBiometricAuth(true);
        }
      } catch (error) {
        console.error('Error checking biometric after login flag:', error);
      }
    };

    if (isLoggedIn && !showBiometricAuth) {
      checkBiometricAfterLogin();
    }
  }, [isLoggedIn, showBiometricAuth, hasAuthenticatedThisSession]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      console.log('App state changed:', { from: appState, to: nextAppState });
      
      // Only trigger biometric check when coming from background to active AND app is initialized
      if (appState === 'background' && nextAppState === 'active' && isAppInitialized) {
        console.log('App came to foreground from background, checking biometric auth...');
        checkBiometricOnResume();
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      // Clean up app lifecycle manager when component unmounts
      appLifecycleManager.destroy();
    };
  }, [appState, showBiometricAuth, lastAuthTime]);

  const checkBiometricOnResume = async () => {
    try {
      if (!isLoggedIn) return; // Only check if user is logged in
      if (showBiometricAuth) return; // Don't trigger if already showing
      if (isRecentlyAuthenticated) return; // Don't trigger if recently authenticated
      if (!hasAuthenticatedThisSession) return; // Don't trigger if not authenticated this session
      
      const now = Date.now();
      const timeSinceLastAuth = now - lastAuthTime;
      
      // Prevent multiple auth prompts within 30 seconds
      if (timeSinceLastAuth < 30000) {
        console.log('Skipping auth check - too soon since last auth:', timeSinceLastAuth, 'ms');
        return;
      }
      
      const isBiometricEnabled = await biometricAuthService.isAuthEnabled();
      const pin = await pinStorage.getPin();
      
      if (isBiometricEnabled || pin) {
        console.log('Authentication is set up, showing auth screen on resume');
        // Add a small delay to make it feel more natural
        setTimeout(() => {
          setShowBiometricAuth(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error checking authentication on resume:', error);
    }
  };

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
        // User is logged in, always show authentication on app launch
        console.log('✅ User is logged in, checking authentication setup...');
        
        await biometricAuthService.initialize();
        const isBiometricEnabled = await biometricAuthService.isAuthEnabled();
        const pin = await pinStorage.getPin();
        
        console.log('Biometric enabled:', isBiometricEnabled);
        console.log('PIN available:', !!pin);
        
        if (isBiometricEnabled || pin) {
          console.log('Authentication is set up, showing auth screen immediately');
          // Don't set isLoggedIn to true yet - wait for authentication
          setShowBiometricAuth(true);
          setIsAuthInitialized(true);
          setIsAppInitialized(true);
          return; // Exit early to prevent home screen flash
        } else {
          console.log('No authentication set up, proceeding to app');
          // Trigger initial auto reload if needed
          const shouldReload = await autoDataReloader.shouldAutoReload();
          if (shouldReload) {
            console.log('Initial auto reload needed, triggering...');
            await autoDataReloader.autoReloadUserData();
          }
          
          setIsLoggedIn(true);
          setHasAuthenticatedThisSession(true); // Mark as authenticated for this session
          setIsAuthInitialized(true);
          setIsAppInitialized(true); // Mark app as initialized
        }
        
        return;
      }

      console.log('❌ User is not logged in, proceeding to login screen');
      
      // Test biometric availability first
      console.log('=== TESTING BIOMETRIC AVAILABILITY ===');
      const biometricTestResult = await testBiometricAvailability();
      console.log('Biometric test result:', biometricTestResult);
      
      // If not logged in, just go to login screen
      // Don't show biometric auth until user logs in successfully
      setIsLoggedIn(false);
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
    setHasAuthenticatedThisSession(true); // Mark as authenticated for this session
    setLastAuthTime(Date.now()); // Record successful authentication time
    setIsRecentlyAuthenticated(true); // Mark as recently authenticated
    console.log('✅ Authentication successful, recording time');
    // Attempt to register any pending push token after user is authenticated
    (async () => {
      const client = (await AsyncStorage.getItem('current_client')) || 'dna-infotel';
      registerPendingPushToken(client);
    })();
    
    // Reset the recently authenticated flag after 5 minutes
    setTimeout(() => {
      setIsRecentlyAuthenticated(false);
      console.log('🔄 Resetting recently authenticated flag');
    }, 5 * 60 * 1000); // 5 minutes
  };

  const handleLoginRedirect = async () => {
    console.log('Redirecting to login screen...');
    setShowBiometricAuth(false);
    setIsLoggedIn(false); // Ensure user is marked as not logged in
    setHasAuthenticatedThisSession(false); // Reset authentication state
    
    // Clear the session so user can login fresh
    try {
      await sessionManager.clearSession();
      console.log('Session cleared for fresh login');
      
      // Set a flag to disable session check in login screen
      await AsyncStorage.setItem('disableSessionCheck', 'true');
      console.log('Session check disabled for login screen');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  if (!isAuthInitialized) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#f8f9fa' }}>
          <Text style={{ color: isDark ? '#ffffff' : '#333333', fontSize: 16 }}>Loading...</Text>
        </View>
      </>
    );
  }

  // Show biometric auth screen if enabled, regardless of login status
  if (showBiometricAuth) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <BiometricAuthScreen
          navigation={null}
          onAuthSuccess={handleAuthSuccess}
          onLoginRedirect={handleLoginRedirect}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator initialRoute={isLoggedIn ? 'Home' : 'Login'} />
      
      {/* Version Update Modal */}
      {showUpdateModal && versionInfo && (
        <UpdateModal
          visible={showUpdateModal}
          versionInfo={versionInfo}
          onUpdate={handleUpdate}
          onClose={closeUpdateModal}
        />
      )}
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
