import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {useTranslation} from 'react-i18next';

const AccountDetailsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();

  // Mock account details data - replace with actual API data
  const accountDetails = {
    customerId: 'ISP123456789',
    loginStatus: 'Active',
    expiryDate: '25th July 2024',
    renewDate: '20th July 2024',
    creationDate: '15th January 2024',
    lastLogin: 'Today, 10:30 AM',
    accountStatus: 'Active',
    billingCycle: 'Monthly',
    paymentMethod: 'Auto-Debit',
    email: 'chirag.bhatt@example.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, Goa, India',
    planDetails: {
      name: 'Premium Fiber 100 Mbps',
      speed: '100 Mbps',
      dataLimit: '100 GB',
      price: '₹999/month',
    },
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
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </Text>
          <Text style={[styles.detailValue, {color: colors.text}]}>{value as string}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
          <TouchableOpacity style={[styles.backButton, {backgroundColor: colors.borderLight}]} onPress={handleBack}>
            <Text style={[styles.backButtonText, {color: colors.text}]}>‹</Text>
          </TouchableOpacity>
          <LogoImage width={80} height={32} style={styles.logo} />
          <TouchableOpacity style={[styles.editButton, {backgroundColor: colors.primary}]} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>{t('accountDetails.edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, {color: colors.text}]}>{t('accountDetails.title')}</Text>
          <Text style={[styles.pageSubtitle, {color: colors.textSecondary}]}>{t('accountDetails.subtitle')}</Text>
        </View>

        {/* Account Status Card */}
        <View style={[styles.statusCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusTitle, {color: colors.text}]}>{t('accountDetails.accountStatus')}</Text>
            <View style={[styles.statusBadge, {backgroundColor: colors.success}]}>
              <Text style={styles.statusText}>{accountDetails.accountStatus}</Text>
            </View>
          </View>
          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>{t('accountDetails.loginStatus')}</Text>
              <Text style={[styles.statusValue, {color: colors.text}]}>{accountDetails.loginStatus}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>{t('accountDetails.lastLogin')}</Text>
              <Text style={[styles.statusValue, {color: colors.text}]}>{accountDetails.lastLogin}</Text>
            </View>
          </View>
        </View>

        {/* Account Information */}
        {renderDetailCard(t('accountDetails.accountInformation'), {
          [t('accountDetails.customerId')]: accountDetails.customerId,
          [t('accountDetails.creationDate')]: accountDetails.creationDate,
          [t('accountDetails.billingCycle')]: accountDetails.billingCycle,
          [t('accountDetails.paymentMethod')]: accountDetails.paymentMethod,
        })}

        {/* Plan Information */}
        {renderDetailCard(t('accountDetails.planInformation'), {
          [t('accountDetails.planName')]: accountDetails.planDetails.name,
          [t('accountDetails.speed')]: accountDetails.planDetails.speed,
          [t('accountDetails.dataLimit')]: accountDetails.planDetails.dataLimit,
          [t('accountDetails.price')]: accountDetails.planDetails.price,
        })}

        {/* Important Dates */}
        {renderDetailCard(t('accountDetails.importantDates'), {
          [t('accountDetails.expiryDate')]: accountDetails.expiryDate,
          [t('accountDetails.renewDate')]: accountDetails.renewDate,
        })}

        {/* Contact Information */}
        {renderDetailCard(t('accountDetails.contactInformation'), {
          [t('accountDetails.email')]: accountDetails.email,
          [t('accountDetails.phone')]: accountDetails.phone,
          [t('accountDetails.address')]: accountDetails.address,
        })}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: colors.primary}]} onPress={handleChangePassword}>
            <Text style={styles.actionButtonText}>{t('accountDetails.changePassword')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: colors.primary}]} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>{t('accountDetails.updateProfile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={[styles.infoCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.infoTitle, {color: colors.text}]}>{t('accountDetails.needHelp')}</Text>
          <Text style={[styles.infoText, {color: colors.textSecondary}]}>
            {t('accountDetails.helpText')}
          </Text>
          <TouchableOpacity style={[styles.supportButton, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.supportButtonText, {color: colors.primary}]}>{t('accountDetails.contactSupport')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
  },
  logo: {
    flex: 1,
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
});

export default AccountDetailsScreen; 