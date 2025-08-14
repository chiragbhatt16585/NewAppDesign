import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  AppState,
  TouchableOpacity,
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
  const [isOnPaymentForm, setIsOnPaymentForm] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { source, pgInfo, amount, merTxnId } = route.params || {};

  // Debug: Log the amount parameter received
  console.log('=== PAYMENT LINK SCREEN DEBUG ===');
  console.log('Amount received from navigation:', amount);
  console.log('pgInfo:', pgInfo);
  console.log('merTxnId:', merTxnId);
  console.log('Route params:', JSON.stringify(route.params, null, 2));
  console.log('=== END PAYMENT LINK DEBUG ===');

  useEffect(() => {
    if (!source || !pgInfo || !amount || !merTxnId) {
      setError('Invalid payment parameters');
      setLoading(false);
    }
    // Remove automatic timeout-based payment status checking
    // Let the user complete the payment flow naturally

    // Cleanup timeout on unmount
    return () => {
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
      }
    };
  }, [source, pgInfo, amount, merTxnId]);

  // Remove timeout adjustment since we're not using automatic timeouts
  // useEffect(() => {
  //   if (isOnPaymentForm && paymentTimeout) {
  //     console.log('User is on payment form, extending timeout to 2 minutes');
  //     // Clear existing timeout and set a longer one
  //     clearTimeout(paymentTimeout);
  //     const extendedTimeout = setTimeout(() => {
  //       console.log('Extended payment timeout reached, checking status');
  //       if (!isPaymentProcessed) {
  //         runPayments();
  //       }
  //     }, 120000); // 2 minutes for payment forms
  //     
  //     setPaymentTimeout(extendedTimeout);
  //   }
  // }, [isOnPaymentForm]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('App state changed from', appState, 'to', nextAppState);
      
      // Remove automatic payment status checking to prevent premature status checks
      // Only check status when there's actual indication of payment completion
      
      setAppState(nextAppState as any);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, isOnPaymentForm, isPaymentProcessed]);

  const processPayment = (event: any) => {
    console.log('Payment navigation event:', event);
    console.log('Payment URL:', event.url);
    console.log('Payment Gateway:', pgInfo);
    const eventURL = new URL(event.url);
    
    // Check if payment is completed (response.php endpoint)
    if (eventURL.pathname.includes('/tp/pg/response.php')) {
      console.log('Payment response endpoint detected');
      console.log('Response URL:', eventURL.href);
      console.log('Response URL search params:', eventURL.search);
      
      // Reset payment form state since we're now on a response page
      setIsOnPaymentForm(false);
      
      // Check if there's any response data in the URL
      const urlParams = new URLSearchParams(eventURL.search);
      const responseData = urlParams.get('response') || urlParams.get('data') || urlParams.get('result');
      
      if (responseData) {
        console.log('Found response data in URL:', responseData);
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log('Parsed response data:', parsedResponse);
          
          // Check if it's an EASEBUZZ response
          if (parsedResponse.program === 'Admin Payment Response' || parsedResponse.program === 'Get Transaction Detail') {
            console.log('EASEBUZZ response detected in URL params');
            if (!isPaymentProcessed) {
              paymentResponse(parsedResponse);
            }
            return;
          }
        } catch (e) {
          console.log('Failed to parse response data from URL:', e);
        }
      }
      
      if (!isPaymentProcessed) {
        runPayments();
      }
    } 
    // Handle EASEBUZZ specific response URLs
    else if (eventURL.href.includes('pay.easebuzz.in/response/') || 
             eventURL.href.includes('pay.easebuzz.in/webservice/')) {
      console.log('EASEBUZZ response URL detected:', eventURL.href);
      // Reset payment form state since we're now on a response page
      setIsOnPaymentForm(false);
      if (!isPaymentProcessed) {
        // Wait a bit for the response to be processed
        setTimeout(() => {
          runPayments();
        }, 3000);
      }
    }
    // Handle 3D Secure authentication pages (common with EASEBUZZ)
    else if (eventURL.href.includes('securehdfc-acs2ui') || 
             eventURL.href.includes('acs.services') ||
             eventURL.href.includes('3dsecure') ||
             eventURL.href.includes('vbv') ||
             eventURL.href.includes('ipg.bobgateway.com')) {
      console.log('3D Secure authentication page detected:', eventURL.href);
      // Don't process payment yet, let the 3D Secure flow complete
      console.log('Waiting for 3D Secure authentication to complete...');
    }
    // Handle return from third-party payment apps
    else if (eventURL.href.includes('return') || 
             eventURL.href.includes('callback') ||
             eventURL.href.includes('redirect') ||
             eventURL.href.includes('success') ||
             eventURL.href.includes('failure') ||
             eventURL.href.includes('cancel') ||
             eventURL.href.includes('status')) {
      console.log('Return from third-party payment app detected:', eventURL.href);
      // Reset payment form state since we're returning from external app
      setIsOnPaymentForm(false);
      
      // Check for cancelled transaction first
      if (eventURL.href.includes('cancel') || 
          eventURL.href.includes('failure') ||
          eventURL.href.includes('decline') ||
          eventURL.href.includes('reject') ||
          eventURL.href.includes('abort') ||
          // Atom payment gateway specific cancellation patterns
          eventURL.href.includes('atomtech.in/cancel') ||
          eventURL.href.includes('atomtech.in/failure') ||
          eventURL.href.includes('atomtech.in/decline') ||
          eventURL.searchParams.get('status') === 'cancelled' ||
          eventURL.searchParams.get('payment_status') === 'cancelled' ||
          eventURL.searchParams.get('txn_status') === 'cancelled') {
        console.log('Cancelled transaction detected, marking as failed');
        if (!isPaymentProcessed) {
          paymentResponse('fail');
        }
        return;
      }
      
      // Only check payment status if we're on an actual response page and not cancelled
      if (eventURL.href.includes('response') || eventURL.href.includes('callback') || eventURL.href.includes('return')) {
        console.log('Actual payment response detected, checking status...');
        setTimeout(() => {
          if (!isPaymentProcessed && !isProcessingPayment) {
            runPayments();
          }
        }, 3000);
      }
    }
    // Handle OTP pages and payment forms - don't process payment yet
    else if (eventURL.href.includes('otp') || 
             eventURL.href.includes('verification') ||
             eventURL.href.includes('authenticate') ||
             eventURL.href.includes('verify') ||
             eventURL.href.includes('sms') ||
             eventURL.href.includes('mobile') ||
             eventURL.href.includes('phone') ||
             eventURL.href.includes('card') ||
             eventURL.href.includes('payment') ||
             eventURL.href.includes('gateway') ||
             eventURL.href.includes('form')) {
      console.log('OTP/Payment form page detected:', eventURL.href);
      console.log('Allowing user to complete OTP/payment form...');
      setIsOnPaymentForm(true);
      // Don't process payment yet, let the user complete the form/OTP
    }
    // Check for client-specific success URLs
    else if (eventURL.href.includes('http://selfcare.radinet.in/') && 
             !eventURL.pathname.includes('EBSRedirect.php') && 
             !eventURL.pathname.includes('pgRedirect.php')) {
      console.log('Client-specific success URL detected');
      if (!isPaymentProcessed && !isProcessingPayment) {
        setIsPaymentProcessed(true);
        runPayments();
      }
    }
    // Atom payment gateway specific handling
    else if (pgInfo === 'ATOM' && (
             eventURL.href.includes('atomtech.in') ||
             eventURL.href.includes('atom.in') ||
             eventURL.href.includes('atomgateway.in'))) {
      console.log('Atom payment gateway URL detected:', eventURL.href);
      
      // Check for Atom cancellation patterns
      if (eventURL.href.includes('cancel') || 
          eventURL.href.includes('failure') ||
          eventURL.href.includes('decline') ||
          eventURL.href.includes('error')) {
        console.log('Atom cancellation URL pattern detected');
        if (!isPaymentProcessed) {
          paymentResponse('fail');
        }
        return;
      }
      
      // Check for Atom success patterns
      if (eventURL.href.includes('success') || 
          eventURL.href.includes('complete') ||
          eventURL.href.includes('approved')) {
        console.log('Atom success URL pattern detected');
        if (!isPaymentProcessed && !isProcessingPayment) {
          setTimeout(() => {
            runPayments();
          }, 2000);
        }
        return;
      }
      
      // For other Atom URLs, wait and check status
      console.log('Atom payment gateway page detected, waiting for completion...');
      setTimeout(() => {
        if (!isPaymentProcessed && !isProcessingPayment) {
          runPayments();
        }
      }, 3000);
    }
    // Handle JSON responses that might be displayed in WebView
    else if (eventURL.pathname.includes('.json') || 
             eventURL.searchParams.get('format') === 'json' ||
             eventURL.searchParams.get('response_format') === 'json') {
      console.log('JSON response detected, processing payment status');
      if (!isPaymentProcessed && !isProcessingPayment) {
        runPayments();
      }
    }
    // Handle any response that contains payment status indicators - but only on actual response pages
    else if ((eventURL.searchParams.get('status') || 
             eventURL.searchParams.get('payment_status') ||
             eventURL.searchParams.get('txn_status')) &&
             (eventURL.href.includes('response') || 
              eventURL.href.includes('callback') ||
              eventURL.href.includes('return'))) {
      console.log('Payment status parameter detected in response URL');
      if (!isPaymentProcessed && !isProcessingPayment) {
        runPayments();
      }
    }
  };

  const runPayments = async () => {
    if (isProcessingPayment || isPaymentProcessed) {
      console.log('Payment already being processed or completed, skipping...');
      return;
    }
    
    setIsProcessingPayment(true);
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

      // For EASEBUZZ, try to get the response data first
      if (pgInfo === 'EASEBUZZ') {
        console.log('EASEBUZZ detected, waiting for actual payment completion...');
        // Remove automatic status checking - let the user complete the payment flow naturally
        // Only check status when there's actual indication of payment completion from the gateway
      } else if (pgInfo === 'ATOM') {
        console.log('ATOM payment gateway detected, checking for cancellation patterns...');
        // For Atom, check if we're on a cancellation page before checking status
        if (webViewRef.current && !isPaymentProcessed) {
          webViewRef.current.injectJavaScript(`
            (function() {
              try {
                // Check for Atom cancellation indicators in page content
                const bodyText = document.body.innerText || '';
                const titleText = document.title || '';
                
                if (bodyText.toLowerCase().includes('cancelled') || 
                    bodyText.toLowerCase().includes('cancelled') ||
                    bodyText.toLowerCase().includes('declined') ||
                    bodyText.toLowerCase().includes('failed') ||
                    titleText.toLowerCase().includes('cancelled') ||
                    titleText.toLowerCase().includes('failed')) {
                  console.log('Atom cancellation detected in page content');
                  window.ReactNativeWebView.postMessage(JSON.stringify({status: 'cancelled', source: 'page_content'}));
                  return;
                }
                
                // Check for Atom specific error messages
                if (bodyText.includes('Transaction Cancelled') || 
                    bodyText.includes('Payment Failed') ||
                    bodyText.includes('Transaction Declined')) {
                  console.log('Atom specific error message detected');
                  window.ReactNativeWebView.postMessage(JSON.stringify({status: 'cancelled', source: 'error_message'}));
                  return;
                }
                
                console.log('No Atom cancellation detected, proceeding with status check');
              } catch (e) {
                console.log('Error checking Atom cancellation:', e);
              }
            })();
          `);
        }
        
        // Wait a bit for the JavaScript injection to complete, then check status
        setTimeout(async () => {
          if (!isPaymentProcessed && !isProcessingPayment) {
            await checkPaymentStatusWithRetry(session.username, merTxnId, realm);
          }
        }, 2000);
      } else {
        // Use the sophisticated payment status checking logic from old implementation
        await checkPaymentStatusWithRetry(session.username, merTxnId, realm);
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      console.log('Defaulting to failed payment due to error');
      // Default to failed payment if we can't check status
      paymentResponse('fail');
    } finally {
      setIsProcessingPayment(false);
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
        
        // Handle full response object from API
        if (typeof paymentStatus === 'object' && paymentStatus.data) {
          console.log('Full payment status response received:', paymentStatus);
          paymentResponse(paymentStatus);
          return;
        }
        
        // Handle string status (fallback)
        const statusString = typeof paymentStatus === 'string' ? paymentStatus : '';
        const normalizedStatus = statusString.toLowerCase().trim();
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
    let extractedTxnRef = merTxnId;
    let extractedAmount = amount;

    // Handle Easebuzz response format first
    if (typeof response === 'object' && response !== null && response.data) {
      console.log('Processing Easebuzz response:', response);
      
      // Handle both array and object data formats
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Handle Get Transaction Detail format (array)
        const transactionData = response.data[0];
        status = transactionData.txn_status || transactionData.status;
        extractedTxnRef = transactionData.txn_id || transactionData.txn_ref || merTxnId;
        extractedAmount = transactionData.amount || amount;
        console.log('EASEBUZZ array response processed:', { status, extractedTxnRef, extractedAmount });
      } else if (response.data.txn_status) {
        // Handle Admin Payment Response format (object)
        status = response.data.txn_status;
        extractedTxnRef = response.data.txn_id || merTxnId;
        extractedAmount = response.data.amount || amount;
        console.log('EASEBUZZ object response processed:', { status, extractedTxnRef, extractedAmount });
      }
      
      if (status === 'success') {
        isSuccess = true;
      }
    }
    // Handle different response formats
    else if (typeof response === 'string') {
      console.log('Processing string response:', response);
      if (response === 'in_progress') {
        status = 'cancelled';
      } else if (response === 'fail' || response === 'new') {
        status = 'failed';
      } else if (response === 'pg_pending') {
        status = 'pg_pending';
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
      } else if (response.status === 'pg_pending' || response.payment_status === 'pg_pending') {
        status = 'pg_pending';
      } else {
        status = 'failed';
      }
    }

    console.log('Final processed status:', status);
    console.log('Is success:', isSuccess);
    console.log('Extracted txnRef:', extractedTxnRef);
    console.log('Extracted amount:', extractedAmount);

    setIsPaymentProcessed(true);
    setIsProcessingPayment(false);
    
    // Navigate to payment response screen
    navigation.navigate('PaymentResponse', {
      txnRef: extractedTxnRef,
      source: source,
      pgInfo: pgInfo,
      amount: extractedAmount,
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
    
    // Remove automatic payment status checking to prevent premature status checks
    // Only check status when there's actual indication of payment completion
    
    // If we're on the response.php page, try to extract response data from the page content
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          try {
            // Check if there's any JSON data in the page
            const scripts = document.querySelectorAll('script');
            for (let script of scripts) {
              if (script.textContent && (script.textContent.includes('"program":"Admin Payment Response"') || script.textContent.includes('"program":"Get Transaction Detail"'))) {
                console.log('Found EASEBUZZ response in script tag');
                window.ReactNativeWebView.postMessage(script.textContent);
                return;
              }
            }
            
            // Check if there's any JSON in the page body
            const bodyText = document.body.innerText;
            if (bodyText && (bodyText.includes('"program":"Admin Payment Response"') || bodyText.includes('"program":"Get Transaction Detail"'))) {
              console.log('Found EASEBUZZ response in body text');
              // Try to extract JSON from the body text
              const jsonMatch = bodyText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
              if (jsonMatch) {
                window.ReactNativeWebView.postMessage(jsonMatch[0]);
                return;
              }
            }
            
            // Check if there's any pre tag with JSON
            const preTags = document.querySelectorAll('pre');
            for (let pre of preTags) {
              if (pre.textContent && (pre.textContent.includes('"program":"Admin Payment Response"') || pre.textContent.includes('"program":"Get Transaction Detail"'))) {
                console.log('Found EASEBUZZ response in pre tag');
                window.ReactNativeWebView.postMessage(pre.textContent);
                return;
              }
            }
            
            console.log('No EASEBUZZ response found in page content');
          } catch (e) {
            console.log('Error extracting response data:', e);
          }
        })();
      `);
    }
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
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={false}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
          // Enhanced settings for EASEBUZZ compatibility
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsProtectedMedia={true}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
            console.log('WebView message type:', typeof event.nativeEvent.data);
            
            // Handle any messages from the payment gateway
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('Parsed WebView message data:', data);
              
              // Check for EASEBUZZ specific response format
              if (data.program === 'Admin Payment Response' || data.program === 'Get Transaction Detail') {
                console.log('EASEBUZZ response detected in WebView message:', data);
                if (!isPaymentProcessed) {
                  paymentResponse(data);
                }
                return;
              }
              
              // Check for Atom cancellation messages
              if (data.status === 'cancelled' && (data.source === 'page_content' || data.source === 'error_message')) {
                console.log('Atom cancellation detected in WebView message:', data);
                if (!isPaymentProcessed) {
                  paymentResponse('fail');
                }
                return;
              }
              
              if (data.status || data.payment_status || (data.data && data.data.txn_status)) {
                console.log('Payment status message received:', data);
                if (!isPaymentProcessed) {
                  paymentResponse(data);
                }
              }
            } catch (e) {
              console.log('WebView message is not JSON:', e);
              // Check if it's a direct navigation command
              if (event.nativeEvent.data.includes('navigate') || event.nativeEvent.data.includes('PaymentResponse')) {
                console.log('Direct navigation command detected in WebView message');
              }
              
              // Check if it's an EASEBUZZ response that might be malformed
              if (event.nativeEvent.data.includes('"program":"Admin Payment Response"') || 
                  event.nativeEvent.data.includes('"program":"Get Transaction Detail"')) {
                console.log('EASEBUZZ response detected in raw message data');
                try {
                  const easebuzzData = JSON.parse(event.nativeEvent.data);
                  if (!isPaymentProcessed) {
                    paymentResponse(easebuzzData);
                  }
                } catch (parseError) {
                  console.log('Failed to parse EASEBUZZ response from raw data:', parseError);
                }
              }
            }
          }}
          // Additional headers for better compatibility
          onShouldStartLoadWithRequest={(request) => {
            console.log('WebView should start load:', request.url);
            
            // Allow third-party payment apps to open
            if (request.url.startsWith('googlepay://') ||
                request.url.startsWith('tez://') ||
                request.url.startsWith('gpay://') ||
                request.url.startsWith('phonepe://') ||
                request.url.startsWith('phonepepay://') ||
                request.url.startsWith('cred://') ||
                request.url.startsWith('credpay://') ||
                request.url.startsWith('paytm://') ||
                request.url.startsWith('paytmmoney://') ||
                request.url.startsWith('paytmmp://') ||
                request.url.startsWith('paytmwallet://') ||
                request.url.startsWith('paytmbank://') ||
                request.url.startsWith('amazonpay://') ||
                request.url.startsWith('amazonpaylite://') ||
                request.url.startsWith('bhim://') ||
                request.url.startsWith('bhimupi://') ||
                request.url.startsWith('upi://') ||
                request.url.startsWith('mobikwik://') ||
                request.url.startsWith('freecharge://') ||
                request.url.startsWith('airtelpay://') ||
                request.url.startsWith('airtel://') ||
                request.url.startsWith('jio://') ||
                request.url.startsWith('jiopay://') ||
                request.url.startsWith('jiomoney://') ||
                request.url.startsWith('intent://') ||
                request.url.startsWith('market://') ||
                request.url.includes('play.google.com/store/apps') ||
                request.url.includes('apps.apple.com/app/')) {
              console.log('Third-party payment app detected:', request.url);
              console.log('Allowing external app to open...');
              return false; // Prevent WebView from loading, allow external app to open
            }
            
            // Handle deep links and universal links for payment apps
            if (request.url.includes('googlepay') ||
                request.url.includes('tez') ||
                request.url.includes('gpay') ||
                request.url.includes('phonepe') ||
                request.url.includes('cred') ||
                request.url.includes('paytm') ||
                request.url.includes('amazonpay') ||
                request.url.includes('bhim') ||
                request.url.includes('upi') ||
                request.url.includes('mobikwik') ||
                request.url.includes('freecharge') ||
                request.url.includes('airtel') ||
                request.url.includes('jio') ||
                request.url.includes('razorpay') ||
                request.url.includes('stripe') ||
                request.url.includes('square') ||
                request.url.includes('paypal')) {
              console.log('Payment app deep link detected:', request.url);
              console.log('Allowing external payment app to open...');
              return false; // Prevent WebView from loading, allow external app to open
            }
            
            // Check for cancelled transactions first
            if (request.url.includes('cancel') || 
                request.url.includes('failure') ||
                request.url.includes('cancelled') ||
                request.url.includes('abort') ||
                request.url.includes('decline') ||
                request.url.includes('reject') ||
                // Atom payment gateway specific cancellation patterns
                request.url.includes('atomtech.in/cancel') ||
                request.url.includes('atomtech.in/failure') ||
                request.url.includes('atomtech.in/decline')) {
              console.log('Cancelled transaction URL detected:', request.url);
              if (!isPaymentProcessed) {
                paymentResponse('fail');
              }
              return false; // Prevent WebView from loading cancelled transaction URL
            }
            
            // Check for cancelled transaction in URL parameters
            try {
              const url = new URL(request.url);
              const status = url.searchParams.get('status') || url.searchParams.get('payment_status') || url.searchParams.get('txn_status');
              if (status && (status.toLowerCase() === 'cancelled' || status.toLowerCase() === 'canceled' || status.toLowerCase() === 'failed' || status.toLowerCase() === 'failure')) {
                console.log('Cancelled transaction detected in URL parameters:', status);
                if (!isPaymentProcessed) {
                  paymentResponse('fail');
                }
                return false; // Prevent WebView from loading cancelled transaction URL
              }
            } catch (e) {
              console.log('Failed to parse URL for cancellation check:', e);
            }
            
            // Check for specific payment response URLs only
            if (request.url.startsWith('paymentresponse://') || 
                request.url.startsWith('isp://paymentresponse') ||
                // Only check for specific response endpoints, not any URL containing "response"
                request.url.includes('/tp/pg/response.php') ||
                request.url.includes('pay.easebuzz.in/response/') ||
                request.url.includes('pay.easebuzz.in/webservice/')) {
              console.log('Payment response URL detected:', request.url);
              
              // Try to extract JSON from URL parameters
              try {
                const url = new URL(request.url);
                const jsonParam = url.searchParams.get('data') || url.searchParams.get('response') || url.searchParams.get('json') || url.searchParams.get('result');
                if (jsonParam) {
                  const parsedData = JSON.parse(decodeURIComponent(jsonParam));
                  console.log('JSON data found in URL:', parsedData);
                  if (!isPaymentProcessed) {
                    paymentResponse(parsedData);
                  }
                  return false; // Prevent WebView from loading this URL
                }
              } catch (e) {
                console.log('Failed to parse JSON from URL:', e);
              }
              
              // Check if the URL itself contains JSON data
              if (request.url.includes('"program":"Admin Payment Response"') || request.url.includes('"program":"Get Transaction Detail"')) {
                console.log('EASEBUZZ Payment Response JSON found in URL');
                try {
                  const jsonStart = request.url.indexOf('{');
                  const jsonEnd = request.url.lastIndexOf('}') + 1;
                  const jsonString = request.url.substring(jsonStart, jsonEnd);
                  const parsedData = JSON.parse(jsonString);
                  console.log('EASEBUZZ JSON extracted from URL:', parsedData);
                  if (!isPaymentProcessed) {
                    paymentResponse(parsedData);
                  }
                  return false;
                } catch (e) {
                  console.log('Failed to extract EASEBUZZ JSON from URL:', e);
                }
              }
            }
            
            // Allow all other requests (including OTP pages, payment forms, etc.)
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