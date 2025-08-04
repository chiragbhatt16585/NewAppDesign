const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting custom Android build process...');

// Function to fix the generated file
const fixGeneratedFile = () => {
  const generatedFilePath = './android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java';
  
  if (fs.existsSync(generatedFilePath)) {
    let content = fs.readFileSync(generatedFilePath, 'utf8');
    
    // Replace the problematic line with a simple comment
    content = content.replace(
      /if \(com\.h8\.dnasubscriber\.BuildConfig\.IS_NEW_ARCHITECTURE_ENABLED\) \{[\\s\\S]*?DefaultNewArchitectureEntryPoint\.load\(\);[\\s\\S]*?\}/,
      '// New architecture disabled for compatibility'
    );
    
    // Also replace any other references
    content = content.replace(
      /com\.h8\.dnasubscriber\.BuildConfig\.IS_NEW_ARCHITECTURE_ENABLED/g,
      'false'
    );
    
    fs.writeFileSync(generatedFilePath, content);
    console.log('✅ Fixed generated file');
  }
};

// Function to monitor and fix the file
const monitorAndFix = () => {
  const generatedFilePath = './android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java';
  
  if (fs.existsSync(generatedFilePath)) {
    let content = fs.readFileSync(generatedFilePath, 'utf8');
    
    if (content.includes('com.h8.dnasubscriber.BuildConfig')) {
      console.log('🛠️  Detected wrong package name, fixing...');
      content = content.replace(
        /com\.h8\.dnasubscriber\.BuildConfig/g,
        'com.microscan.app.BuildConfig'
      );
      fs.writeFileSync(generatedFilePath, content);
      console.log('✅ Fixed package name');
    }
  }
};

try {
  // Clean the project first
  console.log('🧹 Cleaning project...');
  execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
  
  // Remove generated directory
  if (fs.existsSync('./android/app/build/generated')) {
    fs.rmSync('./android/app/build/generated', { recursive: true, force: true });
    console.log('🗑️  Removed generated directory');
  }
  
  // Start monitoring in background
  const monitorInterval = setInterval(monitorAndFix, 1000);
  
  // Build the project
  console.log('🏗️  Building Android project...');
  execSync('cd android && ./gradlew assembleDebug', { stdio: 'inherit' });
  
  // Stop monitoring
  clearInterval(monitorInterval);
  
  // Final fix
  fixGeneratedFile();
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 