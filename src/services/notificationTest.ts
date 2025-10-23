import { Alert, Platform } from 'react-native';
import { 
  initializePushNotifications, 
  requestNotificationPermissions, 
  showLocalNotification,
  registerPendingPushToken,
  registerDeviceManually
} from './notificationService';
import { apiService } from './api';
import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging';

// Mock data for testing
const mockDeviceInfo = {
  deviceId: 'test-device-id',
  brand: 'Test Brand',
  model: 'Test Model',
  systemName: Platform.OS,
  systemVersion: '1.0.0',
  appVersion: '1.0.0',
  buildNumber: '1',
  uniqueId: 'test-unique-id',
};

const mockToken = 'test-fcm-token-12345';
const mockRealm = 'test-realm';

export class NotificationTestSuite {
  private testResults: Array<{test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string}> = [];
  private originalConsoleLog: any;
  private originalConsoleWarn: any;
  private originalConsoleError: any;

  constructor() {
    this.originalConsoleLog = console.log;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;
  }

  private logTest(testName: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string) {
    this.testResults.push({ test: testName, status, message });
    console.log(`[${status}] ${testName}: ${message}`);
  }

  private async mockApiService() {
    // Mock the API service methods
    const originalAddDeviceDetails = apiService.addDeviceDetails;
    apiService.addDeviceDetails = jest.fn().mockResolvedValue({ success: true });
    
    return () => {
      apiService.addDeviceDetails = originalAddDeviceDetails;
    };
  }

  private async mockDeviceInfo() {
    const originalGetDeviceId = DeviceInfo.getDeviceId;
    const originalGetBrand = DeviceInfo.getBrand;
    const originalGetModel = DeviceInfo.getModel;
    const originalGetSystemName = DeviceInfo.getSystemName;
    const originalGetSystemVersion = DeviceInfo.getSystemVersion;
    const originalGetVersion = DeviceInfo.getVersion;
    const originalGetBuildNumber = DeviceInfo.getBuildNumber;
    const originalGetUniqueId = DeviceInfo.getUniqueId;
    const originalGetDeviceName = DeviceInfo.getDeviceName;
    const originalIsEmulator = DeviceInfo.isEmulator;

    DeviceInfo.getDeviceId = jest.fn().mockReturnValue(mockDeviceInfo.deviceId);
    DeviceInfo.getBrand = jest.fn().mockReturnValue(mockDeviceInfo.brand);
    DeviceInfo.getModel = jest.fn().mockReturnValue(mockDeviceInfo.model);
    DeviceInfo.getSystemName = jest.fn().mockReturnValue(mockDeviceInfo.systemName);
    DeviceInfo.getSystemVersion = jest.fn().mockReturnValue(mockDeviceInfo.systemVersion);
    DeviceInfo.getVersion = jest.fn().mockReturnValue(mockDeviceInfo.appVersion);
    DeviceInfo.getBuildNumber = jest.fn().mockReturnValue(mockDeviceInfo.buildNumber);
    DeviceInfo.getUniqueId = jest.fn().mockReturnValue(mockDeviceInfo.uniqueId);
    DeviceInfo.getDeviceName = jest.fn().mockResolvedValue('Test Device');
    DeviceInfo.isEmulator = jest.fn().mockResolvedValue(false);

    return () => {
      DeviceInfo.getDeviceId = originalGetDeviceId;
      DeviceInfo.getBrand = originalGetBrand;
      DeviceInfo.getModel = originalGetModel;
      DeviceInfo.getSystemName = originalGetSystemName;
      DeviceInfo.getSystemVersion = originalGetSystemVersion;
      DeviceInfo.getVersion = originalGetVersion;
      DeviceInfo.getBuildNumber = originalGetBuildNumber;
      DeviceInfo.getUniqueId = originalGetUniqueId;
      DeviceInfo.getDeviceName = originalGetDeviceName;
      DeviceInfo.isEmulator = originalIsEmulator;
    };
  }

