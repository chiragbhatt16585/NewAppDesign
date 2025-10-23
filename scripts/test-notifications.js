#!/usr/bin/env node

/**
 * Notification Service Test Runner
 * 
 * This script provides command-line testing for the notification service.
 * Run with: node scripts/test-notifications.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Notification Service Test Runner');
console.log('=====================================\n');

// Test configuration
const testConfig = {
  jestConfig: path.join(__dirname, '../jest.config.js'),
  testFile: path.join(__dirname, '../src/services/__tests__/notificationService.test.ts'),
  coverageDir: path.join(__dirname, '../coverage'),
};

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Success');
    if (output.trim()) {
      console.log(output);
    }
    return true;
  } catch (error) {
    console.log('❌ Failed');
    console.log(error.stdout || error.message);
    return false;
  }
}

function runJestTests() {
  console.log('🔬 Running Jest Unit Tests');
  console.log('----------------------------');
  
  const jestCommand = `npx jest ${testConfig.testFile} --config ${testConfig.jestConfig} --verbose --coverage`;
  
  return runCommand(jestCommand, 'Running Jest tests with coverage');
}

function runTypeCheck() {
  console.log('\n🔍 Running TypeScript Type Check');
  console.log('----------------------------------');
  
  return runCommand('npx tsc --noEmit', 'Type checking notification service');
}

function runLinting() {
  console.log('\n🧹 Running ESLint');
  console.log('------------------');
  
  const lintCommand = `npx eslint src/services/notificationService.ts src/services/notificationTest.ts src/screens/NotificationTestScreen.tsx --fix`;
  
  return runCommand(lintCommand, 'Linting notification files');
}

function showTestInstructions() {
  console.log('\n📖 Manual Testing Instructions');
  console.log('=================================');
  console.log(`
To test the notification service manually:

1. **Add Test Screen to Navigation:**
   - Add NotificationTestScreen to your navigation stack
   - Navigate to it from your app menu

2. **Test on Real Device:**
   - Build and install the app on a real device
   - Open the Notification Test Screen
   - Run manual tests to verify real behavior

3. **Test Different Scenarios:**
   - Test with notifications enabled/disabled
   - Test on different platforms (iOS/Android)
   - Test with different network conditions
   - Test token refresh scenarios

4. **Check Console Logs:**
   - All test functions log detailed information
   - Look for [Push], [FCM], and test result logs
   - Use React Native debugger or device logs

5. **API Integration:**
   - Ensure your backend API is running
   - Check that addDeviceDetails endpoint works
   - Verify token registration in your database

6. **Firebase Setup:**
   - Ensure Firebase is properly configured
   - Check google-services.json (Android) and GoogleService-Info.plist (iOS)
   - Verify FCM tokens are being generated

7. **Platform-Specific Testing:**
   - iOS: Test on simulator vs real device
   - Android: Test different API levels
   - Test permission handling on both platforms
`);
}

function showDebugCommands() {
  console.log('\n🐛 Debug Commands');
  console.log('==================');
  console.log(`
Useful commands for debugging:

# Check if Firebase is configured
npx react-native info

# Check Android build configuration
cat android/app/google-services.json | jq '.project_info'

# Check iOS build configuration  
cat ios/ISPApp/GoogleService-Info.plist

# Run specific test
npx jest src/services/__tests__/notificationService.test.ts --testNamePattern="Permission Request"

# Run with verbose output
npx jest src/services/__tests__/notificationService.test.ts --verbose

# Check TypeScript errors
npx tsc --noEmit --skipLibCheck

# Check bundle for notification dependencies
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/bundle.js --verbose
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/test-notifications.js [options]

Options:
  --unit-only     Run only unit tests
  --lint-only     Run only linting
  --type-only     Run only type checking
  --help, -h      Show this help message

Examples:
  node scripts/test-notifications.js
  node scripts/test-notifications.js --unit-only
  node scripts/test-notifications.js --lint-only
`);
    return;
  }

  let allPassed = true;

  if (args.includes('--unit-only')) {
    allPassed = runJestTests() && allPassed;
  } else if (args.includes('--lint-only')) {
    allPassed = runLinting() && allPassed;
  } else if (args.includes('--type-only')) {
    allPassed = runTypeCheck() && allPassed;
  } else {
    // Run all tests
    allPassed = runTypeCheck() && allPassed;
    allPassed = runLinting() && allPassed;
    allPassed = runJestTests() && allPassed;
  }

  showTestInstructions();
  showDebugCommands();

  console.log('\n📊 Test Summary');
  console.log('================');
  if (allPassed) {
    console.log('✅ All tests passed!');
    console.log('🎉 Notification service is ready for use.');
  } else {
    console.log('❌ Some tests failed.');
    console.log('🔧 Please fix the issues before deploying.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the main function
main();
