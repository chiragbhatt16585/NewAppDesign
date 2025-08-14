/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';

// Dynamically get app name from app.json
let appName;
try {
  const appConfig = require('./app.json');
  appName = appConfig.name;
} catch (error) {
  // Fallback to default name if app.json is not available
  appName = 'ISPApp';
  console.warn('Could not load app.json, using default app name:', appName);
}

console.log('🚀 Registering app with name:', appName);
AppRegistry.registerComponent(appName, () => App);
