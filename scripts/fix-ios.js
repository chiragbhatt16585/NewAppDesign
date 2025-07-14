const fs = require('fs');
const path = require('path');

const fixIOSIssues = () => {
  console.log('🔧 Fixing iOS issues...');

  try {
    // Read current app.json to get the correct app name
    const appJsonPath = './app.json';
    if (!fs.existsSync(appJsonPath)) {
      console.log('❌ app.json not found. Please run build script first.');
      return;
    }

    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const appName = appJson.name;
    console.log(`📱 Current app name: ${appName}`);

    // Fix AppDelegate.swift
    const appDelegatePath = './ios/ISPApp/AppDelegate.swift';
    if (fs.existsSync(appDelegatePath)) {
      let content = fs.readFileSync(appDelegatePath, 'utf8');
      
      // Update module name
      content = content.replace(
        /withModuleName:\s*"[^"]*"/,
        `withModuleName: "${appName}"`
      );
      
      fs.writeFileSync(appDelegatePath, content);
      console.log(`✅ Updated AppDelegate module name to '${appName}'`);
    }

    // Fix Info.plist if it exists
    const infoPlistPath = './ios/ISPApp/Info.plist';
    if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      // Update CFBundleDisplayName
      content = content.replace(
        /<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/,
        `<key>CFBundleDisplayName</key>\n\t<string>${appName}</string>`
      );
      
      // Update CFBundleName
      content = content.replace(
        /<key>CFBundleName<\/key>\s*<string>[^<]*<\/string>/,
        `<key>CFBundleName</key>\n\t<string>${appName}</string>`
      );
      
      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Updated Info.plist app name to '${appName}'`);
    }

    console.log('✅ iOS issues fixed successfully!');
    console.log('📱 You can now run the iOS app from Xcode');

  } catch (error) {
    console.error('❌ Error fixing iOS issues:', error);
  }
};

fixIOSIssues(); 