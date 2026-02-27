const fs = require('fs');
const path = require('path');

// Read the current build.gradle to get the namespace
const buildGradlePath = './android/app/build.gradle';
const generatedFilePath = './android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java';

const fixGeneratedFile = () => {
  try {
    // Read build.gradle to get the namespace
    const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
    const namespaceMatch = buildGradleContent.match(/namespace\s+"([^"]+)"/);
    
    if (!namespaceMatch) {
      console.log('❌ Could not find namespace in build.gradle');
      return;
    }
    
    const namespace = namespaceMatch[1];
    console.log(`📦 Current namespace: ${namespace}`);
    
    // Check if generated file exists
    if (!fs.existsSync(generatedFilePath)) {
      console.log('❌ Generated file not found, skipping fix');
      return;
    }
    
    // Read the generated file
    let content = fs.readFileSync(generatedFilePath, 'utf8');
    
    // Replace any BuildConfig reference with the detected namespace
    // Match any package name pattern (com., in., etc.) followed by BuildConfig
    const buildConfigPattern = /([a-z]+\.)+[A-Za-z0-9_.]+\.BuildConfig/g;
    content = content.replace(buildConfigPattern, `${namespace}.BuildConfig`);
    
    // Write the fixed content back
    fs.writeFileSync(generatedFilePath, content);
    console.log('✅ Generated file fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing generated file:', error);
  }
};

fixGeneratedFile(); 