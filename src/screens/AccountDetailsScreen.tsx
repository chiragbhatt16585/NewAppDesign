import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import CommonHeader from '../components/CommonHeader';
import {navigateToLogin} from '../utils/navigationUtils';
import { getSafeDaysRemaining } from '../utils/usageUtils';

const AccountDetailsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [authData, setAuthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const primaryUsageDetail = authData?.usage_details?.[0];
  const usageDaysRemainingText = getSafeDaysRemaining(primaryUsageDetail);

  // Fetch account data on component mount
  useEffect(() => {
    checkSessionAndLoadData();
  }, []);

  const checkSessionAndLoadData = async () => {
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) {
        // console.log('=== ACCOUNT DETAILS SCREEN: No user session found, redirecting to Login ===');
        Alert.alert(
          'Authentication Required',
          'Please login to view your account details.',
          [
            {
              text: 'OK',
              onPress: () => navigateToLogin(navigation)
            }
          ]
        );
        return;
      }
      
      // If session exists, load account data
      fetchAccountData();
    } catch (error) {
      console.error('=== ACCOUNT DETAILS SCREEN: Session check error ===', error);
      Alert.alert(
        'Authentication Error',
        'Please login again to continue.',
        [
          {
            text: 'OK',
            onPress: () => navigateToLogin(navigation)
          }
        ]
      );
    }
  };

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      
      // First, diagnose session issues
      // console.log('=== DIAGNOSING SESSION BEFORE API CALL ===');
      const sessionDiagnosis = await sessionManager.diagnoseAndFixSession();
      
      if (sessionDiagnosis.needsReset) {
        // console.log('Session issues detected:', sessionDiagnosis.issues);
        // console.log('Resetting session and redirecting to login...');
        
        // Reset the session
        await sessionManager.resetSession();
        
        // Show alert to user
        Alert.alert(
          'Session Issue Detected',
          'Your session has expired or is corrupted. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to login screen
                navigation.navigate('Login');
              }
            }
          ]
        );
        
        setIsLoading(false);
        return;
      }
      
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        // console.log('No valid session found after diagnosis');
        setIsLoading(false);
        return;
      }

      const { username } = session;
      // console.log('Using session with username:', username);
      
      // Use the enhanced API service with automatic token regeneration
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      
      if (authResponse) {
        // console.log('=== ACCOUNT DETAILS API RESPONSE ===');
        // console.log('Full Response:', JSON.stringify(authResponse, null, 2));
        // console.log('Response Type:', typeof authResponse);
        // console.log('Is Array:', Array.isArray(authResponse));
        // console.log('Keys:', authResponse ? Object.keys(authResponse) : 'No response');
        
        // Check for static IP data specifically
        // console.log('authData._obj:', authResponse._obj);
        // console.log('authData._obj?.static_ip_details:', authResponse._obj?.static_ip_details);
        
        setAuthData(authResponse);
      }
    } catch (error: any) {
      console.error('Error fetching account data:', error);
      
      // Check if it's an authentication error
      if (error.message && (
        error.message.includes('invalid username or password') ||
        error.message.includes('Authentication required') ||
        error.message.includes('Authentication failed')
      )) {
        // console.log('Authentication error detected, resetting session...');
        
        // Reset session and redirect to login
        await sessionManager.resetSession();
        
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch account data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Opening profile editor...');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Opening password change form...');
  };

  const handleResetSession = async () => {
    try {
      // console.log('=== MANUAL SESSION RESET ===');
      await sessionManager.resetSession();
      
      Alert.alert(
        'Session Reset',
        'Session has been reset. Please login again.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error resetting session:', error);
      Alert.alert('Error', 'Failed to reset session');
    }
  };

  const handleDebugSession = async () => {
    try {
      // console.log('=== DEBUGGING SESSION ===');
      const diagnosis = await sessionManager.diagnoseAndFixSession();
      
      Alert.alert(
        'Session Debug Info',
        `Session Issues: ${diagnosis.issues.join(', ') || 'None'}\n\nNeeds Reset: ${diagnosis.needsReset ? 'Yes' : 'No'}`,
        [
          {
            text: 'Reset Session',
            onPress: handleResetSession
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error debugging session:', error);
      Alert.alert('Error', 'Failed to debug session');
    }
  };

  const renderDetailCard = (title: string, details: any) => (
    <View style={[styles.detailCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.cardTitle, {color: colors.primary || '#FF6B35'}]}>{title}</Text>
      {Object.entries(details).map(([key, value]) => (
        <View key={key} style={styles.detailRow}>
          <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>
            {key}
          </Text>
          <Text style={[styles.detailValue, {color: colors.text}]}>{value as string}</Text>
        </View>
      ))}
    </View>
  );

  const renderDetailCardWithIcons = (title: string, details: any) => (
    <View style={[styles.detailCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.cardTitle, {color: colors.text}]}>{title}</Text>
      {Object.entries(details).map(([key, value]) => (
        <View key={key} style={styles.detailRowWithIcon}>
          <View style={styles.detailIconContainer}>
            <Text style={styles.detailIcon}>{getIconForKey(key)}</Text>
          </View>
          <Text style={[styles.detailValue, {color: colors.text}]}>{value as string}</Text>
        </View>
      ))}
    </View>
  );

  const getIconForKey = (key: string) => {
    switch (key.toLowerCase()) {
      case 'name':
        return '👨‍💻';
      case 'email':
        return '✉️';
      case 'mobile':
        return '📲';
      case 'phone':
        return '☎️';
      default:
        return '';
    }
  };

  const formatMobileNumber = (number: string) => {
    if (!number || number === 'N/A') return 'N/A';
    
    // Remove any existing country code and spaces
    let cleanNumber = number.replace(/^\+91\s*/, '').replace(/\s+/g, '');
    
    // If number doesn't start with +91, add it
    if (!number.startsWith('+91')) {
      cleanNumber = '91' + cleanNumber;
    }
    
    // Format as US style: +91 XXX-XXX-XXXX
    if (cleanNumber.length === 12) { // 91 + 10 digits
      const countryCode = cleanNumber.substring(0, 2);
      const areaCode = cleanNumber.substring(2, 5);
      const prefix = cleanNumber.substring(5, 8);
      const lineNumber = cleanNumber.substring(8, 12);
      return `+${countryCode} ${areaCode}-${prefix}-${lineNumber}`;
    }
    
    // If not exactly 12 digits, return as is with +91
    return `+91 ${cleanNumber}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: colors.text}]}>Loading account details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <CommonHeader navigation={navigation} />

        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, {color: colors.text}]}>Account Details</Text>
          <Text style={[styles.pageSubtitle, {color: colors.textSecondary}]}>
            Complete account information
          </Text>
        </View>

        {/* Personal Information */}
        <View style={[styles.detailCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.cardTitle, {color: colors.primary || '#FF6B35'}]}>Personal Information</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Username</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{authData?.username || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Registered Since</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{authData?.reg_date || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Contact Number</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{formatMobileNumber(authData?.primary_mobile)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Email Address</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{authData?.primary_email || 'N/A'}</Text>
          </View>
          <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Address</Text>
            <Text style={[styles.detailValue, {color: colors.text, textAlign: 'right', flex: 1}]}>
              {authData?.flat_no && `${authData.flat_no}, `}
              {authData?.address1 || ''}
              {authData?.address2 && `, ${authData.address2}`}
              {authData?.area_name && `, ${authData.area_name}`}
              {authData?.city_name && `, ${authData.city_name}`}
              {authData?.pincode && `-${authData.pincode}`}
              {authData?.state && `, ${authData.state}`}
              {authData?.country && `, ${authData.country}`}
              {(!authData?.flat_no && !authData?.address1 && !authData?.address2 && !authData?.area_name && !authData?.city_name && !authData?.pincode && !authData?.state && !authData?.country) && 'N/A'}
            </Text>
          </View>
        </View>

        {/* Plan Information */}
        <View style={[styles.detailCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.cardTitle, {color: colors.primary || '#FF6B35'}]}>Plan Information</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Current Plan</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{authData?.current_plan || 'N/A'}</Text>
          </View>
          <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Expiry Date</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{authData?.exp_date || 'N/A'}</Text>
          </View>
        </View>

        {/* Account Status Card */}
        <View style={[styles.statusCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusTitle, {color: colors.primary || '#FF6B35'}]}>Account Status</Text>
            <View style={[styles.statusBadge, {backgroundColor: authData?.user_status === 'active' ? '#4CAF50' : '#F44336'}]}>
              <Text style={styles.statusText}>
                {(authData?.user_status || 'Unknown').charAt(0).toUpperCase() + (authData?.user_status || 'Unknown').slice(1).toLowerCase().replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>Login Status</Text>
              <Text style={[styles.statusValue, {color: authData?.login_status === 'IN' ? '#4CAF50' : '#F44336'}]}>
                {authData?.login_status === 'IN' ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={[styles.statusRow, {borderBottomWidth: 0}]}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>Last Login</Text>
              <Text style={[styles.statusValue, {color: colors.text}]}>{authData?.user_last_login || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Usage Information */}
        {primaryUsageDetail && (
          <View style={[styles.detailCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <Text style={[styles.cardTitle, {color: colors.primary || '#FF6B35'}]}>Usage Information</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Plan Data</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>{primaryUsageDetail.plan_data || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Data Used</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>
                {`${(parseFloat(primaryUsageDetail.data_used) / (1024 * 1024 * 1024)).toFixed(2)} GB`}
              </Text>
            </View>
            <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
              <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Plan Validity</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>
                {primaryUsageDetail.plan_days ? `${primaryUsageDetail.plan_days} Days` : 'N/A'}
              </Text>
            </View>
          </View>
        )}

       

        {/* Billing Information
        {renderDetailCard('Billing Information', {
          'Payment Dues': `₹${authData?.payment_dues || 0}`,
          'Bill Frequency': authData?.bill_frequency || 'N/A',
          'Payment Method': authData?.nc_payment_method || 'N/A',
          'User Plan Type': authData?.user_plan_type || 'N/A',
          'Postpaid Rental Type': authData?.postpaid_rental_type || 'N/A',
        })} */}

        {/* Network Information */}
        {/* {renderDetailCard('Network Information', {
          'IP Address': authData?.ip_addr || 'N/A',
          'User NAS IP': authData?.user_nas_ip || 'N/A',
          'CPE MAC Address': authData?.cpe_mac_address || 'N/A',
          'Site Name': authData?.site_name || 'N/A',
          'Zone Name': authData?.zone_name || 'N/A',
          'VLAN': authData?.vlan || 'N/A',
        })} */}

        

       

        {/* Static IP Details */}
        {authData && authData.static_ip_details && authData.static_ip_details.length > 0 && 
          renderDetailCard('Static IP Details', 
            authData.static_ip_details.reduce((acc: any, staticIP: any, index: number) => {
              const prefix = authData.static_ip_details.length > 1 ? `IP ${index + 1} - ` : '';
              return {
                ...acc,
                [`${prefix}IP Address`]: staticIP.ip_address || 'N/A',
                [`${prefix}Renew Date`]: staticIP.renew_date || 'N/A',
                [`${prefix}Expiry Date`]: staticIP.exp_date || 'N/A',
                //[`${prefix}User IP Charge`]: `₹${staticIP.user_ip_charge || 'N/A'}`,
                //[`${prefix}Status`]: staticIP.status || 'N/A',
              };
            }, {})
          )
        }

        {/* Technical Information */}
        {/* {renderDetailCard('Technical Information', {
          'Current PIN Serial': authData?.current_pin_serial || 'N/A',
          'Previous PIN Serial': authData?.prev_pin_serial || 'N/A',
          'CPE Serial No': authData?.cpe_serial_no || 'N/A',
          'CPE Product Class': authData?.cpe_product_class || 'N/A',
          'CPE OUI': authData?.cpe_oui || 'N/A',
          'KYC Status': authData?.kyc_status || 'N/A',
          'Bind MAC': authData?.bind_mac || 'N/A',
        })} */}

        {/* Action Buttons */}
        {/* <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: colors.primary}]} onPress={handleDebugSession}>
            <Text style={styles.actionButtonText}>Debug Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#EF4444'}]} onPress={handleResetSession}>
            <Text style={styles.actionButtonText}>Reset Session</Text>
          </TouchableOpacity>
        </View> */}

        {/* Additional Info */}
        {/* <View style={[styles.infoCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.infoTitle, {color: colors.text}]}>{t('accountDetails.needHelp')}</Text>
          <Text style={[styles.infoText, {color: colors.textSecondary}]}>
            {t('accountDetails.helpText')}
          </Text>
          <TouchableOpacity style={[styles.supportButton, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.supportButtonText, {color: colors.primary}]}>{t('accountDetails.contactSupport')}</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusDetails: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailRowWithIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    paddingLeft: 8,
  },
  detailIcon: {
    fontSize: 20,
  },
  detailLabel: {
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  supportButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Static IP Styles
  staticIpCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  staticIpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  staticIpItem: {
    marginBottom: 16,
  },
  staticIpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  staticIpIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staticIpIcon: {
    fontSize: 16,
  },
  staticIpLabelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  staticIpLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  staticIpValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
});

export default AccountDetailsScreen; 