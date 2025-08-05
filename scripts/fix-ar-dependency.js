const fs = require('fs');
const path = require('path');

const fixARDependency = () => {
  try {
    console.log('🔧 Fixing AR dependency issues...');
    
    const manifestPath = './android/app/src/main/AndroidManifest.xml';
    
    if (!fs.existsSync(manifestPath)) {
      console.log('❌ AndroidManifest.xml not found');
      return;
    }
    
    let content = fs.readFileSync(manifestPath, 'utf8');
    
    // Add AR optional feature declaration
    const arFeatureDeclaration = `
    <!-- AR Feature - Optional -->
    <uses-feature android:name="android.hardware.camera.ar" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    
    <!-- AR Permissions - Optional -->
    <uses-permission android:name="android.permission.CAMERA" android:required="false" />
    <uses-permission android:name="com.google.ar.core.permission.CAMERA" android:required="false" />
    
    <application`;
    
    // Replace the application tag to add AR features as optional
    if (!content.includes('android.hardware.camera.ar')) {
      content = content.replace('<application', arFeatureDeclaration);
      fs.writeFileSync(manifestPath, content, 'utf8');
      console.log('✅ Added optional AR features to AndroidManifest.xml');
    } else {
      console.log('ℹ️ AR features already configured as optional');
    }
    
    // Also check if we need to add ARCore metadata
    if (!content.includes('com.google.ar.core')) {
      const arMetadata = `
        <!-- ARCore Metadata -->
        <meta-data android:name="com.google.ar.core" android:value="optional" />
        
      </application>`;
      
      content = content.replace('</application>', arMetadata);
      fs.writeFileSync(manifestPath, content, 'utf8');
      console.log('✅ Added ARCore metadata as optional');
    }
    
    console.log('✅ AR dependency fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing AR dependency:', error.message);
  }
};

fixARDependency(); 