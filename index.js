/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';

// Global error handler for unhandled errors
// ErrorUtils can be accessed from react-native or as a global
try {
  const ReactNative = require('react-native');
  const ErrorUtils = ReactNative.ErrorUtils || (typeof global !== 'undefined' ? global.ErrorUtils : undefined);
  
  if (ErrorUtils && typeof ErrorUtils.getGlobalHandler === 'function') {
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Log error (will be visible in production logs)
      if (__DEV__) {
        console.error('❌ Global error handler:', error);
        console.error('❌ Is fatal:', isFatal);
      }
      
      // Call original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
      
      // In production, try to prevent crash by showing error screen
      if (isFatal && !__DEV__) {
        // The ErrorBoundary should catch this, but if not, at least log it
        console.error('Fatal error occurred:', error);
      }
    });
  }
} catch (error) {
  // Silently fail if error handler setup fails
  if (__DEV__) {
    console.warn('Failed to set up global error handler:', error);
  }
}

// Handle unhandled promise rejections (if available)
if (typeof global !== 'undefined' && typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    if (__DEV__) {
      console.error('❌ Unhandled promise rejection:', reason);
    }
    // Don't crash the app - just log it
  });
}

// Use a fixed registration name so it always matches native (iOS AppDelegate / Android MainActivity).
// This avoids "X has not been registered" when switching clients or using Metro cache.
const APP_REGISTRY_NAME = 'ISPApp';

if (__DEV__) {
  console.log('🚀 Registering app with name:', APP_REGISTRY_NAME);
}
AppRegistry.registerComponent(APP_REGISTRY_NAME, () => App);
