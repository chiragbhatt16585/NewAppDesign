const fs = require('fs');
const path = require('path');

const clientName = process.argv[2] || 'default';

console.log(`🏗️  Building for client: ${clientName}`);

// Switch Java package based on client
const switchJavaPackage = (client) => {
  const javaSrcPath = './android/app/src/main/java';
  let mainActivityPath = '';
  let appJsonPath = '';
  let packagePath = '';

  if (client === 'microscan') {
    mainActivityPath = `${javaSrcPath}/com/microscan/app/MainActivity.kt`;
    appJsonPath = './config/microscan/app.json';
    packagePath = `${javaSrcPath}/com/microscan/app`;
  } else if (client === 'dna-infotel') {
    mainActivityPath = `${javaSrcPath}/com/h8/dnasubscriber/MainActivity.kt`;
    appJsonPath = './config/dna-infotel/app.json';
    packagePath = `${javaSrcPath}/com/h8/dnasubscriber`;
  } else if (client === 'one-sevenstar') {
    mainActivityPath = `${javaSrcPath}/com/h8/dnasubscriber/MainActivity.kt`;
    appJsonPath = './config/one-sevenstar/app.json';
    packagePath = `${javaSrcPath}/com/h8/dnasubscriber`;
  } else {
    return;
  }

  // Read app name from app.json
  let appName = '';
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appName = appJson.name;
  } catch (e) {
    console.log('❌ Could not read app name from', appJsonPath);
    return;
  }

  // Create package directory if it doesn't exist
  if (!fs.existsSync(packagePath)) {
    fs.mkdirSync(packagePath, { recursive: true });
    console.log(`✅ Created package directory: ${packagePath}`);
  }

  // Copy MainActivity.kt to the correct package location
  const sourceMainActivity = './android/app/src/main/java/com/h8/dnasubscriber/MainActivity.kt';
  if (fs.existsSync(sourceMainActivity) && !fs.existsSync(mainActivityPath)) {
    fs.copyFileSync(sourceMainActivity, mainActivityPath);
    console.log(`✅ Copied MainActivity.kt to ${mainActivityPath}`);
  }

  // Update getMainComponentName in MainActivity.kt
  if (fs.existsSync(mainActivityPath)) {
    let content = fs.readFileSync(mainActivityPath, 'utf8');
    
    // Update package declaration
    if (client === 'microscan') {
      content = content.replace(/package com\.h8\.dnasubscriber/, 'package com.microscan.app');
    }
    
    content = content.replace(/override fun getMainComponentName\(\): String = ".*"/, `override fun getMainComponentName(): String = "${appName}"`);
    fs.writeFileSync(mainActivityPath, content);
    console.log(`✅ Updated getMainComponentName() in ${mainActivityPath} to '${appName}'`);
  }
};

// Fix iOS AppDelegate module name
const fixIOSAppDelegate = (client) => {
  const appDelegatePath = './ios/ISPApp/AppDelegate.swift';
  let appJsonPath = '';

  if (client === 'microscan') {
    appJsonPath = './config/microscan/app.json';
  } else if (client === 'dna-infotel') {
    appJsonPath = './config/dna-infotel/app.json';
  } else if (client === 'one-sevenstar') {
    appJsonPath = './config/one-sevenstar/app.json';
  } else {
    return;
  }

  // Read app name from app.json
  let appName = '';
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appName = appJson.name;
  } catch (e) {
    console.log('❌ Could not read app name from', appJsonPath);
    return;
  }

  // Update module name in AppDelegate.swift
  if (fs.existsSync(appDelegatePath)) {
    let content = fs.readFileSync(appDelegatePath, 'utf8');
    content = content.replace(/withModuleName:\s*"ISPApp"/, `withModuleName: "${appName}"`);
    fs.writeFileSync(appDelegatePath, content);
    console.log(`✅ Updated iOS AppDelegate module name to '${appName}'`);
  }
};

