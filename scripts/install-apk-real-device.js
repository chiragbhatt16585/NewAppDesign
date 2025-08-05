const { execSync } = require('child_process');
const fs = require('fs');

const installAPKOnRealDevice = () => {
  try {
    console.log('📱 Installing APK on real device...');
    console.log('');
    
    const apkPath = './android/app/build/outputs/apk/release/app-release.apk';
    
    if (!fs.existsSync(apkPath)) {
      console.log('❌ APK not found. Please build the APK first using:');
      console.log('   node scripts/build-release-apk.js');
      return;
    }
    
    // Check if device is connected
    const devices = execSync('adb devices', { encoding: 'utf8' });
    const lines = devices.trim().split('\n').slice(1); // Skip header
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
    
    // Uninstall existing app if present
    console.log('');
    console.log('🗑️ Uninstalling existing app...');
    try {
      execSync('adb uninstall com.microscan.app', { stdio: 'inherit' });
      console.log('✅ Existing app uninstalled');
    } catch (error) {
      console.log('ℹ️ No existing app to uninstall');
    }
    
    // Install the new APK
    console.log('');
    console.log('📦 Installing new APK...');
    execSync(`adb install "${apkPath}"`, { stdio: 'inherit' });
    
    console.log('');
    console.log('🚀 Launching app...');
    execSync('adb shell am start -n com.microscan.app/.MainActivity', { stdio: 'inherit' });
    
    console.log('');
    console.log('✅ APK installed and launched successfully!');
    console.log('');
    console.log('📋 Installation Summary:');
    console.log(`   📂 APK: ${apkPath}`);
    console.log(`   📏 Size: ${(fs.statSync(apkPath).size / 1024 / 1024).toFixed(1)}MB`);
    console.log('   🔧 Build Type: Release (AR-optimized)');
    console.log('   📱 Package: com.microscan.app');
    console.log('');
    console.log('🎉 The app should now be running on your device!');
    console.log('');
    console.log('💡 If you still see AR-related errors:');
    console.log('   1. Make sure your device has Google Play Services');
    console.log('   2. The app will work without AR features');
    console.log('   3. AR features are marked as optional');
    
  } catch (error) {
    console.error('❌ Error installing APK:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure USB debugging is enabled');
    console.log('   2. Check that your device is properly connected');
    console.log('   3. Try running: adb devices');
    console.log('   4. If using Windows, install ADB drivers');
  }
};

installAPKOnRealDevice(); 