  private async mockFirebaseMessaging() {
    const originalGetToken = messaging().getToken;
    const originalRequestPermission = messaging().requestPermission;
    const originalRegisterDeviceForRemoteMessages = messaging().registerDeviceForRemoteMessages;
    const originalOnTokenRefresh = messaging().onTokenRefresh;

    messaging().getToken = jest.fn().mockResolvedValue(mockToken);
    messaging().requestPermission = jest.fn().mockResolvedValue({ authorizationStatus: 1 });
    messaging().registerDeviceForRemoteMessages = jest.fn().mockResolvedValue(undefined);
    messaging().onTokenRefresh = jest.fn().mockImplementation((callback) => {
      // Simulate token refresh after 1 second
      setTimeout(() => callback(mockToken + '-refreshed'), 1000);
    });

    return () => {
      messaging().getToken = originalGetToken;
      messaging().requestPermission = originalRequestPermission;
      messaging().registerDeviceForRemoteMessages = originalRegisterDeviceForRemoteMessages;
      messaging().onTokenRefresh = originalOnTokenRefresh;
    };
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Notification Service Test Suite...');
    
    try {
      await this.testPermissionRequest();
      await this.testLocalNotification();
      await this.testInitialization();
      await this.testTokenRegistration();
      await this.testDeviceRegistration();
      await this.testErrorHandling();
      await this.testPlatformSpecificBehavior();
      
      this.showTestResults();
    } catch (error) {
      console.error('Test suite failed:', error);
      Alert.alert('Test Suite Failed', `Error: ${error}`);
    }
  }

  async testPermissionRequest(): Promise<void> {
    try {
      const result = await requestNotificationPermissions();
      this.logTest('Permission Request', 'PASS', `Permissions granted: ${result}`);
    } catch (error) {
      this.logTest('Permission Request', 'FAIL', `Error: ${error}`);
    }
  }

  async testLocalNotification(): Promise<void> {
    try {
      showLocalNotification('Test Notification DNA Infotel', 'This is a test notification....');
      this.logTest('Local Notification', 'PASS', 'Local notification displayed successfully');
    } catch (error) {
      this.logTest('Local Notification', 'FAIL', `Error: ${error}`);
    }
  }

  async testInitialization(): Promise<void> {
    try {
      const restoreApi = await this.mockApiService();
      const restoreDevice = await this.mockDeviceInfo();
      const restoreFirebase = await this.mockFirebaseMessaging();

      await initializePushNotifications(mockRealm);
      
      this.logTest('Initialization', 'PASS', 'Push notifications initialized successfully');
      
      restoreApi();
      restoreDevice();
      restoreFirebase();
    } catch (error) {
      this.logTest('Initialization', 'FAIL', `Error: ${error}`);
    }
  }

  async testTokenRegistration(): Promise<void> {
    try {
      const restoreApi = await this.mockApiService();
      const restoreDevice = await this.mockDeviceInfo();
      const restoreFirebase = await this.mockFirebaseMessaging();

      const result = await registerPendingPushToken(mockRealm);
      
      this.logTest('Token Registration', result ? 'PASS' : 'FAIL', 
        result ? 'Token registered successfully' : 'Token registration failed');
      
      restoreApi();
      restoreDevice();
      restoreFirebase();
    } catch (error) {
      this.logTest('Token Registration', 'FAIL', `Error: ${error}`);
    }
  }

  async testDeviceRegistration(): Promise<void> {
    try {
      const restoreApi = await this.mockApiService();
      const restoreDevice = await this.mockDeviceInfo();
      const restoreFirebase = await this.mockFirebaseMessaging();

      const result = await registerDeviceManually(mockRealm);
      
      this.logTest('Device Registration', result ? 'PASS' : 'FAIL', 
        result ? 'Device registered successfully' : 'Device registration failed');
      
      restoreApi();
      restoreDevice();
      restoreFirebase();
    } catch (error) {
      this.logTest('Device Registration', 'FAIL', `Error: ${error}`);
    }
  }

  async testErrorHandling(): Promise<void> {
    try {
      // Test with invalid realm
      const restoreApi = await this.mockApiService();
      const restoreDevice = await this.mockDeviceInfo();
      const restoreFirebase = await this.mockFirebaseMessaging();

      // Mock API to throw error
      apiService.addDeviceDetails = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await registerDeviceManually('invalid-realm');
      
      this.logTest('Error Handling', result ? 'FAIL' : 'PASS', 
        result ? 'Should have failed but succeeded' : 'Error handled correctly');
      
      restoreApi();
      restoreDevice();
      restoreFirebase();
    } catch (error) {
      this.logTest('Error Handling', 'PASS', 'Error handled correctly');
    }
  }

