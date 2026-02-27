const fs = require('fs');
const path = require('path');

// Read current client from config
let clientName = 'spacecom-live'; // default
try {
  const currentClientConfig = require('../src/config/current-client.json');
  clientName = currentClientConfig.clientId;
} catch (error) {
  console.log('⚠️  Could not read current-client.json, using default: spacecom-live');
}

console.log(`📱 Copying iOS app icons for client: ${clientName}`);

const sourcePath = path.join(__dirname, '..', 'config', clientName, 'app-icons', 'ios', 'AppIcon.appiconset');
const destPath = path.join(__dirname, '..', 'ios', 'ISPApp', 'Images.xcassets', 'AppIcon.appiconset');

if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Source icons not found at: ${sourcePath}`);
  console.error(`   Please ensure icons exist in config/${clientName}/app-icons/ios/AppIcon.appiconset/`);
  process.exit(1);
}

try {
  // Remove existing AppIcon.appiconset if it exists
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
    console.log('🗑️  Removed existing AppIcon.appiconset');
  }

  // Copy the new AppIcon.appiconset
  fs.cpSync(sourcePath, destPath, { recursive: true, force: true });
  console.log(`✅ Successfully copied iOS app icons from config/${clientName}/`);
  console.log(`   Source: ${sourcePath}`);
  console.log(`   Destination: ${destPath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Open Xcode');
  console.log('   2. Clean build folder (Product > Clean Build Folder or Shift+Cmd+K)');
  console.log('   3. Delete derived data (Xcode > Settings > Locations > Derived Data > Delete)');
  console.log('   4. Rebuild the app');
  console.log('   5. If icon still doesn\'t update, delete the app from simulator/device and reinstall');
} catch (error) {
  console.error('❌ Error copying icons:', error);
  process.exit(1);
}

