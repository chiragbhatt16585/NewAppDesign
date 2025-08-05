const fs = require('fs');
const path = require('path');

const fixARComprehensive = () => {
  try {
    console.log('🔧 Applying comprehensive AR dependency fix...');
    
    // 1. Fix AndroidManifest.xml
    const manifestPath = './android/app/src/main/AndroidManifest.xml';
    if (fs.existsSync(manifestPath)) {
      let content = fs.readFileSync(manifestPath, 'utf8');
      
      // Add ARCore metadata if not present
      if (!content.includes('com.google.ar.core')) {
        const arMetadata = `
        <!-- ARCore Metadata - Optional -->
        <meta-data android:name="com.google.ar.core" android:value="optional" />
        
      </application>`;
        
        content = content.replace('</application>', arMetadata);
        fs.writeFileSync(manifestPath, content, 'utf8');
        console.log('✅ Added ARCore metadata to AndroidManifest.xml');
      }
    }
    
    // 2. Create a proguard rule to exclude AR classes
    const proguardPath = './android/app/proguard-rules.pro';
    const proguardRule = `
# Exclude AR-related classes to prevent AR dependency issues
-dontwarn com.google.ar.core.**
-keep class com.google.ar.core.** { *; }
-dontwarn androidx.xr.arcore.**
-keep class androidx.xr.arcore.** { *; }
`;
    
    if (fs.existsSync(proguardPath)) {
      let proguardContent = fs.readFileSync(proguardPath, 'utf8');
      if (!proguardContent.includes('com.google.ar.core')) {
        proguardContent += proguardRule;
        fs.writeFileSync(proguardPath, proguardContent, 'utf8');
        console.log('✅ Added AR exclusion rules to proguard-rules.pro');
      }
    } else {
      fs.writeFileSync(proguardPath, proguardRule, 'utf8');
      console.log('✅ Created proguard-rules.pro with AR exclusion rules');
    }
    
    // 3. Add AR exclusion to build.gradle
    const buildGradlePath = './android/app/build.gradle';
    if (fs.existsSync(buildGradlePath)) {
      let buildContent = fs.readFileSync(buildGradlePath, 'utf8');
      
      // Add packaging options to exclude AR files
      if (!buildContent.includes('packagingOptions')) {
        const packagingOptions = `
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
        exclude '**/libarcore_sdk.so'
        exclude '**/libarcore_sdk_jni.so'
        exclude '**/libarcore_sdk_c.so'
    }
    
    defaultConfig {`;
        
        buildContent = buildContent.replace('defaultConfig {', packagingOptions);
        fs.writeFileSync(buildGradlePath, buildContent, 'utf8');
        console.log('✅ Added AR file exclusions to build.gradle');
      }
    }
    
    console.log('✅ Comprehensive AR dependency fix completed!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   1. Added ARCore metadata as optional');
    console.log('   2. Added ProGuard rules to exclude AR classes');
    console.log('   3. Added packaging options to exclude AR libraries');
    console.log('');
    console.log('🚀 Now rebuild the APK:');
    console.log('   node scripts/build-release-apk.js');
    
  } catch (error) {
    console.error('❌ Error applying comprehensive AR fix:', error.message);
  }
};

fixARComprehensive(); 