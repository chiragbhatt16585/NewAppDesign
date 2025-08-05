const { execSync } = require('child_process');
const fs = require('fs');

const buildSimpleAPK = () => {
  try {
    console.log('🚀 Starting simple APK build process...');
    
    // Clean everything first
    console.log('🧹 Cleaning build...');
    execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
    
    // Remove the generated directory completely
    console.log('🗑️ Removing generated files...');
    execSync('rm -rf android/app/build/generated', { stdio: 'inherit' });
    
    // Create a simple build that doesn't use autolinking
    console.log('🔨 Building without autolinking...');
    execSync('cd android && ./gradlew assembleDebug -x generateReactNativeEntryPoint', { stdio: 'inherit' });
    
    console.log('✅ APK build completed successfully!');
    console.log('📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    
    // Try alternative approach
    console.log('🔄 Trying alternative build approach...');
    try {
      execSync('cd android && ./gradlew bundleDebug', { stdio: 'inherit' });
      console.log('✅ Bundle build completed successfully!');
      console.log('📦 Bundle location: android/app/build/outputs/bundle/debug/app-debug.aab');
    } catch (bundleError) {
      console.error('❌ Bundle build also failed:', bundleError.message);
      process.exit(1);
    }
  }
};

buildSimpleAPK(); 