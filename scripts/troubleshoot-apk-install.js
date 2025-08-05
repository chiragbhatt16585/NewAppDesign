const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const troubleshootAPKInstall = () => {
  try {
    console.log('🔧 Troubleshooting APK Installation Issues...');
    console.log('');
    
    const apkPath = './android/app/build/outputs/apk/release/app-release.apk';
    
    if (!fs.existsSync(apkPath)) {
      console.log('❌ APK not found. Please build the APK first using:');
      console.log('   node scripts/build-release-apk.js');
      return;
    }
    
    // Check APK file details
    const stats = fs.statSync(apkPath);
    console.log('📋 APK File Details:');
    console.log(`   📂 Path: ${apkPath}`);
    console.log(`   📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   📅 Modified: ${stats.mtime.toLocaleString()}`);
    console.log('');
    
    // Check if device is connected
    console.log('📱 Checking device connection...');
    const devices = execSync('adb devices', { encoding: 'utf8' });
    const lines = devices.trim().split('\n').slice(1);
    const connectedDevices = lines.filter(line => line.includes('device'));
    
    if (connectedDevices.length === 0) {
      console.log('❌ No devices connected. Please:');
      console.log('   1. Enable USB Debugging on your device');
      console.log('   2. Connect your device via USB');
      console.log('   3. Allow USB debugging when prompted');
      console.log('   4. Run this script again');
      return;
    }
    
    console.log('✅ Found connected devices:');
    connectedDevices.forEach((device, index) => {
      const deviceId = device.split('\t')[0];
      console.log(`   ${index + 1}. ${deviceId}`);
    });
    
    console.log('');
    console.log('🔧 Troubleshooting Steps:');
    console.log('');
    
    // Step 1: Check device info
    console.log('1️⃣ Checking device information...');
    try {
      const deviceInfo = execSync('adb shell getprop ro.product.model', { encoding: 'utf8' }).trim();
      const androidVersion = execSync('adb shell getprop ro.build.version.release', { encoding: 'utf8' }).trim();
      console.log(`   📱 Device: ${deviceInfo}`);
      console.log(`   🤖 Android: ${androidVersion}`);
    } catch (error) {
      console.log('   ⚠️ Could not get device info');
    }
    
    // Step 2: Check if app is already installed
    console.log('');
    console.log('2️⃣ Checking existing installation...');
    try {
      const packageInfo = execSync('adb shell pm list packages com.microscan.app', { encoding: 'utf8' });
      if (packageInfo.includes('com.microscan.app')) {
        console.log('   ✅ App is already installed');
        console.log('   💡 Try uninstalling first: adb uninstall com.microscan.app');
      } else {
        console.log('   ℹ️ App is not installed');
      }
    } catch (error) {
      console.log('   ℹ️ App is not installed');
    }
    
    // Step 3: Try installation with verbose output
    console.log('');
    console.log('3️⃣ Attempting installation...');
    try {
      console.log('   📦 Installing APK...');
      execSync(`adb install -r "${apkPath}"`, { stdio: 'inherit' });
      console.log('   ✅ Installation successful!');
      
      console.log('');
      console.log('🚀 Launching app...');
      execSync('adb shell am start -n com.microscan.app/.MainActivity', { stdio: 'inherit' });
      console.log('   ✅ App launched successfully!');
      
    } catch (error) {
      console.log('   ❌ Installation failed');
      console.log('');
      console.log('🔧 Alternative Solutions:');
      console.log('');
      console.log('📱 Method 1: Manual Installation');
      console.log('   1. Copy APK to device storage');
      console.log('   2. Enable "Install from Unknown Sources"');
      console.log('   3. Use file manager to install APK');
      console.log('');
      console.log('📱 Method 2: Use ADB with different flags');
      console.log('   adb install -r -d android/app/build/outputs/apk/release/app-release.apk');
      console.log('');
      console.log('📱 Method 3: Check device settings');
      console.log('   1. Go to Settings > Security');
      console.log('   2. Enable "Unknown Sources"');
      console.log('   3. Try installation again');
      console.log('');
      console.log('📱 Method 4: Build debug APK');
      console.log('   node scripts/build-simple-apk.js');
      console.log('   adb install android/app/build/outputs/apk/debug/app-debug.apk');
    }
    
    console.log('');
    console.log('💡 Common "Unsupported File type" Solutions:');
    console.log('   1. Make sure file extension is .apk');
    console.log('   2. Check if file transfer was complete');
    console.log('   3. Try copying file again');
    console.log('   4. Use ADB installation instead of file manager');
    console.log('   5. Check device storage space');
    
  } catch (error) {
    console.error('❌ Error during troubleshooting:', error.message);
  }
};

troubleshootAPKInstall(); 