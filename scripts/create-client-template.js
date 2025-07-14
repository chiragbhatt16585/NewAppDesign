#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createClient = async () => {
  console.log('🚀 Creating new client configuration...\n');

  try {
    // Get client information
    const clientName = await question('Enter client name (e.g., newclient): ');
    const appName = await question('Enter app display name (e.g., "New Client ISP"): ');
    const bundleId = await question('Enter bundle ID (e.g., com.newclient.ispapp): ');
    const apiUrl = await question('Enter API URL (e.g., https://api.newclient.com): ');
    const companyName = await question('Enter company name (e.g., "New Client Internet"): ');
    
    // Keystore information
    const keystoreFile = await question('Enter keystore file name (e.g., newclient-key.jks): ');
    const storePassword = await question('Enter keystore password: ');
    const keyAlias = await question('Enter key alias: ');
    const keyPassword = await question('Enter key password: ');

    const clientDir = `config/${clientName}`;
    
    // Create client directory
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
      fs.mkdirSync(`${clientDir}/assets`, { recursive: true });
      fs.mkdirSync(`${clientDir}/app-icons`, { recursive: true });
      console.log(`✅ Created directory: ${clientDir}`);
    }

    // Copy template files from microscan
    const templateDir = 'config/microscan';
    const filesToCopy = [
      'app.json',
      'api.ts', 
      'strings.json',
      'logo-config.json',
      'android-build.gradle',
      'android-strings.xml',
      'ios-Info.plist',
      'keystore-config.gradle'
    ];

    filesToCopy.forEach(file => {
      if (fs.existsSync(`${templateDir}/${file}`)) {
        fs.copyFileSync(`${templateDir}/${file}`, `${clientDir}/${file}`);
        console.log(`✅ Copied ${file}`);
      }
    });

    // Update app.json
    const appJsonPath = `${clientDir}/app.json`;
    let appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appJson.name = appName;
    appJson.displayName = appName;
    appJson.expo.name = appName;
    appJson.expo.slug = `${clientName}-isp-app`;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

    // Update api.ts
    const apiPath = `${clientDir}/api.ts`;
    let apiContent = fs.readFileSync(apiPath, 'utf8');
    apiContent = apiContent.replace(
      /BASE_URL:\s*['"][^'"]*['"]/,
      `BASE_URL: '${apiUrl}'`
    );
    fs.writeFileSync(apiPath, apiContent);

    // Update strings.json
    const stringsPath = `${clientDir}/strings.json`;
    let stringsJson = JSON.parse(fs.readFileSync(stringsPath, 'utf8'));
    stringsJson.companyName = companyName;
    stringsJson.appName = appName;
    stringsJson.welcomeMessage = `Welcome to ${appName}`;
    fs.writeFileSync(stringsPath, JSON.stringify(stringsJson, null, 2));

    // Update android-build.gradle
    const buildGradlePath = `${clientDir}/android-build.gradle`;
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    buildGradle = buildGradle.replace(
      /namespace\s+["'][^"']*["']/,
      `namespace "${bundleId}"`
    );
    buildGradle = buildGradle.replace(
      /applicationId\s+["'][^"']*["']/,
      `applicationId "${bundleId}"`
    );
    fs.writeFileSync(buildGradlePath, buildGradle);

    // Update keystore-config.gradle
    const keystoreConfigPath = `${clientDir}/keystore-config.gradle`;
    let keystoreConfig = fs.readFileSync(keystoreConfigPath, 'utf8');
    keystoreConfig = keystoreConfig.replace(
      /storeFile file\(['"][^'"]*['"]\)/,
      `storeFile file('${keystoreFile}')`
    );
    keystoreConfig = keystoreConfig.replace(
      /storePassword ['"][^'"]*['"]/,
      `storePassword '${storePassword}'`
    );
    keystoreConfig = keystoreConfig.replace(
      /keyAlias ['"][^'"]*['"]/,
      `keyAlias '${keyAlias}'`
    );
    keystoreConfig = keystoreConfig.replace(
      /keyPassword ['"][^'"]*['"]/,
      `keyPassword '${keyPassword}'`
    );
    fs.writeFileSync(keystoreConfigPath, keystoreConfig);

    // Update android-strings.xml
    const stringsXmlPath = `${clientDir}/android-strings.xml`;
    let stringsXml = fs.readFileSync(stringsXmlPath, 'utf8');
    stringsXml = stringsXml.replace(
      /<string name="app_name">[^<]*<\/string>/,
      `<string name="app_name">${appName}</string>`
    );
    stringsXml = stringsXml.replace(
      /<string name="company_name">[^<]*<\/string>/,
      `<string name="company_name">${companyName}</string>`
    );
    fs.writeFileSync(stringsXmlPath, stringsXml);

    // Update ios-Info.plist
    const infoPlistPath = `${clientDir}/ios-Info.plist`;
    let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
    infoPlist = infoPlist.replace(
      /<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleDisplayName</key>\n\t<string>${appName}</string>`
    );
    infoPlist = infoPlist.replace(
      /<key>CFBundleName<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleName</key>\n\t<string>${appName}</string>`
    );
    fs.writeFileSync(infoPlistPath, infoPlist);

    console.log('\n✅ Client configuration created successfully!');
    console.log(`\n📁 Client directory: ${clientDir}`);
    console.log('\n📋 Next steps:');
    console.log(`1. Add your keystore file: ${clientDir}/${keystoreFile}`);
    console.log(`2. Add your logo: ${clientDir}/assets/`);
    console.log(`3. Add app icons: ${clientDir}/app-icons/`);
    console.log(`4. Add build script to package.json:`);
    console.log(`   "build:${clientName}": "node scripts/build-client.js ${clientName}"`);
    console.log(`5. Test the build: npm run build:${clientName}`);

  } catch (error) {
    console.error('❌ Error creating client:', error);
  } finally {
    rl.close();
  }
};

createClient(); 