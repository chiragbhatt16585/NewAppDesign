import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { useTranslation } from 'react-i18next';
import CommonHeader from '../components/CommonHeader';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import { getClientConfig } from '../config/client-config';

const PaymentLinkScreen = ({ navigation, route }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);

  const [isPaymentProcessed, setIsPaymentProcessed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentTimeout, setPaymentTimeout] = useState<NodeJS.Timeout | null>(null);

  const { source, pgInfo, amount, merTxnId } = route.params || {};

  useEffect(() => {
    if (!source || !pgInfo || !amount || !merTxnId) {
      setError('Invalid payment parameters');
      setLoading(false);
    } else {
      // Set a timeout to automatically check payment status after 30 seconds
      const timeout = setTimeout(() => {
        console.log('Payment timeout reached, checking status automatically');
        if (!isPaymentProcessed) {
          runPayments();
        }
      }, 30000); // 30 seconds timeout
      
      setPaymentTimeout(timeout);
    }

    // Cleanup timeout on unmount
    return () => {
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
      }
    };
  }, [source, pgInfo, amount, merTxnId]);

  const processPayment = (event: any) => {
    console.log('Payment navigation event:', event);
    const eventURL = new URL(event.url);
    
    // Check if payment is completed (response.php endpoint)
    if (eventURL.pathname.includes('/tp/pg/response.php')) {
      console.log('Payment response endpoint detected');
      if (!isPaymentProcessed) {
        runPayments();
      }
    } 
    // Check for client-specific success URLs
    else if (eventURL.href.includes('http://selfcare.radinet.in/') && 
             !eventURL.pathname.includes('EBSRedirect.php') && 
             !eventURL.pathname.includes('pgRedirect.php')) {
      console.log('Client-specific success URL detected');
      if (!isPaymentProcessed) {
        setIsPaymentProcessed(true);
        runPayments();
      }
    }
    // Handle JSON responses that might be displayed in WebView
    else if (eventURL.pathname.includes('.json') || 
             eventURL.searchParams.get('format') === 'json' ||
             eventURL.searchParams.get('response_format') === 'json') {
      console.log('JSON response detected, processing payment status');
      if (!isPaymentProcessed) {
        runPayments();
      }
    }
    // Handle any response that contains payment status indicators
    else if (eventURL.searchParams.get('status') || 
             eventURL.searchParams.get('payment_status') ||
             eventURL.searchParams.get('txn_status')) {
      console.log('Payment status parameter detected in URL');
      if (!isPaymentProcessed) {
        runPayments();
      }
    }
  };

  const runPayments = async () => {
    try {
      console.log('=== RUN PAYMENTS DEBUG ===');
      console.log('Merchant Txn ID:', merTxnId);
      console.log('Payment Gateway:', pgInfo);
      console.log('Amount:', amount);
      console.log('Platform:', Platform.OS);
      
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) {
        throw new Error('No user session found');
      }

      console.log('Session username:', session.username);

      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      console.log('Client realm:', realm);

      // Use the sophisticated payment status checking logic from old implementation
      await checkPaymentStatusWithRetry(session.username, merTxnId, realm);
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      console.log('Defaulting to failed payment due to error');
      // Default to failed payment if we can't check status
      paymentResponse('fail');
    }
  };

  const checkPaymentStatusWithRetry = async (username: string, merTxnId: string, realm: string) => {
    console.log('Starting payment status check with retry logic');
    
    const checkStatus = async (): Promise<void> => {
      try {
        const paymentStatus = await apiService.getPaymentStatus(username, merTxnId, realm);
        console.log('Raw Payment Status Response:', {
          status: paymentStatus,
          type: typeof paymentStatus,
          platform: Platform.OS
        });
        
        // Normalize the payment status to lowercase for consistent comparison
        const normalizedStatus = (paymentStatus || '').toLowerCase().trim();
        console.log('Normalized Payment Status:', normalizedStatus);
        
        // Platform-specific status handling
        if (Platform.OS === 'ios') {
          console.log('iOS Payment Status Details:', {
            rawStatus: paymentStatus,
            normalizedStatus,
            merTxnId,
            username,
            timestamp: new Date().toISOString()
          });

          // On iOS, handle pg_pending differently
          if (normalizedStatus === 'pg_pending') {
            console.log('iOS: PG Pending status detected, checking payment status...');
            // Make an additional API call to verify payment
            const verifiedStatus = await apiService.verifyPaymentStatus(username, merTxnId, realm);
            console.log('iOS: Verified Payment Status:', verifiedStatus);
            
            if (verifiedStatus === 'success' || verifiedStatus === 'completed') {
              paymentResponse('success');
            } else {
              // Retry after 2 seconds
              setTimeout(() => checkStatus(), 2000);
            }
          } else if (normalizedStatus === 'success' || 
                    normalizedStatus === 'completed' || 
                    normalizedStatus === 'succeeded') {
            console.log('iOS: Setting status to SUCCESS');
            paymentResponse('success');
          } else if (normalizedStatus === 'in_progress' || 
                    normalizedStatus === 'pending' || 
                    normalizedStatus === 'processing' ||
                    normalizedStatus === 'new') {
            console.log('iOS: Setting status to PENDING, retrying in 2 seconds');
            setTimeout(() => checkStatus(), 2000);
          } else {
            console.log('iOS: Checking for failure status');
            if (normalizedStatus === 'fail' || 
                normalizedStatus === 'failed' || 
                normalizedStatus === 'error' ||
                normalizedStatus === 'cancelled' ||
                normalizedStatus === 'canceled') {
              console.log('iOS: Setting status to FAILED');
              paymentResponse('fail');
            } else {
              console.log('iOS: Unknown status, retrying in 2 seconds');
              setTimeout(() => checkStatus(), 2000);
            }
          }
        } else {
          // Android handling
          if (normalizedStatus === 'success' || 
              normalizedStatus === 'completed' || 
              normalizedStatus === 'succeeded') {
            console.log('Android: Setting status to SUCCESS');
            paymentResponse('success');
          } else if (normalizedStatus === 'in_progress' || 
                    normalizedStatus === 'pending' || 
                    normalizedStatus === 'processing' ||
                    normalizedStatus === 'new' ||
                    normalizedStatus === 'pg_pending') {
            console.log('Android: Setting status to PENDING, retrying in 5 seconds');
            setTimeout(() => checkStatus(), 5000);
          } else {
            console.log('Android: Checking for failure status');
            if (normalizedStatus === 'fail' || 
                normalizedStatus === 'failed' || 
                normalizedStatus === 'error') {
              console.log('Android: Setting status to FAILED');
              paymentResponse('fail');
            } else {
              console.log('Android: Unknown status, retrying in 5 seconds');
              setTimeout(() => checkStatus(), 5000);
            }
          }
        }
      } catch (error: any) {
        console.error('Error checking payment status:', {
          error: error.message,
          stack: error.stack,
          platform: Platform.OS
        });
        // On error, retry based on platform
        if (Platform.OS === 'ios') {
          console.log('iOS: Error occurred, retrying in 2 seconds');
          setTimeout(() => checkStatus(), 2000);
        } else {
          console.log('Android: Error occurred, retrying in 5 seconds');
          setTimeout(() => checkStatus(), 5000);
        }
      }
    };

    // Start the initial check
    await checkStatus();
  };

  const paymentResponse = (response: any) => {
    console.log('=== PAYMENT RESPONSE DEBUG ===');
    console.log('Raw response:', response);
    console.log('Response type:', typeof response);
    console.log('Is payment already processed:', isPaymentProcessed);
    
    if (isPaymentProcessed) {
      console.log('Payment already processed, ignoring duplicate response');
      return;
    }

    let status = 'failed';
    let isSuccess = false;

    // Handle different response formats
    if (typeof response === 'string') {
      console.log('Processing string response:', response);
      if (response === 'in_progress') {
        status = 'cancelled';
      } else if (response === 'fail' || response === 'new' || response === 'pg_pending') {
        status = 'failed';
      } else if (response === 'success') {
        status = 'success';
        isSuccess = true;
      }
    } else if (typeof response === 'object' && response !== null) {
      console.log('Processing object response:', response);
      // Handle object response (e.g., {status: 'success', message: '...'})
      if (response.status === 'success' || response.payment_status === 'success') {
        status = 'success';
        isSuccess = true;
      } else if (response.status === 'cancelled' || response.payment_status === 'cancelled') {
        status = 'cancelled';
      } else {
        status = 'failed';
      }
    }

    console.log('Final processed status:', status);
    console.log('Is success:', isSuccess);

    setIsPaymentProcessed(true);
    
    // Navigate to payment response screen
    navigation.navigate('PaymentResponse', {
      txnRef: merTxnId,
      source: source,
      pgInfo: pgInfo,
      amount: amount,
      status: status
    });
  };

  const handleWebViewError = (error: any) => {
    console.error('WebView error:', error);
    setError('Failed to load payment page. Please try again.');
    setLoading(false);
  };

  const handleWebViewLoadEnd = () => {
    setLoading(false);
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Please try again or contact support if the problem persists.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('paymentLink.title') || 'Payment Gateway'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {pgInfo} • ₹{amount}
        </Text>
      </View>

      {/* WebView Container */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('paymentLink.loading') || 'Loading payment gateway...'}
            </Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={source}
          style={styles.webview}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onNavigationStateChange={processPayment}
          onError={handleWebViewError}
          onLoadEnd={handleWebViewLoadEnd}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
            // Handle any messages from the payment gateway
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.status || data.payment_status) {
                console.log('Payment status message received:', data);
                if (!isPaymentProcessed) {
                  paymentResponse(data.status || data.payment_status);
                }
              }
            } catch (e) {
              // Not JSON, ignore
            }
          }}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={false}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
          onShouldStartLoadWithRequest={(request) => {
            console.log('WebView should start load:', request.url);
            // Allow all requests but log them for debugging
            return true;
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PaymentLinkScreen; 