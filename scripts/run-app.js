#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIENTS = {
  microscan: {
    name: 'Microscan',
    packageName: 'in.spacecom.log2space.client.microscan',
    namespace: 'in.spacecom.log2space.client.microscan',
    versionCode: 40,
    versionName: '40.0.0',
    keystore: 'Log2SpaceEndUserMicroscan.jks',
    configDir: 'config/microscan',
  },
  'dna-infotel': {
    name: 'DNA Infotel',
    packageName: 'com.h8.dnasubscriber',
    namespace: 'com.h8.dnasubscriber',
    versionCode: 296,
    versionName: '296.0.0',
    keystore: 'Log2spaceDNAInfotelAppKey.jks',
    configDir: 'config/dna-infotel',
  },
  'logon-broadband': {
    name: 'Logon Broadband',
    packageName: 'com.logon.broadband',
    namespace: 'com.logon.broadband',
    versionCode: 1,
    versionName: '1.0.0',
    keystore: 'LogonBroadband.jks',
    configDir: 'config/logon-broadband',
  },
  'dna-goa': {
    name: 'DNA Goa',
    packageName: 'com.spacecom.log2space.dnagoa',
    namespace: 'com.spacecom.log2space.dnagoa',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'Log2spaceDNAGoaKey_V3.jks',
    configDir: 'config/dna-goa',
  },
  'spacecom-live': {
    name: 'Spacecom Live',
    // Base Android identifiers; actual values are refined from config/spacecom-live/build-config.json
    packageName: 'com.spacecom.log2space.spacecomlive',
    namespace: 'com.spacecom.log2space.spacecomlive',
    versionCode: 298,
    versionName: '298.0.0',
    keystore: 'Log2spaceDNAInfotelAppKey.jks',
    configDir: 'config/spacecom-live',
  },
};

function loadBuildConfig(configDir) {
  const buildConfigPath = path.join(configDir, 'build-config.json');
  if (!fs.existsSync(buildConfigPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(buildConfigPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`⚠️  Unable to parse build-config.json in ${configDir}: ${error.message}`);
    return null;
  }
}

function getAndroidSettings(client, buildConfig) {
  const android = buildConfig?.android || {};

  return {
    namespace: android.namespace || client.namespace || client.packageName,
    applicationId: android.applicationId || client.packageName,
    versionCode: android.versionCode || client.versionCode,
    versionName: android.versionName || client.versionName,
    signing: android.signing,
  };
}

function buildSigningBlock(signing) {
  if (!signing?.release) {
    return null;
  }

  const debug = signing.debug || {
    storeFile: 'debug.keystore',
    storePassword: 'android',
    keyAlias: 'androiddebugkey',
    keyPassword: 'android',
  };

  const formatBlock = (name, cfg) => [
    `        ${name} {`,
    `            storeFile file('${cfg.storeFile}')`,
    `            storePassword '${cfg.storePassword}'`,
    `            keyAlias '${cfg.keyAlias}'`,
    `            keyPassword '${cfg.keyPassword}'`,
    '        }',
  ].join('\n');

  return [
    '    signingConfigs {',
    formatBlock('debug', debug),
    formatBlock('release', signing.release),
    '    }',
  ].join('\n');
}

function updateAndroidBuildGradle(androidSettings) {
  if (!androidSettings) {
    return;
  }

  const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  if (androidSettings.namespace) {
    buildGradle = buildGradle.replace(
      /namespace\s+"[^"]*"/,
      `namespace "${androidSettings.namespace}"`
    );
  }

  if (androidSettings.applicationId) {
    buildGradle = buildGradle.replace(
      /applicationId\s+"[^"]*"/,
      `applicationId "${androidSettings.applicationId}"`
    );
  }

  if (androidSettings.versionCode) {
    buildGradle = buildGradle.replace(
      /versionCode\s+\d+/,
      `versionCode ${androidSettings.versionCode}`
    );
  }

  if (androidSettings.versionName) {
    buildGradle = buildGradle.replace(
      /versionName\s+"[^"]*"/,
      `versionName "${androidSettings.versionName}"`
    );
  }

  const signingBlock = buildSigningBlock(androidSettings.signing);
  if (signingBlock) {
    const signingRegex = /signingConfigs\s*{[\s\S]*?}\s*(?=buildTypes\s*{)/;
    if (signingRegex.test(buildGradle)) {
      buildGradle = buildGradle.replace(signingRegex, `${signingBlock}\n\n    `);
    }
  }

  fs.writeFileSync(buildGradlePath, buildGradle);
  console.log('✅ Updated android/app/build.gradle');
}

