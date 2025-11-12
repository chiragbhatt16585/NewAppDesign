#!/usr/bin/env node

/**
 * Script to sync Linkway client assets for iOS/Android
 * This ensures all logos and assets are properly copied
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const configDir = path.join(__dirname, '..', 'config', 'linkway');
const srcAssetsDir = path.join(__dirname, '..', 'src', 'assets');
const srcConfigDir = path.join(__dirname, '..', 'src', 'config');
const iosAssetsDir = path.join(__dirname, '..', 'ios', 'ISPApp');

console.log('🔄 Syncing Linkway assets...\n');

// 1. Copy assets to src/assets
if (fs.existsSync(path.join(configDir, 'assets'))) {
  const assetsSource = path.join(configDir, 'assets');
  console.log('📁 Copying assets to src/assets...');
  execSync(`cp -r "${assetsSource}"/* "${srcAssetsDir}/"`, { stdio: 'inherit' });
  console.log('✅ Assets copied to src/assets\n');
}

// 2. Copy logo-config.json
if (fs.existsSync(path.join(configDir, 'logo-config.json'))) {
  console.log('📄 Copying logo-config.json...');
  fs.copyFileSync(
    path.join(configDir, 'logo-config.json'),
    path.join(srcConfigDir, 'logo-config.json')
  );
  console.log('✅ logo-config.json copied\n');
}

// 3. Copy logo to iOS directory (for reference, though React Native uses src/assets)
if (fs.existsSync(path.join(configDir, 'assets', 'isp_logo.png'))) {
  console.log('📱 Copying logo to iOS directory...');
  fs.copyFileSync(
    path.join(configDir, 'assets', 'isp_logo.png'),
    path.join(iosAssetsDir, 'isp_logo.png')
  );
  console.log('✅ Logo copied to iOS directory\n');
}

// 4. Verify files exist
console.log('🔍 Verifying files...');
const requiredFiles = [
  { path: path.join(srcAssetsDir, 'isp_logo.png'), name: 'src/assets/isp_logo.png' },
  { path: path.join(srcConfigDir, 'logo-config.json'), name: 'src/config/logo-config.json' },
];

let allGood = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    const stats = fs.statSync(file.path);
    console.log(`✅ ${file.name} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`❌ ${file.name} - MISSING!`);
    allGood = false;
  }
});

console.log('\n' + (allGood ? '✅ All assets synced successfully!' : '❌ Some assets are missing!'));
console.log('\n📝 Next steps:');
console.log('   1. Clear Metro bundler cache: yarn start --reset-cache');
console.log('   2. Clean iOS build: cd ios && pod install && cd ..');
console.log('   3. Rebuild the app: yarn ios');


