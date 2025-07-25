import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { getClientConfig } from '../config/client-config';
import sessionManager from '../services/sessionManager';
import CommonHeader from '../components/CommonHeader';

const PaymentResponseScreen = ({ route, navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const { txnRef, source, pgInfo, amount, status } = route.params || {};
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  console.log('=== PAYMENT RESPONSE SCREEN DEBUG ===');
  console.log('Route params:', route.params);
  console.log('Status from params:', status);
  console.log('TxnRef:', txnRef);
  console.log('PgInfo:', pgInfo);
  console.log('Amount:', amount);

  // Use the status from route params, default to 'success' only if not provided
  const paymentStatus = status || 'success';
  console.log('Final payment status:', paymentStatus);

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
    cancelled: {
      icon: 'close-circle',
      color: colors.warning || '#FFC107',
      title: t('paymentResponse.cancelledTitle') || 'Payment Cancelled',
      message: t('paymentResponse.cancelledMessage') || 'Your payment was cancelled.',
      emoji: '⚠️'
    }
  };
  
  const info = statusInfo[paymentStatus] || statusInfo.success;
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
      
      console.log('Checking payment status for txnRef:', txnRef, 'username:', username);
      const paymentStatus = await apiService.getPaymentStatus(username, txnRef, realm);
      
      console.log('Payment status result:', paymentStatus);
      
      if (paymentStatus === 'success' || paymentStatus === 'S') {
        Alert.alert(
          'Payment Status Updated', 
          'Great! Your payment was successful. Your plan has been activated.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Home') }
          ]
        );
      } else if (paymentStatus === 'failed' || paymentStatus === 'F') {
        Alert.alert(
          'Payment Status', 
          'Payment is still pending or failed. Please try again later.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Payment Status', 
          `Current status: ${paymentStatus}. Please contact support if you have any questions.`,
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

  const isFailedPayment = paymentStatus === 'failure' || paymentStatus === 'failed';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {/* Modern icon with background circle */}
          <View style={[styles.iconBackground, { backgroundColor: info.color + '20' }]}>
            <Icon 
              name={info.icon} 
              size={80} 
              color={info.color}
            />
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{info.title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{info.message}</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Gateway</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{pgInfo || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Txn Ref</Text>
            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{txnRef || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount</Text>
            <Text style={[styles.detailValue, { color: colors.text, fontWeight: 'bold' }]}>₹{amount || '-'}</Text>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
});

export default PaymentResponseScreen; 