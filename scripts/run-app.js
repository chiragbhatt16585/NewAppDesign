#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    versionCode: 291,
    versionName: '291.0.0',
    keystore: 'Log2spaceDNAInfotelAppKey.jks',
    configDir: 'config/dna-infotel',
  },
};

function switchClient(clientId) {
  const client = CLIENTS[clientId];
  if (!client) {
    console.error(`❌ Unknown client: ${clientId}`);
    console.log(`Available clients: ${Object.keys(CLIENTS).join(', ')}`);
    process.exit(1);
  }

  console.log(`🔄 Switching to ${client.name}...`);

  // Update build.gradle
  const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  // Update namespace and applicationId
  buildGradle = buildGradle.replace(
    /namespace\s+"[^"]*"/,
    `namespace "${client.namespace}"`
  );
  buildGradle = buildGradle.replace(
    /applicationId\s+"[^"]*"/,
    `applicationId "${client.packageName}"`
  );
  buildGradle = buildGradle.replace(
    /versionCode\s+\d+/,
    `versionCode ${client.versionCode}`
  );
  buildGradle = buildGradle.replace(
    /versionName\s+"[^"]*"/,
    `versionName "${client.versionName}"`
  );

  // Update release signing config
  buildGradle = buildGradle.replace(
    /storeFile file\('[^']*'\)/,
    `storeFile file('${client.keystore}')`
  );

  fs.writeFileSync(buildGradlePath, buildGradle);

  // Copy client-specific assets
  const configDir = path.join(__dirname, '..', client.configDir);
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