// Copy client-specific files
const copyFiles = () => {
  const clientConfigPath = `config/${clientName}`;
  const sourcePath = path.join(__dirname, '..', clientConfigPath);
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Client configuration not found: ${clientName}`);
    console.error(`Available clients: ${fs.readdirSync(path.join(__dirname, '..', 'config')).join(', ')}`);
    process.exit(1);
  }

  try {
    // Copy app.json
    if (fs.existsSync(`${sourcePath}/app.json`)) {
      fs.copyFileSync(`${sourcePath}/app.json`, './app.json');
      console.log(`✅ Copied app.json for ${clientName}`);
    }

    // Copy api.ts (only if it doesn't exist or is smaller than current)
    if (fs.existsSync(`${sourcePath}/api.ts`)) {
      const sourceApiPath = `${sourcePath}/api.ts`;
      const targetApiPath = './src/services/api.ts';
      
      // Check if target exists and compare sizes
      if (fs.existsSync(targetApiPath)) {
        const sourceStats = fs.statSync(sourceApiPath);
        const targetStats = fs.statSync(targetApiPath);
        
        // Only copy if source is significantly larger (more complete)
        if (sourceStats.size > targetStats.size * 1.2) {
          fs.copyFileSync(sourceApiPath, targetApiPath);
          console.log(`✅ Copied enhanced api.ts for ${clientName}`);
        } else {
          console.log(`⚠️  Skipped api.ts copy - current version is more complete`);
        }
      } else {
        // Target doesn't exist, copy it
        fs.copyFileSync(sourceApiPath, targetApiPath);
        console.log(`✅ Copied api.ts for ${clientName}`);
      }
    }

    // Copy assets (in-app logos)
    if (fs.existsSync(`${sourcePath}/assets`)) {
      fs.cpSync(`${sourcePath}/assets`, './src/assets', { recursive: true, force: true });
      console.log(`✅ Copied assets for ${clientName}`);
    }

    // Copy logo to Android directory
    if (fs.existsSync(`${sourcePath}/assets/dna_logo.png`)) {
      fs.copyFileSync(`${sourcePath}/assets/dna_logo.png`, './android/app/src/main/res/drawable/dna_logo.png');
      console.log(`✅ Copied logo to Android directory for ${clientName}`);
    }

    // Copy logo to iOS directory
    if (fs.existsSync(`${sourcePath}/assets/dna_logo.png`)) {
      fs.copyFileSync(`${sourcePath}/assets/dna_logo.png`, './ios/ISPApp/dna_logo.png');
      console.log(`✅ Copied logo to iOS directory for ${clientName}`);
    }

    // Copy Android app icons
    if (fs.existsSync(`${sourcePath}/app-icons/android`)) {
      fs.cpSync(`${sourcePath}/app-icons/android`, './android/app/src/main/res', { recursive: true, force: true });
      console.log(`✅ Copied Android app icons for ${clientName}`);
    }

    // Copy iOS app icons
    if (fs.existsSync(`${sourcePath}/app-icons/ios`)) {
      fs.cpSync(`${sourcePath}/app-icons/ios`, './ios/ISPApp/Images.xcassets', { recursive: true, force: true });
      console.log(`✅ Copied iOS app icons for ${clientName}`);
    }

    // Copy Android strings.xml (app name)
    if (fs.existsSync(`${sourcePath}/android-strings.xml`)) {
      fs.copyFileSync(`${sourcePath}/android-strings.xml`, './android/app/src/main/res/values/strings.xml');
      console.log(`✅ Copied Android strings.xml for ${clientName}`);
    }

    // Copy iOS Info.plist (app name)
    if (fs.existsSync(`${sourcePath}/ios-Info.plist`)) {
      fs.copyFileSync(`${sourcePath}/ios-Info.plist`, './ios/ISPApp/Info.plist');
      console.log(`✅ Copied iOS Info.plist for ${clientName}`);
    }

    // Copy strings.json
    if (fs.existsSync(`${sourcePath}/strings.json`)) {
      fs.copyFileSync(`${sourcePath}/strings.json`, './src/config/client-strings.json');
      console.log(`✅ Copied strings.json for ${clientName}`);
    }

    // Copy Android build.gradle
    if (fs.existsSync(`${sourcePath}/android-build.gradle`)) {
      fs.copyFileSync(`${sourcePath}/android-build.gradle`, './android/app/build.gradle');
      console.log(`✅ Copied Android build.gradle for ${clientName}`);
    }

    // Copy keystore files to Android app directory
    const keystoreFiles = fs.readdirSync(sourcePath).filter(file => file.endsWith('.jks'));
    keystoreFiles.forEach(keystoreFile => {
      const sourceKeystore = `${sourcePath}/${keystoreFile}`;
      const targetKeystore = `./android/app/${keystoreFile}`;
      fs.copyFileSync(sourceKeystore, targetKeystore);
      console.log(`✅ Copied keystore file: ${keystoreFile} for ${clientName}`);
    });

    // Keystore configuration is now inline in build.gradle - no need to copy external file

    // Copy logo config
    if (fs.existsSync(`${sourcePath}/logo-config.json`)) {
      fs.copyFileSync(`${sourcePath}/logo-config.json`, './src/config/logo-config.json');
      console.log(`✅ Copied logo config for ${clientName}`);
    }

    // Update current client configuration
    const currentClientConfig = { clientId: clientName };
    fs.writeFileSync('./src/config/current-client.json', JSON.stringify(currentClientConfig, null, 2));
    console.log(`✅ Updated current client configuration to: ${clientName}`);

    // Switch Java package based on client
    switchJavaPackage(clientName);

    // Fix iOS AppDelegate module name
    fixIOSAppDelegate(clientName);

    // Fix generated file if it exists
    try {
      require('./fix-generated-file.js');
    } catch (error) {
      console.log('⚠️ Could not fix generated file (may not exist yet)');
    }

    console.log(`🎉 Configuration copied successfully for ${clientName}`);
    console.log(`📱 You can now build the app for ${clientName}`);
    
  } catch (error) {
    console.error(`❌ Error copying files:`, error);
    process.exit(1);
  }
};

// Function to continuously fix the generated file
const startFixMonitor = (clientName) => {
  const fixGeneratedFile = require('./fix-generated-file.js');
  
  // Run fix immediately
  fixGeneratedFile();
  
  // Set up interval to check and fix every 2 seconds during build
  const interval = setInterval(() => {
    try {
      fixGeneratedFile();
    } catch (error) {
      // Ignore errors during monitoring
    }
  }, 2000);
  
  // Stop monitoring after 5 minutes
  setTimeout(() => {
    clearInterval(interval);
  }, 300000);
  
  console.log('🔧 Auto-fixing generated file during build...');
};

copyFiles();

// Start monitoring if this is a dev build
if (process.argv.includes('--monitor')) {
  startFixMonitor(clientName);
} 