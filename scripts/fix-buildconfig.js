const fs = require('fs');
const path = require('path');

const fixBuildConfig = () => {
  try {
    const generatedFilePath = './android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java';
    
    // Check if generated file exists
    if (!fs.existsSync(generatedFilePath)) {
      console.log('❌ Generated file not found, skipping fix');
      return;
    }
    
    // Read the generated file
    let content = fs.readFileSync(generatedFilePath, 'utf8');
    
    // Replace the wrong package reference with the correct one
    const oldPackagePattern = /com\.h8\.dnasubscriber\.BuildConfig/g;
    const newPackagePattern = /com\.microscan\.app\.BuildConfig/g;
    
    // Check if the file contains the wrong package
    if (content.includes('com.h8.dnasubscriber.BuildConfig')) {
      content = content.replace(oldPackagePattern, 'com.microscan.app.BuildConfig');
      fs.writeFileSync(generatedFilePath, content);
      console.log('✅ Fixed BuildConfig package reference');
    } else if (content.includes('com.microscan.app.BuildConfig')) {
      console.log('✅ BuildConfig package reference is already correct');
    } else {
      console.log('⚠️ No BuildConfig reference found in file');
    }
    
  } catch (error) {
    console.error('❌ Error fixing BuildConfig:', error);
  }
};

fixBuildConfig(); 