const fs = require('fs');
const path = require('path');

const fixBuildConfigPermanent = () => {
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
    
    // Check if the file contains the wrong package
    if (content.includes('com.h8.dnasubscriber.BuildConfig')) {
      content = content.replace(oldPackagePattern, 'com.microscan.app.BuildConfig');
      
      // Write the fixed content
      fs.writeFileSync(generatedFilePath, content);
      
      // Make the file read-only to prevent regeneration
      fs.chmodSync(generatedFilePath, 0o444);
      
      console.log('✅ Fixed BuildConfig package reference and made file read-only');
    } else if (content.includes('com.microscan.app.BuildConfig')) {
      // Make the file read-only even if it's already correct
      fs.chmodSync(generatedFilePath, 0o444);
      console.log('✅ BuildConfig package reference is correct, made file read-only');
    } else {
      console.log('⚠️ No BuildConfig reference found in file');
    }
    
  } catch (error) {
    console.error('❌ Error fixing BuildConfig:', error);
  }
};

fixBuildConfigPermanent(); 