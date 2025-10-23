import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { useTranslation } from 'react-i18next';
import CommonHeader from '../components/CommonHeader';
import { 
  runNotificationTests,
  runManualNotificationTests,
  getNotificationDebugInfo
} from '../services/notificationTest';

const NotificationTestScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleRunUnitTests = async () => {
    setIsRunningTests(true);
    addTestResult('Starting unit tests...');
    
    try {
      await runNotificationTests();
      addTestResult('Unit tests completed - check console for results');
    } catch (error) {
      addTestResult(`Unit tests failed: ${error}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunManualTests = async () => {
    setIsRunningTests(true);
    addTestResult('Starting manual tests...');
    
    try {
      await runManualNotificationTests();
      addTestResult('Manual tests completed');
    } catch (error) {
      addTestResult(`Manual tests failed: ${error}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleGetDebugInfo = async () => {
    try {
      await getNotificationDebugInfo();
      addTestResult('Debug info retrieved - check console');
    } catch (error) {
      addTestResult(`Debug info failed: ${error}`);
    }
  };

  const handleTestPermission = async () => {
    try {
      const { requestNotificationPermissions } = await import('../notificationService');
      const result = await requestNotificationPermissions();
      Alert.alert('Permission Test', `Permission granted: ${result}`);
      addTestResult(`Permission test: ${result ? 'GRANTED' : 'DENIED'}`);
    } catch (error) {
      addTestResult(`Permission test failed: ${error}`);
    }
  };

  const handleTestLocalNotification = () => {
    try {
      const { showLocalNotification } = require('../notificationService');
      showLocalNotification('Test Notification', 'This is a test notification from the test screen');
      addTestResult('Local notification sent');
    } catch (error) {
      addTestResult(`Local notification failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const TestButton = ({ title, onPress, disabled = false }: { title: string, onPress: () => void, disabled?: boolean }) => (
    <TouchableOpacity
      style={[
        styles.testButton,
        { backgroundColor: colors.card, shadowColor: colors.shadow },
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled || isRunningTests}
      activeOpacity={0.7}
    >
      <Text style={[styles.testButtonText, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader
        navigation={navigation}
        showBackButton={true}
        title="Notification Tests"
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Suite</Text>
          
          <TestButton
            title="Run Unit Tests"
            onPress={handleRunUnitTests}
            disabled={isRunningTests}
          />
          
          <TestButton
            title="Run Manual Tests"
            onPress={handleRunManualTests}
            disabled={isRunningTests}
          />
          
          <TestButton
            title="Get Debug Info"
            onPress={handleGetDebugInfo}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Individual Tests</Text>
          
          <TestButton
            title="Test Permissions"
            onPress={handleTestPermission}
            disabled={isRunningTests}
          />
          
          <TestButton
            title="Test Local Notification"
            onPress={handleTestLocalNotification}
            disabled={isRunningTests}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Results</Text>
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.accent }]}
              onPress={clearResults}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          {isRunningTests && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Running tests...</Text>
            </View>
          )}
          
          <View style={[styles.resultsContainer, { backgroundColor: colors.card }]}>
            {testResults.length === 0 ? (
              <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                No test results yet. Run some tests to see results here.
              </Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={[styles.resultText, { color: colors.text }]}>
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
          <View style={[styles.instructionsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              1. Unit Tests: Automated tests with mocked dependencies{'\n'}
              2. Manual Tests: Interactive tests that require user interaction{'\n'}
              3. Debug Info: Shows device and token information{'\n'}
              4. Individual Tests: Test specific functionality{'\n\n'}
              Check the console for detailed logs and results.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  testButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  resultsContainer: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    maxHeight: 200,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    borderRadius: 12,
    padding: 16,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationTestScreen;
