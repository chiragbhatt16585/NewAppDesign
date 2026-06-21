#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Client configurations
const CLIENTS = {
  microscan: {
    name: 'Microscan',
    // Must match OLD app (microscanEndUserApp-master-new) so install overwrites and migration works.
    packageName: 'in.spacecom.log2space.client.microscan',
    namespace: 'in.spacecom.log2space.client.microscan',
    versionCode: 42,
    versionName: '1.0.1',
    // Use original Microscan upload key for Play Store (SHA1: 08:1C:A0:54:CA:45:95:5B:B3:8B:3A:B8:B2:53:93:FA:F5:64:D0:AE)
    keystore: 'Log2SpaceEndUserMicroscan.jks',
    configDir: 'config/microscan',
  },
  'dna-infotel': {
    name: 'DNA Infotel',
    packageName: 'com.h8.dnasubscriber',
    namespace: 'com.h8.dnasubscriber',
    versionCode: 298,
    versionName: '1.0.298',
    keystore: 'Log2spaceDNAInfotelAppKey.jks',
    configDir: 'config/dna-infotel',
  },
  'logon-broadband': {
    name: 'Logon Broadband',
    packageName: 'com.logon.broadband',
    namespace: 'com.logon.broadband',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'LogonBroadband.jks',
    configDir: 'config/logon-broadband',
  },
  linkway: {
    name: 'Linkway',
    packageName: 'com.spacecom.log2space.linkway',
    namespace: 'com.spacecom.log2space.linkway',
    versionCode: 7,
    versionName: '1.0.1',
    keystore: 'Linkway.jks',
    configDir: 'config/linkway',
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
  gatewayftth: {
    name: 'Gateway FTTH',
    packageName: 'com.spacecom.log2space.gatewayftth',
    namespace: 'com.spacecom.log2space.gatewayftth',
    versionCode: 1,
    versionName: '1.0.1',
    // For now we use the debug keystore; configure a real release keystore later
    keystore: 'Log2spceGatewayFTTHKey_V3.jks',
    configDir: 'config/gatewayftth',
  },
  netfix: {
    name: 'Netfix',
    packageName: 'in.spacecom.log2space.client.netfix',
    namespace: 'in.spacecom.log2space.client.netfix',
    versionCode: 3,
    versionName: '1.0.1',
    keystore: 'Log2spaceNetfix.keystore',
    configDir: 'config/netfix',
  },
  'inshansa-dnagoa': {
    name: 'Inshansa',
    packageName: 'com.spacecom.log2space.inshansa',
    namespace: 'com.spacecom.log2space.inshansa',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'Log2spaceInsHansaAppKey.jks',
    configDir: 'config/inshansa-dnagoa',
  },
  'spacecom-local': {
    name: 'Spacecom Local',
    packageName: 'com.log2space.spacecom.local',
    namespace: 'com.log2space.spacecom.local',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'Log2SpaceEndUserMicroscan.jks',
    configDir: 'config/spacecom-local',
  },
  'threesa-infoway': {
    name: 'Threesa Infoway',
    packageName: 'in.spacecom.log2space.client.threesa',
    namespace: 'in.spacecom.log2space.client.threesa',
    versionCode: 6,
    versionName: '1.0.6',
    keystore: 'Log2SpaceClientThreesaBroadband.jks',
    configDir: 'config/threesa-infoway',
  },
  'spacecom-live': {
    name: 'Spacecom Live',
    packageName: 'com.spacecom.log2space.spacecomlive',
    namespace: 'com.spacecom.log2space.spacecomlive',
    versionCode: 299,
    versionName: '1.0.1',
    keystore: 'Log2spaceDNAInfotelAppKey.jks',
    configDir: 'config/spacecom-live',
  },
  netplanet: {
    name: 'Net Planet',
    packageName: 'com.spacecom.log2space.netplanet',
    namespace: 'com.spacecom.log2space.netplanet',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'Log2spaceNetPlanetAppKey.jks',
    configDir: 'config/netplanet',
  },
  metanet: {
    name: 'Metanet',
    packageName: 'com.spacecom.log2space.metanet',
    namespace: 'com.spacecom.log2space.metanet',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'MetanetAppKey.jks',
    configDir: 'config/metanet',
  },
  comcast: {
    name: 'Comcast',
    packageName: 'in.spacecom.log2space.client.comcastBroadband',
    namespace: 'in.spacecom.log2space.client.comcastBroadband',
    versionCode: 14,
    versionName: '1.0.14',
    keystore: 'Log2SpaceComcastBroadband.jks',
    configDir: 'config/comcast',
  },
  successbroadband: {
    name: 'Success Broadband',
    packageName: 'com.spacecom.log2space.successbroadband',
    namespace: 'com.spacecom.log2space.successbroadband',
    versionCode: 3,
    versionName: '1.0.3',
    keystore: 'Log2spaceSuccessBroadbandAppKey.jks',
    configDir: 'config/successbroadband',
  },
  'one-sevenstar': {
    name: 'One Seven Star',
    packageName: 'com.spacecom.log2space.onesevenstar',
    namespace: 'com.spacecom.log2space.onesevenstar',
    versionCode: 3,
    versionName: '3.0.0',
    keystore: 'OneSevenStar.jks',
    configDir: 'config/one-sevenstar',
  },
  graceway: {
    name: 'Graceway',
    packageName: 'com.spacecom.log2space.graceway',
    namespace: 'com.spacecom.log2space.graceway',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'Graceway.jks',
    configDir: 'config/graceway',
  },
  'log2space-common': {
    name: 'Log2space',
    packageName: 'in.spacecom.log2space.user',
    namespace: 'in.spacecom.log2space.user',
    versionCode: 14,
    versionName: '1.0.14',
    keystore: 'log2space.jks',
    configDir: 'config/log2space-common',
  },
  skynetwifi: {
    name: 'Skynetwifi',
    packageName: 'com.spacecom.log2space.skynetwifi',
    namespace: 'com.spacecom.log2space.skynetwifi',
    versionCode: 4,
    versionName: '1.0.4',
    keystore: 'Log2spceSkynetWifiKey_V3.jks',
    configDir: 'config/skynetwifi',
  },
  hdmbroadband: {
    name: 'HDM Broadband',
    packageName: 'in.spacecom.log2space.client.hdmBroadband',
    namespace: 'in.spacecom.log2space.client.hdmBroadband',
    versionCode: 12,
    versionName: '1.0.12',
    keystore: 'Log2SpaceHDMBroadband.jks',
    configDir: 'config/hdmbroadband',
  },
  srisamarthinfobahn: {
    name: 'Srisamarthinfobahn',
    packageName: 'com.spacecom.log2space.srisamarthinfobahn',
    namespace: 'com.spacecom.log2space.srisamarthinfobahn',
    versionCode: 10,
    versionName: '1.0.10',
    // Reuse existing keystore for now
    keystore: 'Log2spceGatewayFTTHKey_V3.jks',
    configDir: 'config/srisamarthinfobahn',
  },
  monarknet: {
    name: 'Monarknet',
    packageName: 'in.spacecom.log2space.client.monarkuser',
    namespace: 'in.spacecom.log2space.client.monarkuser',
    versionCode: 3,
    versionName: '1.0.1',
    keystore: 'Log2spceGatewayFTTHKey_V3.jks',
    configDir: 'config/monarknet',
  },
  funnet: {
    name: 'Funnet',
    packageName: 'com.spacecom.log2space.funnet',
    namespace: 'com.spacecom.log2space.funnet',
    versionCode: 1,
    versionName: '1.0.1',
    keystore: 'Log2spaceFunnetAppKey.jks',
    configDir: 'config/funnet',
  },
  wnet: {
    name: 'Wnet',
    packageName: 'in.spacecom.log2space.client.wnet',
    namespace: 'in.spacecom.log2space.client.wnet',
    versionCode: 7,
    versionName: '7',
    keystore: 'Log2spaceWnetUserAppKey.jks',
    configDir: 'config/wnet',
  },
  indophone: {
    name: 'Indophone',
    packageName: 'com.spacecom.log2space.indophonenetworks',
    namespace: 'com.spacecom.log2space.indophonenetworks',
    versionCode: 5,
    versionName: '1.0.0',
    keystore: 'IndophoneNetwork.jks',
    configDir: 'config/indophone',
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

/** Apply Android adaptive launcher background color from build-config.json */
function applyLauncherIconBackgroundColor(client) {
  const buildConfigPath = path.join(__dirname, '..', client.configDir, 'build-config.json');
  if (!fs.existsSync(buildConfigPath)) {
    return;
  }

  let color;
  try {
    const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
    color = buildConfig?.android?.launcherIconBackgroundColor;
  } catch {
    return;
  }

  if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6,8}$/.test(color.trim())) {
    return;
  }

  const normalized = color.trim();
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">${normalized}</color>\n</resources>\n`;

  const androidValuesDir = path.join(
    __dirname,
    '..',
    'android',
    'app',
    'src',
    'main',
    'res',
    'values',
  );
  const configValuesDir = path.join(
    __dirname,
    '..',
    client.configDir,
    'app-icons',
    'android',
    'values',
  );

  if (!fs.existsSync(androidValuesDir)) {
    fs.mkdirSync(androidValuesDir, { recursive: true });
  }
  fs.writeFileSync(path.join(androidValuesDir, 'ic_launcher_background.xml'), xml);

  if (fs.existsSync(configValuesDir)) {
    fs.writeFileSync(path.join(configValuesDir, 'ic_launcher_background.xml'), xml);
  }

  logSuccess(`Set launcher icon background color to ${normalized}`);
}

// Copy files from client config to app
function copyClientConfig(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  // For new clients we often don't have every binary asset/keystore yet.
  // Reuse GatewayFTTH as a safe fallback for icons/assets/keystore files
  // so the app can still build.
  const fallbackClientId = 'gatewayftth';
  const fallbackClient = CLIENTS[fallbackClientId];
  const fallbackConfigDir = fallbackClient
    ? path.join(__dirname, '..', fallbackClient.configDir)
    : null;

  logStep('Copying configuration', client.name);

  const configDir = path.join(__dirname, '..', client.configDir);
  const appDir = path.join(__dirname, '..');
  const hasUsableFiles = (dirPath) => {
    if (!fs.existsSync(dirPath)) return false;
    const entries = fs.readdirSync(dirPath);
    if (!entries || entries.length === 0) return false;
    // Ignore placeholder docs like README so fallback can still work.
    const usable = entries.some((name) => !/^readme(\..+)?$/i.test(name));
    return usable;
  };

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
  let assetsSrc = path.join(configDir, 'assets');
  if (!hasUsableFiles(assetsSrc) && fallbackConfigDir) {
    const fallbackAssetsSrc = path.join(fallbackConfigDir, 'assets');
    if (hasUsableFiles(fallbackAssetsSrc)) assetsSrc = fallbackAssetsSrc;
  }
  const assetsDest = path.join(appDir, 'src', 'assets');
  if (fs.existsSync(assetsSrc)) {
    execSync(`cp -r "${assetsSrc}"/* "${assetsDest}/"`, { stdio: 'inherit' });
    logSuccess('Copied assets');

    // Clients like skynetwifi use header_logo.png as the primary mark without isp_logo.png.
    // Copy it over isp_logo.png so stale logos from a previous client are not left behind.
    const headerLogoSrc = path.join(assetsSrc, 'header_logo.png');
    const ispLogoInConfig = path.join(assetsSrc, 'isp_logo.png');
    const ispLogoDest = path.join(assetsDest, 'isp_logo.png');
    if (fs.existsSync(headerLogoSrc) && !fs.existsSync(ispLogoInConfig)) {
      fs.copyFileSync(headerLogoSrc, ispLogoDest);
      logSuccess('Copied header_logo.png as isp_logo.png');
    }
  }

  // Copy Android app icons
  let androidIconsSrc = path.join(configDir, 'app-icons', 'android');
  if (!hasUsableFiles(androidIconsSrc) && fallbackConfigDir) {
    const fallbackAndroidIconsSrc = path.join(
      fallbackConfigDir,
      'app-icons',
      'android'
    );
    if (hasUsableFiles(fallbackAndroidIconsSrc))
      androidIconsSrc = fallbackAndroidIconsSrc;
  }
  const androidIconsDest = path.join(appDir, 'android', 'app', 'src', 'main', 'res');
  if (fs.existsSync(androidIconsSrc)) {
    // Copy all icon files and folders (mipmap-*, drawable, etc.)
    execSync(`cp -r "${androidIconsSrc}"/* "${androidIconsDest}/"`, { stdio: 'inherit' });
    
    // Convert filenames to lowercase and replace hyphens with underscores in drawable folders (Android requirement)
    const drawableDirs = ['drawable', 'drawable-hdpi', 'drawable-mdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'];
    drawableDirs.forEach(drawableDir => {
      const drawablePath = path.join(androidIconsDest, drawableDir);
      if (fs.existsSync(drawablePath)) {
        const files = fs.readdirSync(drawablePath);
        files.forEach(file => {
          const filePath = path.join(drawablePath, file);
          if (fs.statSync(filePath).isFile()) {
            // Convert to lowercase and replace hyphens with underscores
            const normalizedFileName = file.toLowerCase().replace(/-/g, '_');
            if (file !== normalizedFileName) {
              const newFilePath = path.join(drawablePath, normalizedFileName);
              fs.renameSync(filePath, newFilePath);
              log(`Renamed ${file} to ${normalizedFileName} in ${drawableDir}`, 'yellow');
            }
          }
        });
      }
    });
    
    // Specifically copy values folder contents to merge with existing values
    const valuesSrc = path.join(androidIconsSrc, 'values');
    const valuesDest = path.join(appDir, 'android', 'app', 'src', 'main', 'res', 'values');
    if (fs.existsSync(valuesSrc)) {
      if (!fs.existsSync(valuesDest)) {
        fs.mkdirSync(valuesDest, { recursive: true });
      }
      execSync(`cp -r "${valuesSrc}"/* "${valuesDest}/"`, { stdio: 'inherit' });
      logSuccess('Copied Android values resources');
    }
    
    logSuccess('Copied Android app icons');
    applyLauncherIconBackgroundColor(client);
  }

  // Copy iOS app icons - copy AppIcon.appiconset directly
  let iosAppIconSrc = path.join(
    configDir,
    'app-icons',
    'ios',
    'AppIcon.appiconset'
  );
  if (!hasUsableFiles(iosAppIconSrc) && fallbackConfigDir) {
    const fallbackIosAppIconSrc = path.join(
      fallbackConfigDir,
      'app-icons',
      'ios',
      'AppIcon.appiconset'
    );
    if (hasUsableFiles(fallbackIosAppIconSrc))
      iosAppIconSrc = fallbackIosAppIconSrc;
  }
  const iosAppIconDest = path.join(appDir, 'ios', 'ISPApp', 'Images.xcassets', 'AppIcon.appiconset');
  if (fs.existsSync(iosAppIconSrc)) {
    // Remove existing AppIcon.appiconset if it exists
    if (fs.existsSync(iosAppIconDest)) {
      execSync(`rm -rf "${iosAppIconDest}"`, { stdio: 'inherit' });
    }
    // Copy the new AppIcon.appiconset
    execSync(`cp -r "${iosAppIconSrc}" "${iosAppIconDest}"`, { stdio: 'inherit' });
    logSuccess('Copied iOS app icons');
  } else {
    logWarning(`iOS app icons not found at ${iosAppIconSrc}`);
  }

  // Copy Android strings
  const stringsSrc = path.join(configDir, 'android-strings.xml');
  const stringsDest = path.join(appDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  if (fs.existsSync(stringsSrc)) {
    fs.copyFileSync(stringsSrc, stringsDest);
    logSuccess('Copied Android strings.xml');
  }

  // Copy iOS Info.plist and ensure UIAppFonts is present
  const infoPlistSrc = path.join(configDir, 'ios-Info.plist');
  const infoPlistDest = path.join(appDir, 'ios', 'ISPApp', 'Info.plist');
  if (fs.existsSync(infoPlistSrc)) {
    // CRITICAL: Validate source file first
    try {
      execSync(`plutil -lint "${infoPlistSrc}"`, { stdio: 'pipe' });
    } catch (validationError) {
      logWarning(`Source Info.plist has XML errors: ${infoPlistSrc}`);
      throw new Error(`Invalid XML in source Info.plist: ${infoPlistSrc}. Please fix the XML structure.`);
    }
    
    let infoPlistContent = fs.readFileSync(infoPlistSrc, 'utf8');
    
    // CRITICAL: Fix NSAppTransportSecurity if UIAppFonts is incorrectly nested inside it
    // Check if UIAppFonts appears inside NSAppTransportSecurity dict
    const nstsWithFontsPattern = /<key>NSAppTransportSecurity<\/key>\s*<dict>([\s\S]*?)<key>UIAppFonts<\/key>([\s\S]*?)<\/array>([\s\S]*?)<\/dict>/;
    if (nstsWithFontsPattern.test(infoPlistContent)) {
      logWarning('Found UIAppFonts incorrectly nested in NSAppTransportSecurity, fixing...');
      // Replace the entire NSAppTransportSecurity block with a clean one
      infoPlistContent = infoPlistContent.replace(
        /<key>NSAppTransportSecurity<\/key>\s*<dict>[\s\S]*?<\/dict>/,
        '<key>NSAppTransportSecurity</key>\n\t<dict>\n\t\t<key>NSAllowsArbitraryLoads</key>\n\t\t<false/>\n\t\t<key>NSAllowsLocalNetworking</key>\n\t\t<true/>\n\t</dict>'
      );
    }
    
    // Check if UIAppFonts already exists at root level (not inside any nested dict)
    // Look for UIAppFonts that appears before the final </dict> tag
    const hasUIAppFontsAtRoot = /<key>UIAppFonts<\/key>\s*<array>[\s\S]*?<\/array>\s*(?=<\/dict>\s*<\/plist>)/.test(infoPlistContent);
    
    if (!hasUIAppFontsAtRoot) {
      // UIAppFonts block to insert - REQUIRED for iOS to recognize vector icon fonts
      const uiAppFonts = `\t<key>UIAppFonts</key>
\t<array>
\t\t<string>AntDesign.ttf</string>
\t\t<string>Entypo.ttf</string>
\t\t<string>EvilIcons.ttf</string>
\t\t<string>Feather.ttf</string>
\t\t<string>FontAwesome.ttf</string>
\t\t<string>FontAwesome5_Brands.ttf</string>
\t\t<string>FontAwesome5_Regular.ttf</string>
\t\t<string>FontAwesome5_Solid.ttf</string>
\t\t<string>Foundation.ttf</string>
\t\t<string>Ionicons.ttf</string>
\t\t<string>MaterialIcons.ttf</string>
\t\t<string>MaterialCommunityIcons.ttf</string>
\t\t<string>SimpleLineIcons.ttf</string>
\t\t<string>Octicons.ttf</string>
\t\t<string>Zocial.ttf</string>
\t\t<string>Fontisto.ttf</string>
\t</array>`;
      
      // CRITICAL: Find the LAST </dict> before </plist> (this is the root dict)
      // Match the pattern: whitespace, </dict>, whitespace, </plist>
      const rootDictPattern = /(\s*)<\/dict>\s*<\/plist>/;
      if (rootDictPattern.test(infoPlistContent)) {
        infoPlistContent = infoPlistContent.replace(rootDictPattern, `${uiAppFonts}\n$1</dict>\n</plist>`);
        log('Added UIAppFonts to Info.plist (required for iOS vector icons)', 'blue');
      } else {
        logWarning('Could not find root </dict> tag pattern, skipping UIAppFonts addition');
      }
    }
    
    // CRITICAL: Validate the final XML before writing
    const tempFile = path.join(appDir, 'ios', 'ISPApp', 'Info.plist.tmp');
    fs.writeFileSync(tempFile, infoPlistContent);
    try {
      execSync(`plutil -lint "${tempFile}"`, { stdio: 'pipe' });
      // If validation passes, move temp file to final location
      fs.renameSync(tempFile, infoPlistDest);
      logSuccess('Copied iOS Info.plist (XML validated)');
    } catch (validationError) {
      // Remove temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      logWarning('Generated Info.plist has XML errors, copying source file as-is');
      // Copy source file as-is to avoid breaking the build
      fs.copyFileSync(infoPlistSrc, infoPlistDest);
      logWarning('Copied source Info.plist without modifications. Please ensure UIAppFonts is in the source file.');
    }
  }

  // Copy Firebase config for Android (google-services.json)
  const googleServicesSrc = path.join(configDir, 'google-services.json');
  const googleServicesDest = path.join(appDir, 'android', 'app', 'google-services.json');
  if (fs.existsSync(googleServicesSrc)) {
    fs.copyFileSync(googleServicesSrc, googleServicesDest);
    logSuccess('Copied google-services.json for Android (Firebase)');
  } else {
    // Do not copy fallback Firebase config from another client.
    logWarning(`google-services.json not found in config/${clientId}; keeping existing android/app/google-services.json unchanged`);
  }

  // Copy Firebase config for iOS (GoogleService-Info.plist)
  const googleServiceInfoSrc = path.join(configDir, 'GoogleService-Info.plist');
  const googleServiceInfoDest = path.join(appDir, 'ios', 'ISPApp', 'GoogleService-Info.plist');
  if (fs.existsSync(googleServiceInfoSrc)) {
    fs.copyFileSync(googleServiceInfoSrc, googleServiceInfoDest);
    logSuccess('Copied GoogleService-Info.plist for iOS (Firebase)');
  } else {
    // Do not copy fallback Firebase config from another client.
    logWarning(`GoogleService-Info.plist not found in config/${clientId}; keeping existing ios/ISPApp/GoogleService-Info.plist unchanged`);
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
  let keystoreSrc = path.join(configDir, client.keystore);
  if (!fs.existsSync(keystoreSrc) && fallbackConfigDir) {
    const fallbackKeystoreSrc = path.join(fallbackConfigDir, client.keystore);
    if (fs.existsSync(fallbackKeystoreSrc)) keystoreSrc = fallbackKeystoreSrc;
  }
  const keystoreDest = path.join(appDir, 'android', 'app', client.keystore);
  if (fs.existsSync(keystoreSrc)) {
    fs.copyFileSync(keystoreSrc, keystoreDest);
    logSuccess(`Copied keystore file: ${client.keystore}`);
  }

  // Copy keystore configuration
  let keystoreConfigSrc = path.join(configDir, 'keystore-config.gradle');
  if (!fs.existsSync(keystoreConfigSrc) && fallbackConfigDir) {
    const fallbackKeystoreConfigSrc = path.join(
      fallbackConfigDir,
      'keystore-config.gradle'
    );
    if (fs.existsSync(fallbackKeystoreConfigSrc))
      keystoreConfigSrc = fallbackKeystoreConfigSrc;
  }
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

  // Copy refer-a-friend field visibility config
  const referFriendConfigSrc = path.join(configDir, 'refer-friend-config.json');
  const referFriendConfigDest = path.join(appDir, 'src', 'config', 'refer-friend-fields.json');
  if (fs.existsSync(referFriendConfigSrc)) {
    fs.copyFileSync(referFriendConfigSrc, referFriendConfigDest);
    logSuccess('Copied refer friend config');
  } else {
    fs.writeFileSync(
      referFriendConfigDest,
      `${JSON.stringify({ hiddenFields: [], optionalFields: [] }, null, 2)}\n`,
    );
    logSuccess('Applied default refer friend config');
  }

  // Update iOS project bundle identifier and display name
  const buildConfigPath = path.join(configDir, 'build-config.json');
  if (fs.existsSync(buildConfigPath)) {
    try {
      const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
      const iosConfig = buildConfig?.ios;
      
      if (iosConfig) {
        const pbxProjPath = path.join(appDir, 'ios', 'ISPApp.xcodeproj', 'project.pbxproj');
        if (fs.existsSync(pbxProjPath)) {
          let pbxProj = fs.readFileSync(pbxProjPath, 'utf8');
          
          // Update bundle identifier (handle both quoted and unquoted formats)
          if (iosConfig.bundleIdentifier) {
            // Match: PRODUCT_BUNDLE_IDENTIFIER = "bundle.id"; or PRODUCT_BUNDLE_IDENTIFIER = bundle.id;
            pbxProj = pbxProj.replace(
              /PRODUCT_BUNDLE_IDENTIFIER = (?:")?[^";]+(?:")?;/g,
              `PRODUCT_BUNDLE_IDENTIFIER = ${iosConfig.bundleIdentifier};`
            );
            // Match: "PRODUCT_BUNDLE_IDENTIFIER[sdk=iphoneos*]" = bundle.id;
            pbxProj = pbxProj.replace(
              /"PRODUCT_BUNDLE_IDENTIFIER\[sdk=iphoneos\*\]" = [^;]+;/g,
              `"PRODUCT_BUNDLE_IDENTIFIER[sdk=iphoneos*]" = ${iosConfig.bundleIdentifier};`
            );
          }
          
          // Update marketing version
          if (iosConfig.marketingVersion) {
            pbxProj = pbxProj.replace(
              /MARKETING_VERSION = [^;]+;/g,
              `MARKETING_VERSION = ${iosConfig.marketingVersion};`
            );
          }
          
          // Update build number
          if (iosConfig.buildNumber) {
            pbxProj = pbxProj.replace(
              /CURRENT_PROJECT_VERSION = [^;]+;/g,
              `CURRENT_PROJECT_VERSION = ${iosConfig.buildNumber};`
            );
          }
          
          // Update display name
          if (iosConfig.displayName) {
            const escapedDisplayName = iosConfig.displayName.replace(/"/g, '\\"');
            pbxProj = pbxProj.replace(
              /INFOPLIST_KEY_CFBundleDisplayName = [^;]+;/g,
              `INFOPLIST_KEY_CFBundleDisplayName = "${escapedDisplayName}";`
            );
          }
          
          // Update PRODUCT_NAME (app executable name) - remove spaces and special chars
          if (iosConfig.displayName) {
            const productName = iosConfig.displayName.replace(/\s+/g, '') + 'App';
            pbxProj = pbxProj.replace(
              /PRODUCT_NAME = [^;]+;/g,
              `PRODUCT_NAME = ${productName};`
            );
          }
          
          fs.writeFileSync(pbxProjPath, pbxProj);
          logSuccess('Updated iOS project bundle identifier and settings');
        }
      }
    } catch (error) {
      logWarning(`Failed to update iOS project settings: ${error.message}`);
    }
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
  const clientConfigDir = path.join(__dirname, '..', client.configDir);
  const hasClientGoogleServices = fs.existsSync(path.join(clientConfigDir, 'google-services.json'));

  // Always use the selected client's package as applicationId.
  const effectiveApplicationId = client.packageName;

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
    `applicationId "${effectiveApplicationId}"`
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

  // in.spacecom.log2space.client.* — exclude every sibling app package (microscan, netfix, monarkuser, …)
  const inClientSuffixes = ['microscan', 'netfix', 'monarkuser'];
  let inExcludeBlock = '';
  if (client.namespace.startsWith('in.spacecom.log2space.client.')) {
    const currentSuffix = client.namespace.replace('in.spacecom.log2space.client.', '');
    const lines = inClientSuffixes
      .filter((s) => s !== currentSuffix)
      .map(
        (s) =>
          `                exclude '**/in/spacecom/log2space/client/${s}/**'`,
      )
      .join('\n');
    inExcludeBlock = `                // in.spacecom.log2space.client.${currentSuffix} — exclude other in.* client packages\n${lines}\n`;
  } else {
    const lines = inClientSuffixes
      .map(
        (s) =>
          `                exclude '**/in/spacecom/log2space/client/${s}/**'`,
      )
      .join('\n');
    inExcludeBlock = `                // Non-in client — exclude all in.* client app packages\n${lines}\n`;
  }
  // Match legacy "When building one 'in' client…" or newer "in.spacecom…client.X — exclude…" comment + following excludes
  const inBlockPattern =
    /\n[ \t]*\/\/ (?:When building one 'in' client[^\n]*|in\.spacecom\.log2space\.client\.[^\n]+)\n(?:[ \t]*exclude '\*\*\/in\/spacecom\/log2space\/client\/[^']+'[ \t]*\n)+(?:[ \t]*\/\/ Exclude other[^\n]*\n)?/;
  if (inBlockPattern.test(buildGradleContent)) {
    buildGradleContent = buildGradleContent.replace(inBlockPattern, '\n' + inExcludeBlock);
  } else {
    // Fallback: legacy placeholder used in some templates
    const suffixesForExclude = client.namespace.startsWith('in.spacecom.log2space.client.')
      ? inClientSuffixes.filter(
          (s) => s !== client.namespace.replace('in.spacecom.log2space.client.', ''),
        )
      : inClientSuffixes;
    buildGradleContent = buildGradleContent.replace(
      /exclude '\*\*\/in\/spacecom\/log2space\/client\/__IN_CLIENT_OTHER__\/\*\*'/,
      suffixesForExclude
        .map(
          (s) =>
            `exclude '**/in/spacecom/log2space/client/${s}/**'`,
        )
        .join('\n                '),
    );
  }

  // Enable Google Services only when the selected client has its own firebase json.
  // This avoids package-name mismatch failures for clients without firebase setup.
  if (hasClientGoogleServices) {
    if (!/apply plugin:\s*"com\.google\.gms\.google-services"/.test(buildGradleContent)) {
      buildGradleContent = `${buildGradleContent.trimEnd()}\n\napply plugin: "com.google.gms.google-services"\n`;
    }
  } else {
    buildGradleContent = buildGradleContent.replace(
      /\n\/\/ Enable Google Services plugin for Firebase auto-initialization\s*\napply plugin:\s*"com\.google\.gms\.google-services"\s*\n?/,
      '\n'
    );
    buildGradleContent = buildGradleContent.replace(
      /\napply plugin:\s*"com\.google\.gms\.google-services"\s*\n?/,
      '\n'
    );
    logWarning(`Firebase not configured for ${clientId}; disabled Google Services plugin in android/app/build.gradle`);
  }

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
  if (!fs.existsSync(appDelegatePath)) {
    logWarning('AppDelegate.swift not found, skipping update');
    return;
  }

  let appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');

  // Use fixed name so JS (index.js) and native always match; avoids "X has not been registered" on client switch.
  const moduleName = 'ISPApp';

  // Update withModuleName (for React Native 0.80+)
  appDelegateContent = appDelegateContent.replace(
    /withModuleName:\s*"[^"]*"/,
    `withModuleName: "${moduleName}"`
  );

  // Also update getMainComponentName if it exists (for older React Native versions)
  appDelegateContent = appDelegateContent.replace(
    /getMainComponentName\(\)\s*->\s*String\s*\{[^}]+\}/,
    `getMainComponentName() -> String {
        return "${moduleName}"
    }`
  );

  fs.writeFileSync(appDelegatePath, appDelegateContent);
  logSuccess(`Updated iOS AppDelegate module name to '${moduleName}'`);
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

  // Clean up old package directories for this client (if package name changed)
  // Find all directories that might contain old MainActivity files for this client
  const javaDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java');
  if (fs.existsSync(javaDir)) {
    const oldDirs = [
      path.join(javaDir, 'in', 'spacecom', 'log2space', 'client', 'microscan'),
      path.join(javaDir, 'in', 'spacecom', 'log2space', 'client', 'netfix'),
      path.join(javaDir, 'in', 'spacecom', 'log2space', 'client', 'monarkuser'),
      path.join(javaDir, 'com', 'microscan', 'app'),
      path.join(javaDir, 'com', 'spacecom', 'log2space', 'microscan'),
      path.join(javaDir, 'com', 'spacecom', 'log2space', 'monarknet'),
      path.join(javaDir, 'com', 'netfixnetworks'),
    ];
    oldDirs.forEach(oldDir => {
      if (fs.existsSync(oldDir) && oldDir !== packageDir) {
        // Check if it contains MainActivity files
        const oldMainActivity = path.join(oldDir, 'MainActivity.kt');
        const oldMainApplication = path.join(oldDir, 'MainApplication.kt');
        if (fs.existsSync(oldMainActivity) || fs.existsSync(oldMainApplication)) {
          fs.rmSync(oldDir, { recursive: true, force: true });
          logSuccess(`Cleaned up old package directory: ${oldDir}`);
        }
      }
    });
  }

  // Create package directory if it doesn't exist
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
    logSuccess(`Created package directory: ${packageDir}`);
  }

  // Find a source MainActivity to use as template
  const sourcePaths = [
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'in', 'spacecom', 'log2space', 'client', 'microscan', 'MainActivity.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'in', 'spacecom', 'log2space', 'client', 'netfix', 'MainActivity.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'spacecom', 'log2space', 'microscan', 'MainActivity.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'netfixnetworks', 'MainActivity.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'h8', 'dnasubscriber', 'MainActivity.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'dnagoa', 'MainActivity.kt'),
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
  // Kotlin reserves "in" as a keyword; escape it so package in.spacecom... compiles
  const packageDeclaration = newPackageName.startsWith('in.')
    ? '`in`.' + newPackageName.substring(3)
    : newPackageName;
  const packageRegex = /package\s+[^\s;]+;?/;
  mainActivityContent = mainActivityContent.replace(packageRegex, `package ${packageDeclaration}`);

  // Use fixed name so JS (index.js) and native always match; avoids "X has not been registered" on client switch.
  const moduleName = 'ISPApp';
  mainActivityContent = mainActivityContent.replace(
    /override\s+fun\s+getMainComponentName\(\)\s*:\s*String\s*=\s*"[^"]*"/,
    `override fun getMainComponentName(): String = "${moduleName}"`
  );

  fs.writeFileSync(mainActivityPath, mainActivityContent);
  logSuccess('Updated Android MainActivity');

  // Also update MainApplication if it exists or needs to be created
  const sourceApplicationPaths = [
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'in', 'spacecom', 'log2space', 'client', 'microscan', 'MainApplication.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'in', 'spacecom', 'log2space', 'client', 'netfix', 'MainApplication.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'spacecom', 'log2space', 'microscan', 'MainApplication.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'netfixnetworks', 'MainApplication.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'h8', 'dnasubscriber', 'MainApplication.kt'),
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'dnagoa', 'MainApplication.kt'),
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
    mainApplicationContent = mainApplicationContent.replace(packageRegex, `package ${packageDeclaration}`);
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