function getIosSettings(client, buildConfig) {
  const ios = buildConfig?.ios;
  if (!ios) {
    return null;
  }

  return {
    bundleIdentifier: ios.bundleIdentifier,
    marketingVersion: ios.marketingVersion,
    buildNumber: ios.buildNumber,
    displayName: ios.displayName || client.name,
  };
}

function updateInfoPlist(displayName) {
  if (!displayName) {
    return;
  }

  const infoPlistPath = path.join(__dirname, '../ios/ISPApp/Info.plist');
  let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
  const displayNameRegex = /<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/;

  if (displayNameRegex.test(infoPlist)) {
    infoPlist = infoPlist.replace(
      displayNameRegex,
      `<key>CFBundleDisplayName</key>\n\t<string>${displayName}</string>`
    );
    fs.writeFileSync(infoPlistPath, infoPlist);
  }
}

function updateIosProject(iosSettings) {
  if (!iosSettings) {
    return;
  }

  const pbxProjPath = path.join(__dirname, '../ios/ISPApp.xcodeproj/project.pbxproj');
  let pbxProj = fs.readFileSync(pbxProjPath, 'utf8');

  if (iosSettings.bundleIdentifier) {
    pbxProj = pbxProj.replace(
      /PRODUCT_BUNDLE_IDENTIFIER = "[^"]+";/g,
      `PRODUCT_BUNDLE_IDENTIFIER = "${iosSettings.bundleIdentifier}";`
    );
    pbxProj = pbxProj.replace(
      /"PRODUCT_BUNDLE_IDENTIFIER\[sdk=iphoneos\*\]" = [^;]+;/g,
      `"PRODUCT_BUNDLE_IDENTIFIER[sdk=iphoneos*]" = ${iosSettings.bundleIdentifier};`
    );
  }

  if (iosSettings.marketingVersion) {
    pbxProj = pbxProj.replace(
      /MARKETING_VERSION = [^;]+;/g,
      `MARKETING_VERSION = ${iosSettings.marketingVersion};`
    );
  }

  if (iosSettings.buildNumber) {
    pbxProj = pbxProj.replace(
      /CURRENT_PROJECT_VERSION = [^;]+;/g,
      `CURRENT_PROJECT_VERSION = ${iosSettings.buildNumber};`
    );
  }

  if (iosSettings.displayName) {
    const escapedDisplayName = iosSettings.displayName.replace(/"/g, '\\"');
    pbxProj = pbxProj.replace(
      /INFOPLIST_KEY_CFBundleDisplayName = [^;]+;/g,
      `INFOPLIST_KEY_CFBundleDisplayName = "${escapedDisplayName}";`
    );
    updateInfoPlist(iosSettings.displayName);
  }

  fs.writeFileSync(pbxProjPath, pbxProj);
  console.log('✅ Updated iOS project settings');
}

function updateIosModuleName(moduleName) {
  if (!moduleName) {
    return;
  }

  const appDelegatePath = path.join(__dirname, '../ios/ISPApp/AppDelegate.swift');
  if (!fs.existsSync(appDelegatePath)) {
    return;
  }

  let appDelegate = fs.readFileSync(appDelegatePath, 'utf8');
  const moduleRegex = /withModuleName:\s*"[^"]+"/;
  const newValue = `withModuleName: "${moduleName}"`;

  if (moduleRegex.test(appDelegate)) {
    appDelegate = appDelegate.replace(moduleRegex, newValue);
    fs.writeFileSync(appDelegatePath, appDelegate);
    console.log(`✅ Updated AppDelegate module name to ${moduleName}`);
  }
}

