const fs = require('fs');
const path = require('path');

console.log('🍎 Setting up iOS targets and schemes for multi-client support...\n');

// Client configurations
const clients = {
  microscan: {
    name: 'Microscan',
    bundleId: 'com.microscan.app',
    displayName: 'Microscan',
    scheme: 'MicroscanApp',
    target: 'MicroscanApp'
  },
  dnainfotel: {
    name: 'DNA Infotel',
    bundleId: 'com.h8.dnasubscriber',
    displayName: 'DNA Infotel',
    scheme: 'DNAInfotelApp',
    target: 'DNAInfotelApp'
  },
  onesevenstar: {
    name: 'One Sevenstar',
    bundleId: 'com.spacecom.log2space.onesevenstar',
    displayName: 'One Sevenstar',
    scheme: 'OneSevenstarApp',
    target: 'OneSevenstarApp'
  }
};

console.log('📋 Client configurations:');
Object.entries(clients).forEach(([key, config]) => {
  console.log(`  ${config.name}:`);
  console.log(`    Bundle ID: ${config.bundleId}`);
  console.log(`    Scheme: ${config.scheme}`);
  console.log(`    Target: ${config.target}\n`);
});

console.log('🔧 Manual Xcode Setup Instructions:\n');

console.log('1. Open Xcode and open your project:');
console.log('   open ios/ISPApp.xcworkspace\n');

console.log('2. For each client, create a new target:');
console.log('   - In Xcode, go to File > New > Target');
console.log('   - Choose "App" under iOS');
console.log('   - Set the following for each client:\n');

Object.entries(clients).forEach(([key, config]) => {
  console.log(`   ${config.name}:`);
  console.log(`     - Product Name: ${config.target}`);
  console.log(`     - Bundle Identifier: ${config.bundleId}`);
  console.log(`     - Language: Swift`);
  console.log(`     - Interface: Storyboard`);
  console.log(`     - Use Core Data: No`);
  console.log(`     - Include Tests: No\n`);
});

console.log('3. For each target, configure the following:\n');

Object.entries(clients).forEach(([key, config]) => {
  console.log(`   ${config.name} (${config.target}):`);
  console.log(`     - Select the target in the project navigator`);
  console.log(`     - Go to "General" tab`);
  console.log(`     - Set Display Name: ${config.displayName}`);
  console.log(`     - Set Bundle Identifier: ${config.bundleId}`);
  console.log(`     - Go to "Build Settings" tab`);
  console.log(`     - Search for "Product Name" and set it to: ${config.displayName}`);
  console.log(`     - Go to "Info" tab`);
  console.log(`     - Set Bundle display name: ${config.displayName}`);
  console.log(`     - Set Bundle name: ${config.displayName}\n`);
});

console.log('4. Configure app icons for each target:');
console.log('   - Select each target');
console.log('   - Go to "General" tab > "App Icons and Launch Images"');
console.log('   - Set App Icons Source to the appropriate asset catalog:');
Object.entries(clients).forEach(([key, config]) => {
  console.log(`     - ${config.name}: Use ${config.name}.imageset from Images.xcassets`);
});

console.log('\n5. Create schemes for each target:');
console.log('   - In Xcode, go to Product > Scheme > Manage Schemes');
console.log('   - Click the "+" button to add a new scheme');
console.log('   - Name each scheme after the target name');
Object.entries(clients).forEach(([key, config]) => {
  console.log(`     - ${config.scheme} for ${config.name}`);
});

console.log('\n6. Configure build settings for each target:');
console.log('   - Select each target');
console.log('   - Go to "Build Settings" tab');
console.log('   - Search for "Code Signing"');
console.log('   - Set "Code Signing Identity" to "Apple Development" for debug');
console.log('   - Set "Development Team" to your team ID');

console.log('\n7. Update Info.plist for each target:');
console.log('   - Each target will have its own Info.plist');
console.log('   - Make sure the bundle identifier matches the target configuration');

console.log('\n8. Test the setup:');
console.log('   - Select different schemes from the scheme dropdown');
console.log('   - Build and run each target to verify it works correctly');

console.log('\n🎯 After setup, you can build each client by:');
console.log('   - Selecting the appropriate scheme in Xcode');
console.log('   - Or using command line:');
Object.entries(clients).forEach(([key, config]) => {
  console.log(`     xcodebuild -workspace ios/ISPApp.xcworkspace -scheme ${config.scheme} -configuration Debug -destination "platform=iOS Simulator,name=iPhone 15"`);
});

console.log('\n📱 Benefits of this setup:');
console.log('   - No more manual file copying');
console.log('   - Each client has its own bundle ID and signing');
console.log('   - Easy switching between clients in Xcode');
console.log('   - Proper separation of concerns');

console.log('\n✅ iOS multi-client setup instructions complete!');
console.log('   Follow these steps in Xcode to complete the setup.'); 