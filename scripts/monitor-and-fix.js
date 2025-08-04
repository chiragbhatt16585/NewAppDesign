const fs = require('fs');
const path = require('path');

const generatedFilePath = path.join(__dirname, '../android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java');

function fixGeneratedFile() {
  try {
    if (!fs.existsSync(generatedFilePath)) {
      console.log('Generated file does not exist yet, waiting...');
      return;
    }

    let content = fs.readFileSync(generatedFilePath, 'utf8');
    
    // Check if the file has the wrong package reference
    if (content.includes('com.h8.dnasubscriber.BuildConfig')) {
      console.log('🔧 Fixing generated file...');
      
      // Replace the wrong package reference with the correct one
      content = content.replace(
        /com\.h8\.dnasubscriber\.BuildConfig/g,
        'com.microscan.app.BuildConfig'
      );
      
      // Also comment out the new architecture check
      content = content.replace(
        /if \(com\.microscan\.app\.BuildConfig\.IS_NEW_ARCHITECTURE_ENABLED\) \{\s+DefaultNewArchitectureEntryPoint\.load\(\);\s+\}/g,
        '// if (com.microscan.app.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {\n    //   DefaultNewArchitectureEntryPoint.load();\n    // }'
      );
      
      fs.writeFileSync(generatedFilePath, content);
      console.log('✅ Generated file fixed successfully');
    }
  } catch (error) {
    console.error('Error fixing generated file:', error);
  }
}

// Fix immediately
fixGeneratedFile();

// Set up file watcher
console.log('👀 Monitoring generated file for changes...');
fs.watchFile(generatedFilePath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime > prev.mtime) {
    console.log('📝 Generated file changed, fixing...');
    setTimeout(fixGeneratedFile, 100); // Small delay to ensure file is fully written
  }
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping file monitor...');
  process.exit(0);
});

console.log('🚀 File monitor started. Press Ctrl+C to stop.'); 