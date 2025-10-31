import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { getClientConfig } from '../config/client-config';
import sessionManager from '../services/sessionManager';
import CommonHeader from '../components/CommonHeader';

const PaymentResponseScreen = ({ route, navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  
  // Add useEffect to log when component mounts
  React.useEffect(() => {
    // console.log('=== PAYMENT RESPONSE SCREEN MOUNTED ===');
    // console.log('Route object:', route);
    // console.log('Route params:', route.params);
    // console.log('Navigation object:', navigation);
    
    // Check if the entire route object is a JSON string
    if (typeof route === 'string' && (route.includes('"program":"Admin Payment Response"') || route.includes('"program":"Get Transaction Detail"'))) {
      //console.log('Entire route is Payment Response JSON!');
      try {
        const parsedRoute = JSON.parse(route);
        //console.log('Parsed entire route:', parsedRoute);
        
        if (parsedRoute.data && parsedRoute.data.txn_status) {
          const txnRef = parsedRoute.data.txn_id;
          const amount = parsedRoute.data.amount;
          const status = parsedRoute.data.txn_status;
          const pgInfo = 'EASEBUZZ';
          console.log('Extracted from entire route:', { txnRef, amount, status, pgInfo });
          
          // Force re-render with extracted data
          setExtractedData({ txnRef, source: null, pgInfo, amount, status });
        } else if (parsedRoute.data && Array.isArray(parsedRoute.data) && parsedRoute.data.length > 0) {
          // Handle Get Transaction Detail format
          const transactionData = parsedRoute.data[0];
          const txnRef = transactionData.txn_id || transactionData.txn_ref || transactionData.merchant_txn_id;
          const amount = transactionData.amount;
          const status = transactionData.txn_status || transactionData.status;
          const pgInfo = 'EASEBUZZ';
          console.log('Extracted from entire route (Get Transaction Detail):', { txnRef, amount, status, pgInfo });
          
          // Force re-render with extracted data
          setExtractedData({ txnRef, source: null, pgInfo, amount, status });
        }
      } catch (e) {
        console.error('Failed to parse entire route:', e);
      }
    }
    
    // Check if any parameter contains EASEBUZZ JSON response
    if (route.params && typeof route.params === 'object') {
      for (const [key, value] of Object.entries(route.params)) {
        if (typeof value === 'string' && (value.includes('"program":"Admin Payment Response"') || value.includes('"program":"Get Transaction Detail"'))) {
          console.log(`Found EASEBUZZ JSON response in parameter: ${key}`);
          try {
            const parsedValue = JSON.parse(value);
            console.log('Parsed EASEBUZZ response:', parsedValue);
            
            if (parsedValue.data && parsedValue.data.txn_status) {
              const txnRef = parsedValue.data.txn_id;
              const amount = parsedValue.data.amount;
              const status = parsedValue.data.txn_status;
              const pgInfo = 'EASEBUZZ';
              console.log('Extracted from EASEBUZZ response:', { txnRef, amount, status, pgInfo });
              
              // Force re-render with extracted data
              setExtractedData({ txnRef, source: null, pgInfo, amount, status });
              break;
            } else if (parsedValue.data && Array.isArray(parsedValue.data) && parsedValue.data.length > 0) {
              const transactionData = parsedValue.data[0];
              const txnRef = transactionData.txn_id || transactionData.txn_ref || transactionData.merchant_txn_id;
              const amount = transactionData.amount;
              const status = transactionData.txn_status || transactionData.status;
              const pgInfo = 'EASEBUZZ';
              console.log('Extracted from EASEBUZZ Get Transaction Detail:', { txnRef, amount, status, pgInfo });
              
              // Force re-render with extracted data
              setExtractedData({ txnRef, source: null, pgInfo, amount, status });
              break;
            }
          } catch (e) {
            console.error('Failed to parse EASEBUZZ response:', e);
          }
        }
      }
    }
  }, []);
  
  // State to hold extracted data
  const [extractedData, setExtractedData] = useState<any>(null);
  
  // Parse route params to handle JSON data
  const parseRouteParams = () => {
    const params = route.params || {};
    // console.log('=== PAYMENT RESPONSE SCREEN DEBUG ===');
    // console.log('Raw route params:', params);
    // console.log('Route params type:', typeof params);
    // console.log('Route params keys:', Object.keys(params));
    // console.log('Full route object:', route);
    
    // Check if params is actually the JSON response itself
    if (typeof params === 'string' && (params.includes('"program":"Admin Payment Response"') || params.includes('"program":"Get Transaction Detail"'))) {
      //console.log('Detected Payment Response JSON string');
      try {
        const parsedResponse = JSON.parse(params);
        //console.log('Parsed Payment Response:', parsedResponse);
        
        // Handle Admin Payment Response format
        if (parsedResponse.data && parsedResponse.data.txn_status) {
          const txnRef = parsedResponse.data.txn_id;
          const amount = parsedResponse.data.amount;
          const status = parsedResponse.data.txn_status;
          const pgInfo = 'EASEBUZZ';
          console.log('Extracted from Admin Payment Response:', { txnRef, amount, status, pgInfo });
          return { txnRef, source: null, pgInfo, amount, status };
        }
        
        // Handle Get Transaction Detail format
        if (parsedResponse.data && Array.isArray(parsedResponse.data) && parsedResponse.data.length > 0) {
          const transactionData = parsedResponse.data[0];
          const txnRef = transactionData.txn_id || transactionData.txn_ref || transactionData.merchant_txn_id;
          const amount = transactionData.amount;
          const status = transactionData.txn_status || transactionData.status;
          const pgInfo = transactionData.pg_info || 'EASEBUZZ';
          console.log('Extracted from Get Transaction Detail:', { txnRef, amount, status, pgInfo });
          return { txnRef, source: null, pgInfo, amount, status };
        }
      } catch (e) {
        console.error('Failed to parse Payment Response:', e);
      }
    }
    
    // Check if the entire route object is a JSON string (extreme edge case)
    if (typeof route === 'string') {
      try {
        const parsedRoute = JSON.parse(route);
        console.log('Entire route was JSON string, parsed:', parsedRoute);
        
        if (parsedRoute.data && parsedRoute.data.txn_status) {
          const txnRef = parsedRoute.data.txn_id;
          const amount = parsedRoute.data.amount;
          const status = parsedRoute.data.txn_status;
          const pgInfo = 'EASEBUZZ';
          console.log('Easebuzz response from entire route detected:', { txnRef, amount, status, pgInfo });
          return { txnRef, source: null, pgInfo, amount, status };
        }
      } catch (e) {
        console.error('Failed to parse entire route as JSON:', e);
      }
    }
    
    let txnRef, source, pgInfo, amount, status;
    
    // Check if the entire route.params is a JSON string (edge case)
    if (typeof route.params === 'string') {
      try {
        const parsedRouteParams = JSON.parse(route.params);
        console.log('Route params was JSON string, parsed:', parsedRouteParams);
        
        // Handle Easebuzz payment gateway response format
        if (parsedRouteParams.data && parsedRouteParams.data.txn_status) {
          txnRef = parsedRouteParams.data.txn_id;
          amount = parsedRouteParams.data.amount;
          status = parsedRouteParams.data.txn_status;
          pgInfo = 'EASEBUZZ';
          console.log('Easebuzz response from route params detected:', { txnRef, amount, status, pgInfo });
          return { txnRef, source, pgInfo, amount, status };
        }
        
        // Handle Get Transaction Detail format
        if (parsedRouteParams.data && Array.isArray(parsedRouteParams.data) && parsedRouteParams.data.length > 0) {
          const transactionData = parsedRouteParams.data[0];
          txnRef = transactionData.txn_id || transactionData.txn_ref || transactionData.merchant_txn_id;
          amount = transactionData.amount;
          status = transactionData.txn_status || transactionData.status;
          pgInfo = transactionData.pg_info || 'EASEBUZZ';
          console.log('Get Transaction Detail from route params detected:', { txnRef, amount, status, pgInfo });
          return { txnRef, source, pgInfo, amount, status };
        }
        
        // Handle other JSON formats that might be passed as route params
        if (parsedRouteParams.txnRef || parsedRouteParams.txn_ref || parsedRouteParams.merTxnId) {
          txnRef = parsedRouteParams.txnRef || parsedRouteParams.txn_ref || parsedRouteParams.merTxnId;
          source = parsedRouteParams.source;
          pgInfo = parsedRouteParams.pgInfo || parsedRouteParams.pg_info;
          amount = parsedRouteParams.amount;
          status = parsedRouteParams.status || parsedRouteParams.payment_status || parsedRouteParams.txn_status || 'success';
          console.log('Other JSON response from route params detected:', { txnRef, source, pgInfo, amount, status });
          return { txnRef, source, pgInfo, amount, status };
        }
      } catch (e) {
        console.error('Failed to parse route params as JSON:', e);
      }
    }
    
    // Check if any individual parameter is a JSON string
    if (typeof params === 'object' && params !== null) {
      for (const [key, value] of Object.entries(params)) {
        console.log(`Checking parameter ${key}:`, value, 'type:', typeof value);
        
        // Check for common parameter names that might contain JSON
        if (key === 'response' || key === 'data' || key === 'json' || key === 'result') {
          console.log(`Found potential JSON parameter: ${key}`);
        }
        
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            const parsedValue = JSON.parse(value);
            console.log(`Parameter ${key} was JSON string, parsed:`, parsedValue);
            
            // Handle Easebuzz response format in any parameter
            if (parsedValue.data && parsedValue.data.txn_status) {
              txnRef = parsedValue.data.txn_id;
              amount = parsedValue.data.amount;
              status = parsedValue.data.txn_status;
              pgInfo = 'EASEBUZZ';
              console.log('Easebuzz response found in parameter:', key, { txnRef, amount, status, pgInfo });
              return { txnRef, source, pgInfo, amount, status };
            }
            
            // Handle Get Transaction Detail format in any parameter
            if (parsedValue.data && Array.isArray(parsedValue.data) && parsedValue.data.length > 0) {
              const transactionData = parsedValue.data[0];
              txnRef = transactionData.txn_id || transactionData.txn_ref || transactionData.merchant_txn_id;
              amount = transactionData.amount;
              status = transactionData.txn_status || transactionData.status;
              pgInfo = transactionData.pg_info || 'EASEBUZZ';
              console.log('Get Transaction Detail found in parameter:', key, { txnRef, amount, status, pgInfo });
              return { txnRef, source, pgInfo, amount, status };
            }
            
            // Handle other JSON formats
            if (parsedValue.txnRef || parsedValue.txn_ref || parsedValue.merTxnId || parsedValue.txn_id) {
              txnRef = parsedValue.txnRef || parsedValue.txn_ref || parsedValue.merTxnId || parsedValue.txn_id;
              source = parsedValue.source;
              pgInfo = parsedValue.pgInfo || parsedValue.pg_info;
              amount = parsedValue.amount;
              status = parsedValue.status || parsedValue.payment_status || parsedValue.txn_status || 'success';
              console.log('Other JSON response found in parameter:', key, { txnRef, source, pgInfo, amount, status });
              return { txnRef, source, pgInfo, amount, status };
            }
          } catch (e) {
            console.log(`Parameter ${key} is not valid JSON:`, e);
          }
        }
      }
    }
    
    // Check if params is a JSON string
    if (typeof params === 'string') {
      try {
        const parsedParams = JSON.parse(params);
        console.log('Parsed JSON params:', parsedParams);
        
        // Handle Easebuzz payment gateway response format
        if (parsedParams.data && parsedParams.data.txn_status) {
          txnRef = parsedParams.data.txn_id;
          amount = parsedParams.data.amount;
          status = parsedParams.data.txn_status;
          pgInfo = 'EASEBUZZ'; // Extract from the response or use default
          console.log('Easebuzz response detected:', { txnRef, amount, status, pgInfo });
        } else if (parsedParams.data && Array.isArray(parsedParams.data) && parsedParams.data.length > 0) {
          // Handle Get Transaction Detail format
          const transactionData = parsedParams.data[0];
          txnRef = transactionData.txn_id || transactionData.txn_ref || transactionData.merchant_txn_id;
          amount = transactionData.amount;
          status = transactionData.txn_status || transactionData.status;
          pgInfo = transactionData.pg_info || 'EASEBUZZ';
          console.log('Get Transaction Detail detected:', { txnRef, amount, status, pgInfo });
        } else {
          // Handle other JSON formats
          txnRef = parsedParams.txnRef || parsedParams.txn_ref || parsedParams.merTxnId || parsedParams.txn_id;
          source = parsedParams.source;
          pgInfo = parsedParams.pgInfo || parsedParams.pg_info;
          amount = parsedParams.amount;
          status = parsedParams.status || parsedParams.payment_status || parsedParams.txn_status;
        }
      } catch (e) {
        console.error('Failed to parse JSON params:', e);
        // If JSON parsing fails, treat the string as status
        status = params;
      }
    } else if (typeof params === 'object' && params !== null) {
      // Handle object params - check for Easebuzz format first
      if (params.data && params.data.txn_status) {
        txnRef = params.data.txn_id;
        amount = params.data.amount;
        status = params.data.txn_status;
        pgInfo = 'EASEBUZZ';
        console.log('Easebuzz object response detected:', { txnRef, amount, status, pgInfo });
      } else {
        // Handle other object formats
        txnRef = params.txnRef || params.txn_ref || params.merTxnId || params.txn_id;
        source = params.source;
        pgInfo = params.pgInfo || params.pg_info;
        amount = params.amount;
        status = params.status || params.payment_status || params.txn_status;
      }
    } else {
      // Fallback for completely malformed params
      console.warn('Malformed route params, using defaults');
      status = 'success';
    }
    
    console.log('Final parsed values:', { txnRef, source, pgInfo, amount, status });
    
    // If we still don't have valid data, try to extract from raw params as last resort
    if (!txnRef && !pgInfo && !amount) {
      console.log('No valid data extracted, trying raw params extraction...');
      
      // Try to find any transaction-related data in the raw params
      const rawParamsStr = JSON.stringify(params);
      console.log('Raw params string:', rawParamsStr);
      
      if (rawParamsStr.includes('txn_id') || rawParamsStr.includes('txn_status') || rawParamsStr.includes('amount')) {
        console.log('Found transaction data in raw params, attempting extraction...');
        
        // Try to extract using regex as last resort
        const txnIdMatch = rawParamsStr.match(/"txn_id"\s*:\s*"([^"]+)"/);
        const amountMatch = rawParamsStr.match(/"amount"\s*:\s*(\d+)/);
        const statusMatch = rawParamsStr.match(/"txn_status"\s*:\s*"([^"]+)"/);
        
        if (txnIdMatch) txnRef = txnIdMatch[1];
        if (amountMatch) amount = parseInt(amountMatch[1]);
        if (statusMatch) status = statusMatch[1];
        pgInfo = 'EASEBUZZ';
        
        console.log('Extracted from raw params:', { txnRef, amount, status, pgInfo });
      }
      
      // If still no data, check if the entire params is a JSON object with the response
      if (!txnRef && !pgInfo && !amount && typeof params === 'object' && params !== null) {
        console.log('Checking if params itself contains the response data...');
        
        // Check if params has the structure we're looking for
        if (params.data && params.data.txn_status) {
          txnRef = params.data.txn_id;
          amount = params.data.amount;
          status = params.data.txn_status;
          pgInfo = 'EASEBUZZ';
          console.log('Found response data directly in params:', { txnRef, amount, status, pgInfo });
        } else if (params.data && Array.isArray(params.data) && params.data.length > 0) {
          // Handle Get Transaction Detail format directly in params
          const transactionData = params.data[0];
          txnRef = transactionData.txn_id || transactionData.txn_ref || transactionData.merchant_txn_id;
          amount = transactionData.amount;
          status = transactionData.txn_status || transactionData.status;
          pgInfo = transactionData.pg_info || 'EASEBUZZ';
          console.log('Found Get Transaction Detail data directly in params:', { txnRef, amount, status, pgInfo });
        }
      }
    }
    
    return { txnRef, source, pgInfo, amount, status };
  };
  
  const parsedParams = parseRouteParams();
  const { txnRef, source, pgInfo, amount, status } = extractedData || parsedParams;
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Use the status from route params, default to 'success' only if not provided
  const paymentStatus = status || 'success';
  console.log('Final payment status:', paymentStatus);
  
  // Additional validation to ensure we have valid data
  if (!txnRef && !pgInfo && !amount) {
    console.warn('PaymentResponseScreen: Missing payment details, showing generic response');
  }

  const statusInfo: Record<string, { icon: string; color: string; title: string; message: string; emoji: string }> = {
    success: {
      icon: 'check-circle',
      color: colors.success || '#4CAF50',
      title: t('paymentResponse.successTitle') || 'Payment Successful',
      message: t('paymentResponse.successMessage') || 'Your payment was processed successfully.',
      emoji: '✅'
    },
    failure: {
      icon: 'alert-circle',
      color: colors.error || '#F44336',
      title: t('paymentResponse.failureTitle') || 'Payment Failed',
      message: t('paymentResponse.failureMessage') || 'There was a problem processing your payment.',
      emoji: '❌'
    },
    failed: {
      icon: 'alert-circle',
      color: colors.error || '#F44336',
      title: t('paymentResponse.failureTitle') || 'Payment Failed',
      message: t('paymentResponse.failureMessage') || 'There was a problem processing your payment.',
      emoji: '❌'
    },
    fail: {
      icon: 'alert-circle',
      color: colors.error || '#F44336',
      title: t('paymentResponse.failureTitle') || 'Payment Failed',
      message: t('paymentResponse.failureMessage') || 'There was a problem processing your payment.',
      emoji: '❌'
    },
    cancelled: {
      icon: 'close-circle',
      color: colors.warning || '#FFC107',
      title: t('paymentResponse.cancelledTitle') || 'Payment Cancelled',
      message: t('paymentResponse.cancelledMessage') || 'Your payment was cancelled.',
      emoji: '⚠️'
    },
    pending: {
      icon: 'clock-outline',
      color: colors.warning || '#FFC107',
      title: t('paymentResponse.pendingTitle') || 'Payment Pending',
      message: t('paymentResponse.pendingMessage') || 'Your payment is being processed. Please wait.',
      emoji: '⏳'
    },
    in_progress: {
      icon: 'clock-outline',
      color: colors.warning || '#FFC107',
      title: t('paymentResponse.pendingTitle') || 'Payment Pending',
      message: t('paymentResponse.pendingMessage') || 'Your payment is being processed. Please wait.',
      emoji: '⏳'
    },
    pg_pending: {
      icon: 'clock-outline',
      color: colors.warning || '#FFC107',
      title: t('paymentResponse.pendingTitle') || 'Payment Pending',
      message: t('paymentResponse.pendingMessage') || 'Your payment is being processed. Please wait.',
      emoji: '⏳'
    }
  };
  
  const info = statusInfo[paymentStatus] || statusInfo.failed;
  console.log('Selected status info:', info);

  const handleCheckStatus = async () => {
    if (!txnRef) {
      Alert.alert('Error', 'Transaction reference not found');
      return;
    }

    setIsCheckingStatus(true);
    try {
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      const session = await sessionManager.getCurrentSession();
      const username = session?.username;
      
      if (!username) {
        Alert.alert('Error', 'User session not found. Please login again.');
        return;
      }
      
      //console.log('Checking payment status for txnRef:', txnRef, 'username:', username);
      const paymentStatusResponse = await apiService.getPaymentStatus(username, txnRef, realm);
      
      //console.log('Payment status result:', paymentStatusResponse);
      
      // Extract the actual status from the response
      let actualStatus = '';
      let statusMessage = '';
      
      if (typeof paymentStatusResponse === 'object' && paymentStatusResponse !== null) {
        // Handle EASEBUZZ response format
        if (paymentStatusResponse.data && Array.isArray(paymentStatusResponse.data) && paymentStatusResponse.data.length > 0) {
          actualStatus = paymentStatusResponse.data[0].txn_status || paymentStatusResponse.data[0].status || '';
          statusMessage = paymentStatusResponse.data[0].message || paymentStatusResponse.message || '';
        } else if (paymentStatusResponse.data && paymentStatusResponse.data.txn_status) {
          actualStatus = paymentStatusResponse.data.txn_status;
          statusMessage = paymentStatusResponse.data.message || paymentStatusResponse.message || '';
        } else if (paymentStatusResponse.status) {
          actualStatus = paymentStatusResponse.status;
          statusMessage = paymentStatusResponse.message || '';
        }
      } else if (typeof paymentStatusResponse === 'string') {
        actualStatus = paymentStatusResponse;
        statusMessage = '';
      }
      
      console.log('Extracted status:', actualStatus);
      console.log('Status message:', statusMessage);
      
      if (actualStatus === 'success' || actualStatus === 'S' || actualStatus === 'completed') {
        Alert.alert(
          'Payment Status Updated', 
          'Great! Your payment was successful. Your plan has been activated.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Home') }
          ]
        );
      } else if (actualStatus === 'failed' || actualStatus === 'F' || actualStatus === 'fail' || actualStatus === 'cancelled') {
        Alert.alert(
          'Payment Status', 
          `Payment status: ${actualStatus.toUpperCase()}. ${statusMessage || 'Please try again later.'}`,
          [{ text: 'OK' }]
        );
      } else if (actualStatus === 'pending' || actualStatus === 'in_progress' || actualStatus === 'pg_pending') {
        Alert.alert(
          'Payment Status', 
          'Payment is still being processed. Please wait a few minutes and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Payment Status', 
          `Current status: ${actualStatus || 'Unknown'}. ${statusMessage || 'Please contact support if you have any questions.'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      Alert.alert('Error', 'Failed to check payment status. Please try again later.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const isFailedPayment = paymentStatus === 'failure' || paymentStatus === 'failed' || paymentStatus === 'fail' || paymentStatus === 'pending' || paymentStatus === 'in_progress' || paymentStatus === 'pg_pending';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {/* Modern icon with background circle */}
          <View style={[styles.iconBackground, { backgroundColor: info.color + '20' }]}>
            <Text style={[styles.iconText, { color: info.color }]}>
              {info.emoji}
            </Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{info.title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{info.message}</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Gateway</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {typeof pgInfo === 'string' ? pgInfo : (pgInfo ? JSON.stringify(pgInfo) : '-')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Txn Ref</Text>
            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
              {typeof txnRef === 'string' ? txnRef : (txnRef ? JSON.stringify(txnRef) : '-')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount</Text>
            <Text style={[styles.detailValue, { color: colors.text, fontWeight: 'bold' }]}>
              ₹{typeof amount === 'number' || typeof amount === 'string' ? amount : (amount ? JSON.stringify(amount) : '-')}
            </Text>
          </View>
        </View>
        
        {/* Buttons in same row */}
        <View style={styles.buttonContainer}>
          {/* Show Check Status button for failed payments */}
          {isFailedPayment && (
            <TouchableOpacity
              style={[styles.button, styles.checkStatusButton, { backgroundColor: colors.primary || '#007AFF' }]}
              onPress={handleCheckStatus}
              disabled={isCheckingStatus}
            >
              <Text style={styles.buttonText}>
                {isCheckingStatus ? 'Checking...' : (t('paymentResponse.checkStatus') || 'Check Status')}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: info.color }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>{t('paymentResponse.goHome') || 'Go to Home'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    marginTop: 32,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkStatusButton: {
    marginRight: 8,
  },
  emojiIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    opacity: 0.8, // Make it slightly transparent so vector icon shows through if available
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
});

export default PaymentResponseScreen; 