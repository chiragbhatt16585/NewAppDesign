const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { monitorAndFix } = require('./fix-build-config');

console.log('🔧 Starting custom Android build process...');

// Start monitoring
const monitorInterval = monitorAndFix();

try {
  // Run the Android build
  console.log('🚀 Running Android build...');
  execSync('npx react-native run-android', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('❌ Build failed:', error.message);
} finally {
  // Stop monitoring
  clearInterval(monitorInterval);
} 