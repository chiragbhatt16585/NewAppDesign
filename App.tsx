  /**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import {StatusBar, AppState, View, Text} from 'react-native';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import BiometricAuthScreen from './src/screens/BiometricAuthScreen';
import {ThemeProvider, useTheme} from './src/utils/ThemeContext';
import {LanguageProvider} from './src/utils/LanguageContext';
import {AuthProvider} from './src/utils/AuthContext';
import {AuthDataProvider} from './src/utils/AuthDataContext';
import biometricAuthService from './src/services/biometricAuth';
import sessionManager from './src/services/sessionManager';
import { migrateRealmToAsyncStorage } from './src/services/realmMigration';
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
import ErrorBoundary from './src/components/ErrorBoundary';
import { getClientConfig } from './src/config/client-config';
import { InAppNotificationProvider } from './src/utils/InAppNotificationContext';
import { setSessionExpiredHandler } from './src/utils/sessionExpiryBridge';
import { navigationRef } from './src/navigation/RootNavigation';
import { useAuth } from './src/utils/AuthContext';

// In production builds, disable console output to reduce JS thread and disk I/O overhead.
if (!__DEV__) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
  console.debug = noop;
}

// Safely import i18n - if it fails, app should still work
try {
  require('./src/i18n');
} catch (error) {
  if (__DEV__) {
    console.error('Failed to load i18n:', error);
  }
  // Continue without i18n - app will use default language
}

function AppContent() {
  const {isDark} = useTheme();
  const { logout } = useAuth();
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lastAuthTime, setLastAuthTime] = useState(0);
  const [isRecentlyAuthenticated, setIsRecentlyAuthenticated] = useState(false);
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [hasAuthenticatedThisSession, setHasAuthenticatedThisSession] = useState(false);
  const [needsDomainEntry, setNeedsDomainEntry] = useState(false);

  // When session expires (e.g. token regeneration failed), clear auth and go to Login
  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await logout();
      setIsLoggedIn(false);
      setHasAuthenticatedThisSession(false);
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
    return () => setSessionExpiredHandler(null);
  }, [logout]);

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
    // Add a timeout to ensure app doesn't get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (!isAuthInitialized) {
        console.warn('⚠️ App initialization timeout - forcing initialization complete');
        setIsAuthInitialized(true);
        setIsLoggedIn(false);
      }
    }, 10000); // 10 second timeout

    // Wrap all initialization in try-catch to prevent crashes
    (async () => {
      try {
        console.log('🚀 Starting app initialization...');
        await initializeApp();
        console.log('✅ App initialization completed');
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        console.error('❌ Error stack:', (error as Error)?.stack);
        clearTimeout(timeoutId);
        // Ensure app can still render even if initialization fails
        setIsAuthInitialized(true);
        setIsLoggedIn(false);
      }
    })();
    
    // Initialize Firebase first - wrapped in try-catch with delay for production
    // Add a small delay to ensure native modules are ready
    setTimeout(() => {
      (async () => {
        try {
          if (__DEV__) {
            console.log('🔥 Initializing Firebase...');
          }
          const firebaseInitialized = initializeFirebase();
          if (!firebaseInitialized && __DEV__) {
            console.error('❌ Firebase initialization failed');
          }
        } catch (error) {
          // Silently fail in production, log in dev
          if (__DEV__) {
            console.error('❌ Firebase initialization error:', error);
          }
          // Don't crash the app if Firebase fails
        }
      })();
    }, 500); // 500ms delay to ensure native modules are ready
    
    // Initialize push notifications - wrapped in try-catch with delay
    // Add delay to ensure Firebase is initialized first
    setTimeout(() => {
      (async () => {
        try {
          const client = (await AsyncStorage.getItem('current_client')) || 'dna-infotel';
          await initializePushNotifications(client);
        } catch (error) {
          // Log in dev, silently fail in production
          if (__DEV__) {
            console.error('❌ Push notification initialization error:', error);
          }
          // Try with default client if current client fails
          try {
            await initializePushNotifications('dna-infotel');
          } catch (fallbackError) {
            if (__DEV__) {
              console.error('❌ Push notification fallback initialization error:', fallbackError);
            }
            // Don't crash the app if push notifications fail
          }
        }
      })();
    }, 1000); // 1 second delay to ensure Firebase is ready

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Check for biometric auth flag after login
  useEffect(() => {
    const checkBiometricAfterLogin = async () => {
      try {
        // Check if biometric is enabled for client
        const clientConfig = getClientConfig();
        if (clientConfig.features?.biometricAuth !== true) {
          // Biometric is disabled for this client, remove flag if exists
          await AsyncStorage.removeItem('showBiometricAfterLogin');
          return;
        }

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
    let previousAppState = AppState.currentState;
    const handleAppStateChange = (nextAppState: any) => {
      if (__DEV__) {
        console.log('App state changed:', { from: previousAppState, to: nextAppState });
      }

      // When coming from background to active: refresh token if stale and run biometric check
      if (previousAppState === 'background' && nextAppState === 'active' && isAppInitialized) {
        if (__DEV__) {
          console.log('App came to foreground from background, checking biometric auth...');
        }
        checkBiometricOnResume();
        // Proactively refresh session/token so menu and other API calls don't show "Token Expired"
        if (isLoggedIn) {
          sessionManager.shouldAutoRefresh().then((should) => {
            if (should) {
              sessionManager.autoRefreshSession().catch(() => {});
            }
          });
        }
      }

      previousAppState = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, [isAppInitialized, isLoggedIn, showBiometricAuth, isRecentlyAuthenticated, hasAuthenticatedThisSession, lastAuthTime]);

  useEffect(() => {
    return () => {
      // Clean up app lifecycle manager when component unmounts
      appLifecycleManager.destroy();
    };
  }, []);

  const checkBiometricOnResume = async () => {
    try {
      // Check if biometric is enabled for client
      const clientConfig = getClientConfig();
      if (clientConfig.features?.biometricAuth !== true) {
        // Biometric is disabled for this client, skip biometric check
        return;
      }

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
      if (__DEV__) {
        console.log('=== INITIALIZING APP ===');
      }
      
      // One-time migration: copy old Realm auth/session into AsyncStorage so existing users stay logged in
      try {
        await migrateRealmToAsyncStorage();
      } catch (error) {
        if (__DEV__) {
          console.warn('Realm migration error (non-fatal):', error);
        }
      }

      // Initialize session manager first - wrapped in try-catch
      try {
        await sessionManager.initialize();
      } catch (error) {
        // Log in dev, silently continue in production
        if (__DEV__) {
          console.error('❌ Session manager initialization failed:', error);
        }
        // Continue even if session manager fails
      }

      // log2space-common: load custom API domain from storage so api/client-config use it
      try {
        const currentClientConfig = require('./src/config/current-client.json');
        if (currentClientConfig?.clientId === 'log2space-common') {
          const { loadFromStorage } = require('./src/config/customApiStorage');
          await loadFromStorage();
        }
      } catch (_) {}
      
      // Initialize auto data reloader (this sets up app state listeners)
      if (__DEV__) {
        console.log('Initializing auto data reloader...');
      }
      // The autoDataReloader is already initialized as a singleton
      
      // Test session persistence - wrapped in try-catch
      // Only run tests in dev mode to avoid production issues
      if (__DEV__) {
        try {
          await testSessionPersistence();
        } catch (error) {
          console.error('❌ Session persistence test failed:', error);
          // Continue even if test fails
        }
      }
      
      // Check if user is already logged in and session is valid
      let loggedIn = false;
      try {
        loggedIn = await sessionManager.isLoggedIn();
        if (__DEV__) {
          console.log('App initialization - user logged in:', loggedIn);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Failed to check login status:', error);
        }
        loggedIn = false;
      }
      
      if (loggedIn) {
        // User is logged in, always show authentication on app launch
        console.log('✅ User is logged in, checking authentication setup...');
        
        let isBiometricEnabled = false;
        let pin = null;
        try {
          await biometricAuthService.initialize();
          isBiometricEnabled = await biometricAuthService.isAuthEnabled();
          pin = await pinStorage.getPin();
        } catch (error) {
          console.error('❌ Biometric/PIN check failed:', error);
          // Continue without biometric auth
        }
        
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
          // Trigger initial auto reload if needed - wrapped in try-catch
          try {
            const shouldReload = await autoDataReloader.shouldAutoReload();
            if (shouldReload) {
              console.log('Initial auto reload needed, triggering...');
              await autoDataReloader.autoReloadUserData();
            }
          } catch (error) {
            console.error('❌ Auto reload failed:', error);
            // Continue even if auto reload fails
          }
          
          setIsLoggedIn(true);
          setHasAuthenticatedThisSession(true); // Mark as authenticated for this session
          setIsAuthInitialized(true);
          setIsAppInitialized(true); // Mark app as initialized
        }
        
        return;
      }

      console.log('❌ User is not logged in, proceeding to login screen');

      // log2space-common: require domain entry if not set
      try {
        const currentClientConfig = require('./src/config/current-client.json');
        if (currentClientConfig?.clientId === 'log2space-common') {
          const { loadFromStorage, getCustomApi } = require('./src/config/customApiStorage');
          await loadFromStorage();
          if (!getCustomApi()) {
            setNeedsDomainEntry(true);
          }
        }
      } catch (e) {
        if (__DEV__) {
          console.warn('Could not check log2space-common domain:', e);
        }
      }
      
      // Test biometric availability first - wrapped in try-catch
      try {
        console.log('=== TESTING BIOMETRIC AVAILABILITY ===');
        const biometricTestResult = await testBiometricAvailability();
        console.log('Biometric test result:', biometricTestResult);
      } catch (error) {
        console.error('❌ Biometric availability test failed:', error);
        // Continue even if test fails
      }
      
      // If not logged in, just go to login screen
      // Don't show biometric auth until user logs in successfully
      setIsLoggedIn(false);
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      console.error('❌ Error details:', {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
        name: (error as Error)?.name,
      });
      // Fallback to login screen
      setIsLoggedIn(false);
    } finally {
      console.log('✅ Setting isAuthInitialized to true');
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
      await registerPendingPushToken(client);
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
          {__DEV__ && (
            <Text style={{ color: isDark ? '#888888' : '#666666', fontSize: 12, marginTop: 10 }}>
              Initializing app...
            </Text>
          )}
        </View>
      </>
    );
  }

  // Show biometric auth screen if enabled, regardless of login status
  if (showBiometricAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <BiometricAuthScreen
          navigation={null}
          onAuthSuccess={handleAuthSuccess}
          onLoginRedirect={handleLoginRedirect}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator initialRoute={needsDomainEntry ? 'DomainEntry' : (isLoggedIn ? 'Home' : 'Login')} />
      
      {/* Version Update Modal */}
      {showUpdateModal && versionInfo && (
        <UpdateModal
          visible={showUpdateModal}
          versionInfo={versionInfo}
          onUpdate={handleUpdate}
          onClose={closeUpdateModal}
        />
      )}
    </View>
  );
}

// Individual error boundaries for each provider to isolate failures
const SafeThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <ThemeProvider>{children}</ThemeProvider>
    </ErrorBoundary>
  );
};

const SafeLanguageProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <LanguageProvider>{children}</LanguageProvider>
    </ErrorBoundary>
  );
};

const SafeAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <AuthProvider>
        <ErrorBoundary fallback={<>{children}</>}>
          <AuthDataProvider>
            {children}
          </AuthDataProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ErrorBoundary>
          <SafeLanguageProvider>
            <ErrorBoundary>
              <SafeThemeProvider>
                <ErrorBoundary>
                  <SafeAuthProvider>
                    <InAppNotificationProvider>
                      <AppContent />
                    </InAppNotificationProvider>
                  </SafeAuthProvider>
                </ErrorBoundary>
              </SafeThemeProvider>
            </ErrorBoundary>
          </SafeLanguageProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
