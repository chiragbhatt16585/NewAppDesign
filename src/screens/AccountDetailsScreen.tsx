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

const AccountDetailsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [authData, setAuthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch account data on component mount
  useEffect(() => {
    checkSessionAndLoadData();
  }, []);

  const checkSessionAndLoadData = async () => {
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) {
        console.log('=== ACCOUNT DETAILS SCREEN: No user session found, redirecting to Login ===');
        Alert.alert(
          'Authentication Required',
          'Please login to view your account details.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
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
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    }
  };

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { username, token } = session;
      const authResponse = await apiService.authUser(username, token);
      
      if (authResponse) {
        // console.log('=== ACCOUNT DETAILS API RESPONSE ===');
        // console.log('Full Response:', JSON.stringify(authResponse, null, 2));
        // console.log('Response Type:', typeof authResponse);
        // console.log('Is Array:', Array.isArray(authResponse));
        // console.log('Keys:', authResponse ? Object.keys(authResponse) : 'No response');
        
        // // Check for static IP data specifically
        // console.log('authData._obj:', authResponse._obj);
        // console.log('authData._obj?.static_ip_details:', authResponse._obj?.static_ip_details);
        
        setAuthData(authResponse);
      }
    } catch (error: any) {
      console.error('Error fetching account data:', error);
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

  const renderDetailCard = (title: string, details: any) => (
    <View style={[styles.detailCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.cardTitle, {color: colors.text}]}>{title}</Text>
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
          <Text style={[styles.pageTitle, {color: colors.text}]}>{t('accountDetails.title')}</Text>
          <Text style={[styles.pageSubtitle, {color: colors.textSecondary}]}>
            {authData ? `${authData.first_name} ${authData.last_name}` : 'Account Details'}
          </Text>
        </View>

        {/* Account Status Card */}
        <View style={[styles.statusCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusTitle, {color: colors.text}]}>Account Status</Text>
            <View style={[styles.statusBadge, {backgroundColor: authData?.user_status === 'active' ? colors.success : '#F44336'}]}>
              <Text style={styles.statusText}>{authData?.user_status || 'Unknown'}</Text>
            </View>
          </View>
          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>Login Status</Text>
              <Text style={[styles.statusValue, {color: authData?.login_status === 'IN' ? '#4CAF50' : '#F44336'}]}>
                {authData?.login_status === 'IN' ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>Last Login</Text>
              <Text style={[styles.statusValue, {color: colors.text}]}>{authData?.user_last_login || 'N/A'}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>Last Logout</Text>
              <Text style={[styles.statusValue, {color: colors.text}]}>{authData?.user_last_logout || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        {renderDetailCard('Personal Information', {
          'Full Name': authData?.full_name || 'N/A',
          // 'First Name': authData?.first_name || 'N/A',
          // 'Middle Name': authData?.middle_name || 'N/A',
          // 'Last Name': authData?.last_name || 'N/A',
          // 'Gender': authData?.user_gender || 'N/A',
          // 'Birth Date': authData?.birth_date || 'N/A',
          // 'Marital Status': authData?.marital_status || 'N/A',
        })}

        {/* Contact Information */}
        {renderDetailCard('Contact Information', {
          'Primary Email': authData?.primary_email || 'N/A',
          'Primary Mobile': authData?.primary_mobile || 'N/A',
          // 'Landline Phone': authData?.landline_phone || 'N/A',
          // 'Alt Email': authData?.alt_email || 'N/A',
          // 'Alt Mobile': authData?.alt_mobile || 'N/A',
        })}

        {/* Account Information */}
        {renderDetailCard('Account Information', {
          'Account Number': authData?.account_no || 'N/A',
          'Customer ID': authData?.id || 'N/A',
          'Username': authData?.username || 'N/A',
          //'Referral Code': authData?.referral_code || 'N/A',
          'Registration Date': authData?.reg_date || 'N/A',
          'Activation Date': authData?.activation_date || 'N/A',
          //'Renewal Count': authData?.renewal_count || '0',
          //'User Category': authData?.user_category || 'N/A',
          //'User Profile': authData?.user_profile || 'N/A',
        })}

        {/* Plan Information */}
        {renderDetailCard('Plan Information', {
          'Current Plan': authData?.current_plan || 'N/A',
          'Download Speed': `${authData?.plan_download_speed || 0} Mbps`,
          'Upload Speed': `${authData?.plan_upload_speed || 0} Mbps`,
          //'Connection Type': authData?.connection_type || 'N/A',
          //'User Auth Type': authData?.user_auth_type || 'N/A',
          // 'FUP Flag': authData?.fup_flag || 'N/A',
          // 'TBQ Flag': authData?.tbq_flag || 'N/A',
          // 'Auto Renewal': authData?.auto_renewal || 'N/A',
        })}

        {/* Usage Information */}
        {authData?.usage_details?.[0] && renderDetailCard('Usage Information', {
          'Plan Data': authData.usage_details[0].plan_data || 'N/A',
          'Data Used': `${(parseFloat(authData.usage_details[0].data_used) / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          'Plan Hours': authData.usage_details[0].plan_hours || 'N/A',
          'Hours Used': authData.usage_details[0].hours_used || 'N/A',
          'Plan Days': authData.usage_details[0].plan_days || 'N/A',
          'Days Used': authData.usage_details[0].days_used || 'N/A',
          'Days Remaining': `${parseInt(authData.usage_details[0].plan_days) - parseInt(authData.usage_details[0].days_used)} days`,
        })}

        {/* Important Dates */}
        {renderDetailCard('Important Dates', {
          'Renew Date': authData?.renew_date || 'N/A',
          'Expiry Date': authData?.exp_date || 'N/A',
          'Next Renewal': authData?.next_renewal_date || 'N/A',
          // 'Entry Date': authData?.entry_date || 'N/A',
          // 'Last Update': authData?.last_update || 'N/A',
        })}

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

        

        {/* Address Information */}
        {renderDetailCard('Address Information', {
          'Address Line 1': authData?.address1 || 'N/A',
          'Address Line 2': authData?.address2 || 'N/A',
          'Pincode': authData?.pincode || 'N/A',
          'City': authData?.city_name || 'N/A',
          'State': authData?.state || 'N/A',
          'Country': authData?.country || 'N/A',
          'Area': authData?.area_name || 'N/A',
          'Location': authData?.location_name || 'N/A',
          'Building': authData?.building_name || 'N/A',
        })}

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
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: colors.primary}]} onPress={handleChangePassword}>
            <Text style={styles.actionButtonText}>{t('accountDetails.changePassword')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: colors.primary}]} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>{t('accountDetails.updateProfile')}</Text>
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
    paddingVertical: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusDetails: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
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
});

export default AccountDetailsScreen; 