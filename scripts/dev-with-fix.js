const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientName = process.argv[2] || 'microscan';

console.log(`🚀 Starting dev build for ${clientName} with auto-fix...`);

// First, build the client
const buildProcess = spawn('npm', ['run', `build:${clientName}`], { 
  stdio: 'inherit',
  shell: true 
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Build failed with code ${code}`);
    process.exit(code);
  }
  
  console.log('✅ Client build completed, starting Android build with auto-fix...');
  
  // Import the fix function
  const fixGeneratedFile = () => {
    try {
      // Read build.gradle to get the namespace
      const buildGradleContent = fs.readFileSync('./android/app/build.gradle', 'utf8');
      const namespaceMatch = buildGradleContent.match(/namespace\s+"([^"]+)"/);
      
      if (!namespaceMatch) {
        return;
      }
      
      const namespace = namespaceMatch[1];
      const generatedFilePath = './android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java';
      
      // Check if generated file exists
      if (!fs.existsSync(generatedFilePath)) {
        return;
      }
      
      // Read the generated file
      let content = fs.readFileSync(generatedFilePath, 'utf8');
      
      // Replace any hardcoded package references
      const oldPackagePattern = /com\.h8\.dnasubscriber\.BuildConfig/g;
      const newPackagePattern = /com\.microscan\.app\.BuildConfig/g;
      
      if (namespace === 'com.microscan.app') {
        content = content.replace(oldPackagePattern, 'com.microscan.app.BuildConfig');
      } else if (namespace === 'com.h8.dnasubscriber') {
        content = content.replace(newPackagePattern, 'com.h8.dnasubscriber.BuildConfig');
      }
      
      // Write the fixed content back
      fs.writeFileSync(generatedFilePath, content);
      
    } catch (error) {
      // Ignore errors during monitoring
    }
  };
  
  // Run fix immediately
  fixGeneratedFile();
  
  // Set up interval to check and fix every 1 second during build
  const interval = setInterval(() => {
    fixGeneratedFile();
  }, 1000);
  
  // Start the Android build
  const androidProcess = spawn('npx', ['react-native', 'run-android'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  androidProcess.on('close', (androidCode) => {
    clearInterval(interval);
    process.exit(androidCode);
  });
  
  // Stop monitoring after 10 minutes
  setTimeout(() => {
    clearInterval(interval);
  }, 600000);
}); 