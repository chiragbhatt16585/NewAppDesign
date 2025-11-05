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

    // Fix Xcode project file (project.pbxproj)
    const projectPbxprojPath = './ios/ISPApp.xcodeproj/project.pbxproj';
    if (fs.existsSync(projectPbxprojPath)) {
      let content = fs.readFileSync(projectPbxprojPath, 'utf8');
      const displayName = appJson.expo?.name || appName;
      
      // Update PRODUCT_NAME
      content = content.replace(/PRODUCT_NAME\s*=\s*DNAInfotelApp;/g, `PRODUCT_NAME = ${appName};`);
      
      // Update INFOPLIST_KEY_CFBundleDisplayName
      content = content.replace(
        /INFOPLIST_KEY_CFBundleDisplayName\s*=\s*"[^"]*";/g,
        `INFOPLIST_KEY_CFBundleDisplayName = "${displayName}";`
      );
      
      // Update app file reference (if it exists as DNAInfotelApp.app)
      content = content.replace(/DNAInfotelApp\.app/g, `${appName}.app`);
      
      fs.writeFileSync(projectPbxprojPath, content);
      console.log(`✅ Updated Xcode project.pbxproj for '${appName}'`);
    }

    // Fix Xcode scheme file
    const schemePath = './ios/ISPApp.xcodeproj/xcshareddata/xcschemes/ISPApp.xcscheme';
    if (fs.existsSync(schemePath)) {
      let content = fs.readFileSync(schemePath, 'utf8');
      content = content.replace(/DNAInfotelApp\.app/g, `${appName}.app`);
      fs.writeFileSync(schemePath, content);
      console.log(`✅ Updated Xcode scheme file for '${appName}'`);
    }

    console.log('✅ iOS issues fixed successfully!');
    console.log('📱 You can now run the iOS app from Xcode');

  } catch (error) {
    console.error('❌ Error fixing iOS issues:', error);
  }
};

fixIOSIssues(); 