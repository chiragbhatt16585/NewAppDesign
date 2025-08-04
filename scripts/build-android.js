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
      /if \(com\.h8\.dnasubscriber\.BuildConfig\.IS_NEW_ARCHITECTURE_ENABLED\) \{[\s\S]*?DefaultNewArchitectureEntryPoint\.load\(\);[\s\S]*?\}/,
      '// New architecture disabled for compatibility'
    );
    
    fs.writeFileSync(generatedFilePath, content);
    console.log('✅ Fixed generated file');
  }
};

// Function to continuously monitor and fix the file
const monitorAndFix = () => {
  const interval = setInterval(() => {
    try {
      fixGeneratedFile();
    } catch (error) {
      // Ignore errors during monitoring
    }
  }, 1000);
  
  // Stop monitoring after 5 minutes
  setTimeout(() => {
    clearInterval(interval);
    console.log('⏰ Monitoring stopped');
  }, 300000);
  
  return interval;
};

// Start monitoring
const monitorInterval = monitorAndFix();

try {
  // Run the Android build
  console.log('🚀 Running Android build...');
  execSync('npx react-native run-android', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('❌ Build failed:', error.message);
} finally {
  // Stop monitoring
  clearInterval(monitorInterval);
} 