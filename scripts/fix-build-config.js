const fs = require('fs');
const path = require('path');

const generatedFilePath = './android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java';

function fixGeneratedFile() {
  if (fs.existsSync(generatedFilePath)) {
    try {
      let content = fs.readFileSync(generatedFilePath, 'utf8');
      
      // Replace the problematic line with the correct package name
      const oldPattern = /if \(com\.microscan\.app\.BuildConfig\.IS_NEW_ARCHITECTURE_ENABLED\) \{/;
      const newPattern = 'if (com.h8.dnasubscriber.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {';
      
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newPattern);
        fs.writeFileSync(generatedFilePath, content);
        console.log('✅ Fixed generated file - replaced microscan with dnasubscriber');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Error fixing file:', error.message);
    }
  }
  return false;
}

// Function to continuously monitor and fix the file
function monitorAndFix() {
  console.log('🔧 Starting build config fix monitor...');
  
  const interval = setInterval(() => {
    try {
      fixGeneratedFile();
    } catch (error) {
      // Ignore errors during monitoring
    }
  }, 500); // Check every 500ms
  
  // Stop monitoring after 10 minutes
  setTimeout(() => {
    clearInterval(interval);
    console.log('⏰ Monitoring stopped');
  }, 600000);
  
  return interval;
}

// Export for use in other scripts
module.exports = { fixGeneratedFile, monitorAndFix };

// If run directly
if (require.main === module) {
  monitorAndFix();
} 