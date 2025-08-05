const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const installOnRealDevice = () => {
  try {
    console.log('📱 Installing APK on Real Device...');
    console.log('');
    
    const apkPath = './android/app/build/outputs/apk/release/app-release.apk';
    
    if (!fs.existsSync(apkPath)) {
      console.log('❌ APK not found. Please build the APK first using:');
      console.log('   node scripts/build-release-apk.js');
      return;
    }
    
    // Check if real device is connected (not emulator)
    console.log('📱 Checking for real device...');
    const devices = execSync('adb devices', { encoding: 'utf8' });
    const lines = devices.trim().split('\n').slice(1);
    const realDevices = lines.filter(line => 
      line.includes('device') && !line.includes('emulator')
    );
    
    if (realDevices.length === 0) {
      console.log('❌ No real device connected. Please:');
      console.log('   1. Enable USB Debugging on your device');
      console.log('   2. Connect your device via USB');
      console.log('   3. Allow USB debugging when prompted');
      console.log('   4. Make sure it\'s not an emulator');
      console.log('   5. Run this script again');
      return;
    }
    
    console.log('✅ Found real device(s):');
    realDevices.forEach((device, index) => {
      const deviceId = device.split('\t')[0];
      console.log(`   ${index + 1}. ${deviceId}`);
    });
    
    // Get device info
    console.log('');
    console.log('📋 Device Information:');
    try {
      const deviceModel = execSync('adb shell getprop ro.product.model', { encoding: 'utf8' }).trim();
      const androidVersion = execSync('adb shell getprop ro.build.version.release', { encoding: 'utf8' }).trim();
      const manufacturer = execSync('adb shell getprop ro.product.manufacturer', { encoding: 'utf8' }).trim();
      console.log(`   📱 Model: ${deviceModel}`);
      console.log(`   🏭 Manufacturer: ${manufacturer}`);
      console.log(`   🤖 Android: ${androidVersion}`);
    } catch (error) {
      console.log('   ⚠️ Could not get device info');
    }
    
    // Check device storage
    console.log('');
    console.log('💾 Checking device storage...');
    try {
      const storageInfo = execSync('adb shell df /sdcard', { encoding: 'utf8' });
      console.log('   📊 Storage info:');
      console.log(storageInfo);
    } catch (error) {
      console.log('   ⚠️ Could not get storage info');
    }
    
    // Uninstall existing app
    console.log('');
    console.log('🗑️ Uninstalling existing app...');
    try {
      execSync('adb uninstall com.microscan.app', { stdio: 'inherit' });
      console.log('   ✅ Existing app uninstalled');
    } catch (error) {
      console.log('   ℹ️ No existing app to uninstall');
    }
    
    // Install APK using ADB (this bypasses file manager issues)
    console.log('');
    console.log('📦 Installing APK via ADB...');
    try {
      execSync(`adb install -r -d "${apkPath}"`, { stdio: 'inherit' });
      console.log('   ✅ APK installed successfully via ADB!');
      
      console.log('');
      console.log('🚀 Launching app...');
      execSync('adb shell am start -n com.microscan.app/.MainActivity', { stdio: 'inherit' });
      console.log('   ✅ App launched successfully!');
      
      console.log('');
      console.log('🎉 Installation Complete!');
      console.log('');
      console.log('📋 Summary:');
      console.log(`   📂 APK: ${apkPath}`);
      console.log(`   📏 Size: ${(fs.statSync(apkPath).size / 1024 / 1024).toFixed(2)}MB`);
      console.log('   🔧 Method: ADB Installation (bypasses file manager)');
      console.log('   📱 Package: com.microscan.app');
      
    } catch (error) {
      console.log('   ❌ ADB installation failed');
      console.log('');
      console.log('🔧 Alternative Installation Methods:');
      console.log('');
      console.log('📱 Method 1: Push APK to device and install');
      console.log('   adb push android/app/build/outputs/apk/release/app-release.apk /sdcard/');
      console.log('   adb shell pm install -r /sdcard/app-release.apk');
      console.log('');
      console.log('📱 Method 2: Build debug APK (often easier to install)');
      console.log('   node scripts/build-simple-apk.js');
      console.log('   adb install android/app/build/outputs/apk/debug/app-debug.apk');
      console.log('');
      console.log('📱 Method 3: Manual installation steps');
      console.log('   1. Copy APK to device using: adb push android/app/build/outputs/apk/release/app-release.apk /sdcard/');
      console.log('   2. On device, go to Settings > Security > Unknown Sources');
      console.log('   3. Use file manager to navigate to /sdcard/');
      console.log('   4. Tap on app-release.apk to install');
      console.log('');
      console.log('📱 Method 4: Use Android Studio');
      console.log('   1. Open Android Studio');
      console.log('   2. Connect your device');
      console.log('   3. Drag and drop the APK file');
    }
    
    console.log('');
    console.log('💡 Why "Unsupported File type" occurs:');
    console.log('   1. File manager doesn\'t recognize .apk extension');
    console.log('   2. File transfer was incomplete or corrupted');
    console.log('   3. Device security settings block installation');
    console.log('   4. APK file is not properly signed');
    console.log('');
    console.log('✅ ADB installation bypasses these issues!');
    
  } catch (error) {
    console.error('❌ Error during installation:', error.message);
  }
};

installOnRealDevice(); 