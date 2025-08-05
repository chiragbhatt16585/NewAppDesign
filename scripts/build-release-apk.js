const { execSync } = require('child_process');
const fs = require('fs');

const buildReleaseAPK = () => {
  try {
    console.log('🚀 Starting release APK build process...');
    
    // Clean everything first
    console.log('🧹 Cleaning build...');
    execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
    
    // Remove the generated directory completely
    console.log('🗑️ Removing generated files...');
    execSync('rm -rf android/app/build/generated', { stdio: 'inherit' });
    
    // Create a release build that doesn't use autolinking
    console.log('🔨 Building release APK without autolinking...');
    execSync('cd android && ./gradlew assembleRelease -x generateReactNativeEntryPoint', { stdio: 'inherit' });
    
    console.log('✅ Release APK build completed successfully!');
    console.log('📱 Release APK location: android/app/build/outputs/apk/release/app-release.apk');
    
  } catch (error) {
    console.error('❌ Release build failed:', error.message);
    
    // Try alternative approach
    console.log('🔄 Trying alternative release build approach...');
    try {
      execSync('cd android && ./gradlew bundleRelease', { stdio: 'inherit' });
      console.log('✅ Release bundle build completed successfully!');
      console.log('📦 Release bundle location: android/app/build/outputs/bundle/release/app-release.aab');
    } catch (bundleError) {
      console.error('❌ Release bundle build also failed:', bundleError.message);
      process.exit(1);
    }
  }
};

buildReleaseAPK(); 