const { execSync } = require('child_process');
const fs = require('fs');

const installAPK = () => {
  try {
    console.log('📱 Installing APK on device...');
    
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
      console.log('   1. Enable USB debugging on your device');
      console.log('   2. Connect your device via USB');
      console.log('   3. Allow USB debugging when prompted');
      return;
    }
    
    console.log(`✅ Found ${connectedDevices.length} device(s):`);
    connectedDevices.forEach(device => {
      console.log(`   - ${device.split('\t')[0]}`);
    });
    
    // Uninstall previous version if exists
    try {
      execSync('adb uninstall com.microscan.app', { stdio: 'pipe' });
      console.log('🗑️ Uninstalled previous version');
    } catch (error) {
      // App wasn't installed, that's fine
    }
    
    // Install new APK
    console.log('📦 Installing new APK...');
    execSync(`adb install ${apkPath}`, { stdio: 'inherit' });
    
    console.log('🚀 Launching app...');
    execSync('adb shell am start -n com.microscan.app/.MainActivity', { stdio: 'inherit' });
    
    console.log('✅ APK installed and launched successfully!');
    console.log('');
    console.log('📋 If you still see AR dependency errors:');
    console.log('   1. The app should now work without AR features');
    console.log('   2. AR features are marked as optional');
    console.log('   3. The app will function normally without Google Play Services for AR');
    
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure USB debugging is enabled');
    console.log('   2. Check that your device is properly connected');
    console.log('   3. Try running: adb devices');
    console.log('   4. If using emulator, make sure it\'s running');
  }
};

installAPK(); 