#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Client configurations
const CLIENTS = {
  microscan: {
    name: 'Microscan',
    packageName: 'com.microscan.app',
    namespace: 'com.microscan.app',
    versionCode: 33,
    versionName: '33.0.0',
    keystore: 'Log2SpaceEndUserMicroscan.jks',
    configDir: 'config/microscan',
  },
  'dna-infotel': {
    name: 'DNA Infotel',
    packageName: 'com.h8.dnasubscriber',
    namespace: 'com.h8.dnasubscriber',
    versionCode: 294,
    versionName: '294.0.0',
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
  linkway: {
    name: 'Linkway',
    packageName: 'com.spacecom.log2space.linkway',
    namespace: 'com.spacecom.log2space.linkway',
    versionCode: 1,
    versionName: '1.0.0',
    keystore: 'Linkway.jks',
    configDir: 'config/linkway',
  },
  'dna-goa': {
    name: 'DNA Goa',
    packageName: 'com.dnagoa',
    namespace: 'com.dnagoa',
    versionCode: 4,
    versionName: '4.0.0',
    keystore: 'Log2spaceDNAGoaAppKey.jks',
    configDir: 'config/dna-goa',
  },
  netplanet: {
    name: 'Net Planet',
    packageName: 'com.spacecom.log2space.netplanet',
    namespace: 'com.spacecom.log2space.netplanet',
    versionCode: 1,
    versionName: '1.0.0',
    keystore: 'NetPlanet.jks',
    configDir: 'config/netplanet',
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, client) {
  log(`🏗️  ${step} for ${client}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Copy files from client config to app
function copyClientConfig(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  logStep('Copying configuration', client.name);

  const configDir = path.join(__dirname, '..', client.configDir);
  const appDir = path.join(__dirname, '..');

  // Copy app.json
  const appJsonSrc = path.join(configDir, 'app.json');
  const appJsonDest = path.join(appDir, 'app.json');
  if (fs.existsSync(appJsonSrc)) {
    fs.copyFileSync(appJsonSrc, appJsonDest);
    logSuccess('Copied app.json');
  }

  // NOTE: api.ts is no longer copied per client.
  // The shared src/services/api.ts dynamically handles client configuration.
  log('ℹ️  Skipping api.ts copy (shared dynamic API in use)', 'blue');

  // Copy assets
  const assetsSrc = path.join(configDir, 'assets');
  const assetsDest = path.join(appDir, 'src', 'assets');
  if (fs.existsSync(assetsSrc)) {
    execSync(`cp -r "${assetsSrc}"/* "${assetsDest}/"`, { stdio: 'inherit' });
    logSuccess('Copied assets');
  }

  // Copy Android app icons
  const androidIconsSrc = path.join(configDir, 'app-icons', 'android');
  const androidIconsDest = path.join(appDir, 'android', 'app', 'src', 'main', 'res');
  if (fs.existsSync(androidIconsSrc)) {
    execSync(`cp -r "${androidIconsSrc}"/* "${androidIconsDest}/"`, { stdio: 'inherit' });
    logSuccess('Copied Android app icons');
  }

  // Copy iOS app icons
  const iosIconsSrc = path.join(configDir, 'app-icons', 'ios');
  const iosIconsDest = path.join(appDir, 'ios', 'ISPApp', 'Images.xcassets');
  if (fs.existsSync(iosIconsSrc)) {
    execSync(`cp -r "${iosIconsSrc}"/* "${iosIconsDest}/"`, { stdio: 'inherit' });
    logSuccess('Copied iOS app icons');
  }

  // Copy Android strings
  const stringsSrc = path.join(configDir, 'android-strings.xml');
  const stringsDest = path.join(appDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  if (fs.existsSync(stringsSrc)) {
    fs.copyFileSync(stringsSrc, stringsDest);
    logSuccess('Copied Android strings.xml');
  }

  // Copy iOS Info.plist
  const infoPlistSrc = path.join(configDir, 'ios-Info.plist');
  const infoPlistDest = path.join(appDir, 'ios', 'ISPApp', 'Info.plist');
  if (fs.existsSync(infoPlistSrc)) {
    fs.copyFileSync(infoPlistSrc, infoPlistDest);
    logSuccess('Copied iOS Info.plist');
  }

  // Copy strings.json
  const stringsJsonSrc = path.join(configDir, 'strings.json');
  const stringsJsonDest = path.join(appDir, 'src', 'config', 'client-strings.json');
  if (fs.existsSync(stringsJsonSrc)) {
    fs.copyFileSync(stringsJsonSrc, stringsJsonDest);
    logSuccess('Copied strings.json');
  }

  // Update current-client.json so app picks correct configuration
  const currentClientPath = path.join(appDir, 'src', 'config', 'current-client.json');
  const currentClientData = {
    clientId,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(currentClientPath, JSON.stringify(currentClientData, null, 2));
  logSuccess(`Updated current-client.json to ${clientId}`);

  // Copy keystore file
  const keystoreSrc = path.join(configDir, client.keystore);
  const keystoreDest = path.join(appDir, 'android', 'app', client.keystore);
  if (fs.existsSync(keystoreSrc)) {
    fs.copyFileSync(keystoreSrc, keystoreDest);
    logSuccess(`Copied keystore file: ${client.keystore}`);
  }

  // Copy keystore configuration
  const keystoreConfigSrc = path.join(configDir, 'keystore-config.gradle');
  const keystoreConfigDest = path.join(appDir, 'android', 'app', 'keystore-config.gradle');
  if (fs.existsSync(keystoreConfigSrc)) {
    fs.copyFileSync(keystoreConfigSrc, keystoreConfigDest);
    logSuccess('Copied keystore configuration');
  }

  // Copy logo config
  const logoConfigSrc = path.join(configDir, 'logo-config.json');
  const logoConfigDest = path.join(appDir, 'src', 'config', 'logo-config.json');
  if (fs.existsSync(logoConfigSrc)) {
    fs.copyFileSync(logoConfigSrc, logoConfigDest);
    logSuccess('Copied logo config');
  }
}

// Update Android build.gradle with client-specific settings
function updateAndroidBuildGradle(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  logStep('Updating Android build.gradle', client.name);

  const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
  let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

  // Read keystore config to extract passwords and aliases
  const keystoreConfigPath = path.join(__dirname, '..', client.configDir, 'keystore-config.gradle');
  let releaseStorePassword = 'dnasubscriber'; // fallback
  let releaseKeyAlias = 'dnasubscriber'; // fallback
  let releaseKeyPassword = 'dnasubscriber'; // fallback

  if (fs.existsSync(keystoreConfigPath)) {
    const keystoreConfigContent = fs.readFileSync(keystoreConfigPath, 'utf8');
    // Extract release config values (handle any order)
    const releaseBlock = keystoreConfigContent.match(/release\s*\{([^}]+)\}/s);
    if (releaseBlock) {
      const releaseContent = releaseBlock[1];
      const storePasswordMatch = releaseContent.match(/storePassword\s+['"]([^'"]+)['"]/);
      const keyAliasMatch = releaseContent.match(/keyAlias\s+['"]([^'"]+)['"]/);
      const keyPasswordMatch = releaseContent.match(/keyPassword\s+['"]([^'"]+)['"]/);
      
      if (storePasswordMatch) releaseStorePassword = storePasswordMatch[1];
      if (keyAliasMatch) releaseKeyAlias = keyAliasMatch[1];
      if (keyPasswordMatch) releaseKeyPassword = keyPasswordMatch[1];
    }
  }

  // Update namespace
  buildGradleContent = buildGradleContent.replace(
    /namespace\s+["'][^"']+["']/,
    `namespace "${client.namespace}"`
  );

  // Update applicationId
  buildGradleContent = buildGradleContent.replace(
    /applicationId\s+["'][^"']+["']/,
    `applicationId "${client.packageName}"`
  );

  // Update versionCode
  buildGradleContent = buildGradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${client.versionCode}`
  );

  // Update versionName
  buildGradleContent = buildGradleContent.replace(
    /versionName\s+["'][^"']+["']/,
    `versionName "${client.versionName}"`
  );

  // Ensure debug signing config uses default debug keystore
  buildGradleContent = buildGradleContent.replace(
    /(debug\s*\{[^}]*storeFile\s+file\(['"])[^'"]+(['"])/s,
    `$1debug.keystore$2`
  );
  buildGradleContent = buildGradleContent.replace(
    /(debug\s*\{[^}]*storePassword\s+['"])[^'"]+(['"])/s,
    `$1android$2`
  );
  buildGradleContent = buildGradleContent.replace(
    /(debug\s*\{[^}]*keyAlias\s+['"])[^'"]+(['"])/s,
    `$1androiddebugkey$2`
  );
  buildGradleContent = buildGradleContent.replace(
    /(debug\s*\{[^}]*keyPassword\s+['"])[^'"]+(['"])/s,
    `$1android$2`
  );

  // Update keystore file reference in release config
  buildGradleContent = buildGradleContent.replace(
    /(release\s*\{[^}]*storeFile\s+file\(['"])[^'"]+(['"])/s,
    `$1${client.keystore}$2`
  );

  // Update release storePassword
  buildGradleContent = buildGradleContent.replace(
    /(release\s*\{[^}]*storePassword\s+['"])[^'"]+(['"])/s,
    `$1${releaseStorePassword}$2`
  );

  // Update release keyAlias
  buildGradleContent = buildGradleContent.replace(
    /(release\s*\{[^}]*keyAlias\s+['"])[^'"]+(['"])/s,
    `$1${releaseKeyAlias}$2`
  );

  // Update release keyPassword
  buildGradleContent = buildGradleContent.replace(
    /(release\s*\{[^}]*keyPassword\s+['"])[^'"]+(['"])/s,
    `$1${releaseKeyPassword}$2`
  );

  fs.writeFileSync(buildGradlePath, buildGradleContent);
  logSuccess('Updated Android build.gradle');
}

// Update iOS AppDelegate
function updateIOSAppDelegate(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  logStep('Updating iOS AppDelegate', client.name);

  const appDelegatePath = path.join(__dirname, '..', 'ios', 'ISPApp', 'AppDelegate.swift');
  let appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');

  // Update module name
  const moduleName = client.name.replace(/\s+/g, '') + 'App';
  appDelegateContent = appDelegateContent.replace(
    /getMainComponentName\(\)\s*->\s*String\s*\{[^}]+\}/,
    `getMainComponentName() -> String {
        return "${moduleName}"
    }`
  );

  fs.writeFileSync(appDelegatePath, appDelegateContent);
  logSuccess('Updated iOS AppDelegate');
}

// Update Android MainActivity
function updateAndroidMainActivity(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  logStep('Updating Android MainActivity', client.name);

  // Build the correct package path
  const packageParts = client.packageName.split('.');
  const packageDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', ...packageParts);
  const mainActivityPath = path.join(packageDir, 'MainActivity.kt');
  const mainApplicationPath = path.join(packageDir, 'MainApplication.kt');

  // Create package directory if it doesn't exist
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
    logSuccess(`Created package directory: ${packageDir}`);
  }

  // Find a source MainActivity to use as template
  const sourcePaths = [
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'h8', 'dnasubscriber', 'MainActivity.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'microscan', 'app', 'MainActivity.kt'),
  ];
  
  let sourceMainActivity = null;
  for (const sourcePath of sourcePaths) {
    if (fs.existsSync(sourcePath)) {
      sourceMainActivity = sourcePath;
      break;
    }
  }

  if (!sourceMainActivity) {
    throw new Error('Could not find source MainActivity.kt');
  }

  // Read and update MainActivity
  let mainActivityContent = fs.readFileSync(sourceMainActivity, 'utf8');
  const newPackageName = packageParts.join('.');
  const packageRegex = /package\s+[^\s;]+;?/;
  mainActivityContent = mainActivityContent.replace(packageRegex, `package ${newPackageName}`);

  // Update module name
  const moduleName = client.name.replace(/\s+/g, '') + 'App';
  mainActivityContent = mainActivityContent.replace(
    /override\s+fun\s+getMainComponentName\(\)\s*:\s*String\s*=\s*"[^"]*"/,
    `override fun getMainComponentName(): String = "${moduleName}"`
  );

  fs.writeFileSync(mainActivityPath, mainActivityContent);
  logSuccess('Updated Android MainActivity');

  // Also update MainApplication if it exists or needs to be created
  const sourceApplicationPaths = [
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'h8', 'dnasubscriber', 'MainApplication.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'microscan', 'app', 'MainApplication.kt'),
  ];
  
  let sourceMainApplication = null;
  for (const sourcePath of sourceApplicationPaths) {
    if (fs.existsSync(sourcePath)) {
      sourceMainApplication = sourcePath;
      break;
    }
  }

  if (sourceMainApplication) {
    let mainApplicationContent = fs.readFileSync(sourceMainApplication, 'utf8');
    mainApplicationContent = mainApplicationContent.replace(packageRegex, `package ${newPackageName}`);
    fs.writeFileSync(mainApplicationPath, mainApplicationContent);
    logSuccess('Updated Android MainApplication');
  }
}

// Build APK for a specific client
function buildAPK(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  logStep('Building APK', client.name);

  const androidDir = path.join(__dirname, '..', 'android');
  
  try {
    // Clean previous builds
    execSync('./gradlew clean', { cwd: androidDir, stdio: 'inherit' });
    logSuccess('Cleaned previous builds');

    // Build APK using Gradle flavor
    const flavorName = clientId.replace('-', '');
    execSync(`./gradlew assemble${flavorName.charAt(0).toUpperCase() + flavorName.slice(1)}Release`, { 
      cwd: androidDir, 
      stdio: 'inherit' 
    });
    logSuccess(`Built APK for ${client.name}`);

    // Copy APK to project root with client name
    const apkSource = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    const apkDest = path.join(__dirname, '..', `${clientId}-app.apk`);
    
    if (fs.existsSync(apkSource)) {
      fs.copyFileSync(apkSource, apkDest);
      logSuccess(`APK copied to: ${apkDest}`);
    } else {
      logError('APK not found after build');
    }

  } catch (error) {
    logError(`Failed to build APK for ${client.name}: ${error.message}`);
    throw error;
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const clientId = args[1];

  if (!command) {
    log('Usage:', 'bright');
    log('  node build-client-enhanced.js switch <client-id>', 'yellow');
    log('  node build-client-enhanced.js build <client-id>', 'yellow');
    log('  node build-client-enhanced.js build-all', 'yellow');
    log('');
    log('Available clients:', 'bright');
    Object.keys(CLIENTS).forEach(client => {
      log(`  - ${client}`, 'cyan');
    });
    process.exit(1);
  }

  try {
    switch (command) {
      case 'switch':
        if (!clientId || !CLIENTS[clientId]) {
          logError(`Invalid client: ${clientId}`);
          log('Available clients:', 'bright');
          Object.keys(CLIENTS).forEach(client => {
            log(`  - ${client}`, 'cyan');
          });
          process.exit(1);
        }

        log(`🔄 Switching to ${CLIENTS[clientId].name}`, 'magenta');
        copyClientConfig(clientId);
        updateAndroidBuildGradle(clientId);
        updateIOSAppDelegate(clientId);
        updateAndroidMainActivity(clientId);
        logSuccess(`Configuration switched to ${CLIENTS[clientId].name}`);
        break;

      case 'build':
        if (!clientId || !CLIENTS[clientId]) {
          logError(`Invalid client: ${clientId}`);
          process.exit(1);
        }

        log(`🏗️  Building APK for ${CLIENTS[clientId].name}`, 'magenta');
        copyClientConfig(clientId);
        updateAndroidBuildGradle(clientId);
        updateIOSAppDelegate(clientId);
        updateAndroidMainActivity(clientId);
        buildAPK(clientId);
        logSuccess(`Build completed for ${CLIENTS[clientId].name}`);
        break;

      case 'build-all':
        log('🏗️  Building APKs for all clients', 'magenta');
        Object.keys(CLIENTS).forEach(client => {
          try {
            log(`\n📱 Building ${CLIENTS[client].name}...`, 'bright');
            copyClientConfig(client);
            updateAndroidBuildGradle(client);
            updateIOSAppDelegate(client);
            updateAndroidMainActivity(client);
            buildAPK(client);
            logSuccess(`✅ ${CLIENTS[client].name} build completed`);
          } catch (error) {
            logError(`❌ Failed to build ${CLIENTS[client].name}: ${error.message}`);
          }
        });
        logSuccess('All builds completed');
        break;

      default:
        logError(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  CLIENTS,
  copyClientConfig,
  updateAndroidBuildGradle,
  updateIOSAppDelegate,
  updateAndroidMainActivity,
  buildAPK,
}; 