function switchClient(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    console.error(`❌ Unknown client: ${clientId}`);
    console.log(`Available clients: ${Object.keys(CLIENTS).join(', ')}`);
    process.exit(1);
  }

  console.log(`🔄 Switching to ${client.name}...`);

  const configDir = path.join(__dirname, '..', client.configDir);
  const buildConfig = loadBuildConfig(configDir);

  const androidSettings = getAndroidSettings(client, buildConfig);
  updateAndroidBuildGradle(androidSettings);

  const iosSettings = getIosSettings(client, buildConfig);
  updateIosProject(iosSettings);

  // Copy client-specific assets
  if (fs.existsSync(configDir)) {
    console.log(`📁 Copying ${client.name} assets...`);
    // Copy app icons
    const androidIconsDir = path.join(configDir, 'app-icons', 'android');
    const targetIconsDir = path.join(__dirname, '../android/app/src/main/res');
    
    if (fs.existsSync(androidIconsDir)) {
      // Remove existing icons first
      execSync(`rm -rf ${targetIconsDir}/mipmap-* ${targetIconsDir}/drawable/*`, { stdio: 'inherit' });
      // Copy new icons
      execSync(`cp -r ${androidIconsDir}/* ${targetIconsDir}/`, { stdio: 'inherit' });
    }
    
    // Copy other assets
    const assetsDir = path.join(configDir, 'assets');
    const targetAssetsDir = path.join(__dirname, '../src/assets');
    
    if (fs.existsSync(assetsDir)) {
      execSync(`cp -r ${assetsDir}/* ${targetAssetsDir}/`, { stdio: 'inherit' });
    }

    // Copy logo-config.json to src/config
    const logoConfigSrc = path.join(configDir, 'logo-config.json');
    const logoConfigDest = path.join(__dirname, '../src/config/logo-config.json');
    if (fs.existsSync(logoConfigSrc)) {
      fs.copyFileSync(logoConfigSrc, logoConfigDest);
      console.log('✅ Copied logo-config.json');
    }

    // Copy client-strings.json to src/config
    const clientStringsSrc = path.join(configDir, 'strings.json');
    const clientStringsDest = path.join(__dirname, '../src/config/client-strings.json');
    if (fs.existsSync(clientStringsSrc)) {
      fs.copyFileSync(clientStringsSrc, clientStringsDest);
      console.log('✅ Copied client-strings.json');
    }

    // Copy Android strings.xml
    const androidStringsSrc = path.join(configDir, 'android-strings.xml');
    const androidStringsDest = path.join(__dirname, '../android/app/src/main/res/values/strings.xml');
    if (fs.existsSync(androidStringsSrc)) {
      fs.copyFileSync(androidStringsSrc, androidStringsDest);
      console.log('✅ Copied Android strings.xml');
    }

    // Copy app.json to root
    const appJsonSrc = path.join(configDir, 'app.json');
    const appJsonDest = path.join(__dirname, '../app.json');
    let appName = null;
    if (fs.existsSync(appJsonSrc)) {
      try {
        const appJsonRaw = fs.readFileSync(appJsonSrc, 'utf8');
        const appJson = JSON.parse(appJsonRaw);
        appName = appJson?.name;
      } catch (error) {
        console.warn(`⚠️  Unable to parse app.json in ${configDir}: ${error.message}`);
      }
      fs.copyFileSync(appJsonSrc, appJsonDest);
      console.log('✅ Copied app.json');
    }

    if (appName) {
      updateIosModuleName(appName);
    }

    // Update current-client.json
    const currentClientDest = path.join(__dirname, '../src/config/current-client.json');
    const currentClientData = {
      clientId,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(currentClientDest, `${JSON.stringify(currentClientData, null, 2)}\n`);
    console.log('✅ Updated current-client.json');
  }

  console.log(`✅ Switched to ${client.name}`);
}

function runApp(clientId, platform = 'android') {
  switchClient(clientId);

  console.log(`🚀 Running ${CLIENTS[clientId].name} on ${platform}...`);

  try {
    if (platform === 'ios') {
      execSync('npx react-native run-ios', { stdio: 'inherit' });
    } else {
      execSync('npx react-native run-android', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error(`❌ Failed to run app: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const clientId = args[1];
const platform = args[2] || 'android';

if (!command || !clientId) {
  console.log('Usage: node scripts/run-app.js <command> <client> [platform]');
  console.log('');
  console.log('Commands:');
  console.log('  switch <client>     - Switch to specified client');
  console.log('  run <client> [ios|android] - Run app for specified client');
  console.log('');
  console.log('Clients:');
  Object.keys(CLIENTS).forEach(id => {
    console.log(`  ${id} - ${CLIENTS[id].name}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/run-app.js switch microscan');
  console.log('  node scripts/run-app.js run microscan android');
  console.log('  node scripts/run-app.js run dna-infotel ios');
  process.exit(1);
}

if (command === 'switch') {
  switchClient(clientId);
} else if (command === 'run') {
  runApp(clientId, platform);
} else {
  console.error(`❌ Unknown command: ${command}`);
  process.exit(1);
} 