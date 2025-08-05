const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const buildAPK = () => {
  try {
    console.log('🚀 Starting APK build process...');
    
    // Clean the build first
    console.log('🧹 Cleaning build...');
    execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
    
    // Start the build process
    console.log('🔨 Building debug APK...');
    execSync('cd android && ./gradlew assembleDebug', { stdio: 'inherit' });
    
    console.log('✅ APK build completed successfully!');
    console.log('📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    
    // If build fails, try to fix the BuildConfig issue and retry
    console.log('🔧 Attempting to fix BuildConfig issue...');
    try {
      execSync('node scripts/fix-buildconfig.js', { stdio: 'inherit' });
      console.log('🔄 Retrying build...');
      execSync('cd android && ./gradlew assembleDebug', { stdio: 'inherit' });
      console.log('✅ APK build completed successfully after fix!');
    } catch (retryError) {
      console.error('❌ Build failed even after fix:', retryError.message);
      process.exit(1);
    }
  }
};

buildAPK(); 