  async testPlatformSpecificBehavior(): Promise<void> {
    try {
      const restoreApi = await this.mockApiService();
      const restoreDevice = await this.mockDeviceInfo();
      const restoreFirebase = await this.mockFirebaseMessaging();

      // Test iOS simulator detection
      DeviceInfo.isEmulator = jest.fn().mockResolvedValue(true);
      
      await initializePushNotifications(mockRealm);
      
      this.logTest('Platform Specific (iOS Simulator)', 'PASS', 'iOS simulator detected and handled');
      
      restoreApi();
      restoreDevice();
      restoreFirebase();
    } catch (error) {
      this.logTest('Platform Specific', 'FAIL', `Error: ${error}`);
    }
  }

  private showTestResults(): void {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    const summary = `Test Results:\n✅ Passed: ${passed}\n❌ Failed: ${failed}\n⏭️ Skipped: ${skipped}\n\nTotal: ${this.testResults.length}`;
    
    console.log('\n' + '='.repeat(50));
    console.log('NOTIFICATION SERVICE TEST RESULTS');
    console.log('='.repeat(50));
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });
    console.log('='.repeat(50));
    console.log(summary);
    
    Alert.alert('Test Results', summary);
  }

  // Manual testing methods for real device testing
  async runManualTests(): Promise<void> {
    console.log('🔧 Starting Manual Notification Tests...');
    
    const tests = [
      {
        name: 'Test Permission Request',
        action: async () => {
          const result = await requestNotificationPermissions();
          Alert.alert('Permission Test', `Permission granted: ${result}`);
          return result;
        }
      },
      {
        name: 'Test Local Notification',
        action: async () => {
          showLocalNotification('Manual Test', 'This is a manual test notification');
          Alert.alert('Local Notification', 'Check if notification appeared');
          return true;
        }
      },
      {
        name: 'Test Initialization',
        action: async () => {
          await initializePushNotifications(mockRealm);
          Alert.alert('Initialization', 'Push notifications initialized');
          return true;
        }
      },
      {
        name: 'Test Token Registration',
        action: async () => {
          const result = await registerPendingPushToken(mockRealm);
          Alert.alert('Token Registration', `Success: ${result}`);
          return result;
        }
      },
      {
        name: 'Test Device Registration',
        action: async () => {
          const result = await registerDeviceManually(mockRealm);
          Alert.alert('Device Registration', `Success: ${result}`);
          return result;
        }
      }
    ];

    for (const test of tests) {
      try {
        console.log(`Running: ${test.name}`);
        await test.action();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
      } catch (error) {
        console.error(`Test failed: ${test.name}`, error);
        Alert.alert('Test Failed', `${test.name}: ${error}`);
      }
    }
    
    Alert.alert('Manual Tests Complete', 'All manual tests have been executed');
  }

  // Debug information method
  async getDebugInfo(): Promise<void> {
    try {
      const deviceInfo = {
        deviceId: DeviceInfo.getDeviceId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        uniqueId: DeviceInfo.getUniqueId(),
        isEmulator: await DeviceInfo.isEmulator(),
        deviceName: await DeviceInfo.getDeviceName(),
      };

      const fcmToken = await messaging().getToken();
      const permissionStatus = await messaging().requestPermission();

      const debugInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        deviceInfo,
        fcmToken: fcmToken ? fcmToken.substring(0, 20) + '...' : 'No token',
        permissionStatus,
        timestamp: new Date().toISOString(),
      };

      console.log('🔍 Debug Information:', JSON.stringify(debugInfo, null, 2));
      Alert.alert('Debug Info', `Platform: ${Platform.OS}\nToken: ${fcmToken ? 'Available' : 'Not available'}\nCheck console for full details`);
    } catch (error) {
      console.error('Failed to get debug info:', error);
      Alert.alert('Debug Error', `Error: ${error}`);
    }
  }
}

// Export singleton instance
export const notificationTestSuite = new NotificationTestSuite();

// Quick test functions for easy access
export const runNotificationTests = () => notificationTestSuite.runAllTests();
export const runManualNotificationTests = () => notificationTestSuite.runManualTests();
export const getNotificationDebugInfo = () => notificationTestSuite.getDebugInfo();
