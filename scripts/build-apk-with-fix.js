const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const buildAPKWithFix = () => {
  try {
    console.log('🚀 Starting APK build process with automatic fix...');
    
    // Clean the build first
    console.log('🧹 Cleaning build...');
    execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
    
    // Start the build process but stop after the file is generated
    console.log('🔨 Building debug APK (stopping after file generation)...');
    
    // Run the build until the file is generated, then fix it
    try {
      execSync('cd android && ./gradlew generateReactNativeEntryPoint', { stdio: 'inherit' });
      
      // Wait a moment for the file to be written
      setTimeout(() => {
        console.log('🔧 Fixing BuildConfig issue...');
        execSync('node scripts/fix-buildconfig.js', { stdio: 'inherit' });
        
        // Continue with the rest of the build
        console.log('🔄 Continuing build...');
        execSync('cd android && ./gradlew assembleDebug', { stdio: 'inherit' });
        
        console.log('✅ APK build completed successfully!');
        console.log('📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk');
      }, 2000);
      
    } catch (error) {
      console.log('⚠️ Build stopped, trying alternative approach...');
      
      // Alternative approach: run the fix script and then build
      execSync('node scripts/fix-buildconfig.js', { stdio: 'inherit' });
      execSync('cd android && ./gradlew assembleDebug', { stdio: 'inherit' });
      
      console.log('✅ APK build completed successfully!');
      console.log('📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk');
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
};

buildAPKWithFix(); 