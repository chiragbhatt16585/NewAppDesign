import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {getClientConfig} from '../config/client-config';
import {
  CustomerConsentData,
  fetchCustomerConsentData,
  getTranslationFallbacks,
} from '../utils/customerConsentData';

const CONSENT_LANGUAGES = [
  {code: 'en', label: 'English'},
  {code: 'hi', label: 'हिंदी'},
  {code: 'mr', label: 'मराठी'},
] as const;

interface DetailFieldProps {
  label: string;
  value: string;
  fullWidth?: boolean;
  multiline?: boolean;
  colors: ReturnType<typeof getThemeColors>;
}

const DetailField = ({
  label,
  value,
  fullWidth = true,
  multiline = false,
  colors,
}: DetailFieldProps) => (
  <View style={[styles.fieldContainer, !fullWidth && styles.fieldHalf]}>
    <Text style={[styles.fieldLabel, {color: colors.textSecondary}]}>{label}</Text>
    <View style={[styles.fieldBox, {backgroundColor: colors.card, borderColor: colors.borderLight}]}>
      <Text
        style={[styles.fieldValue, {color: colors.text}]}
        numberOfLines={multiline ? undefined : 2}>
        {value}
      </Text>
    </View>
  </View>
);

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colors: ReturnType<typeof getThemeColors>;
}

const ConsentCheckbox = ({checked, onToggle, children, colors}: ConsentCheckboxProps) => (
  <TouchableOpacity
    style={styles.checkboxRow}
    onPress={onToggle}
    activeOpacity={0.7}
    accessibilityRole="checkbox"
    accessibilityState={{checked}}>
    <View
      style={[
        styles.checkbox,
        {
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : colors.card,
        },
      ]}>
      {checked && <Feather name="check" size={14} color="#FFFFFF" />}
    </View>
    <Text style={[styles.checkboxText, {color: colors.textSecondary}]}>{children}</Text>
  </TouchableOpacity>
);

const CustomerConsentScreen = ({navigation, route}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t, i18n} = useTranslation();
  const clientConfig = getClientConfig();
  const primaryColor = clientConfig.branding?.primaryColor || colors.primary;

  const [customerData, setCustomerData] = useState<CustomerConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const hasFullConsent2 = i18n.exists('customerConsent.consent2');

  const loadCustomerData = useCallback(async () => {
    if (route?.params?.customerData) {
      setCustomerData(route.params.customerData);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchCustomerConsentData(t);
      setCustomerData(data);
    } catch (error: any) {
      setLoadError(error?.message || t('customerConsent.loadError'));
      setCustomerData(getTranslationFallbacks(t));
    } finally {
      setIsLoading(false);
    }
  }, [route?.params?.customerData, t]);

  useFocusEffect(
    useCallback(() => {
      loadCustomerData();
    }, [loadCustomerData]),
  );

  const [selectedLanguage, setSelectedLanguage] = useState(
    CONSENT_LANGUAGES.some(l => l.code === i18n.language)
      ? i18n.language
      : 'en',
  );
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);

  const allConsentsAccepted = consent1 && consent2 && consent3;

  const handleLanguageChange = useCallback(
    async (languageCode: string) => {
      setSelectedLanguage(languageCode);
      await i18n.changeLanguage(languageCode);
    },
    [i18n],
  );

  const handleProceed = () => {
    if (!allConsentsAccepted) {
      Alert.alert(t('common.error'), t('customerConsent.acceptAllConsents'));
      return;
    }
    navigation.navigate('SlotBooking', {
      customerData: route?.params?.customerData ?? customerData,
    });
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: '#F5F5F5'}]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.borderLight}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <LogoImage type="header" width={160} height={48} />
        </View>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
            {t('customerConsent.loading')}
          </Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loadError && (
          <View style={[styles.errorBanner, {backgroundColor: colors.accentLight, borderColor: colors.accent}]}>
            <Text style={[styles.errorBannerText, {color: colors.text}]}>{loadError}</Text>
            <TouchableOpacity onPress={loadCustomerData} style={[styles.retryButton, {borderColor: primaryColor}]}>
              <Text style={[styles.retryButtonText, {color: primaryColor}]}>{t('customerConsent.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Language selector */}
        <View style={styles.languageRow}>
          {CONSENT_LANGUAGES.map(lang => {
            const isActive = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageChip,
                  {
                    backgroundColor: isActive ? primaryColor : colors.card,
                    borderColor: isActive ? primaryColor : colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.languageChipText,
                    {color: isActive ? '#FFFFFF' : colors.text},
                  ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Page title */}
        <Text style={[styles.pageTitle, {color: primaryColor}]}>{t('customerConsent.title')}</Text>
        <Text style={[styles.pageSubtitle, {color: colors.textSecondary}]}>
          {t('customerConsent.subtitle')}
        </Text>

        {customerData && (
        <>
        {/* Customer Information */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t('customerConsent.customerInformation')}
        </Text>
        <DetailField
          label={t('customerConsent.name')}
          value={customerData.name}
          colors={colors}
        />
        <View style={styles.rowFields}>
          <DetailField
            label={t('customerConsent.phoneNumber')}
            value={customerData.phone}
            fullWidth={false}
            colors={colors}
          />
          <DetailField
            label={t('customerConsent.emailAddress')}
            value={customerData.email}
            fullWidth={false}
            colors={colors}
          />
        </View>
        <DetailField
          label={t('customerConsent.installationAddress')}
          value={customerData.address}
          multiline
          colors={colors}
        />

        <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />

        {/* Selected Internet Plan */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t('customerConsent.selectedInternetPlan')}
        </Text>
        <DetailField
          label={t('customerConsent.planName')}
          value={customerData.planName}
          colors={colors}
        />
        <View style={styles.rowFields}>
          <DetailField
            label={t('customerConsent.validity')}
            value={customerData.validity}
            fullWidth={false}
            colors={colors}
          />
          <DetailField
            label={t('customerConsent.monthlyPlanAmount')}
            value={customerData.monthlyAmount}
            fullWidth={false}
            colors={colors}
          />
        </View>
        <DetailField
          label={t('customerConsent.routerInformation')}
          value={customerData.routerInfo}
          colors={colors}
        />

        <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />

        {/* One-Time Charges */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t('customerConsent.oneTimeCharges')}
        </Text>
        <View style={styles.rowFields}>
          <DetailField
            label={t('customerConsent.installationCharges')}
            value={customerData.installationCharges}
            fullWidth={false}
            colors={colors}
          />
          <DetailField
            label={t('customerConsent.routerCharges')}
            value={customerData.routerCharges}
            fullWidth={false}
            colors={colors}
          />
        </View>

        <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />

        {/* KYC Details */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t('customerConsent.kycDetails')}
        </Text>
        <View style={styles.rowFields}>
          <DetailField
            label={t('customerConsent.idProof')}
            value={customerData.idProof}
            fullWidth={false}
            colors={colors}
          />
          <DetailField
            label={t('customerConsent.documentNumber')}
            value={customerData.idDocumentNumber}
            fullWidth={false}
            colors={colors}
          />
        </View>
        <View style={styles.rowFields}>
          <DetailField
            label={t('customerConsent.addressProof')}
            value={customerData.addressProof}
            fullWidth={false}
            colors={colors}
          />
          <DetailField
            label={t('customerConsent.documentNumber')}
            value={customerData.addressDocumentNumber}
            fullWidth={false}
            colors={colors}
          />
        </View>

        <View style={[styles.sectionDivider, {backgroundColor: colors.border}]} />

        {/* Consent checkboxes */}
        <ConsentCheckbox checked={consent1} onToggle={() => setConsent1(v => !v)} colors={colors}>
          {t('customerConsent.consent1')}
        </ConsentCheckbox>

        <ConsentCheckbox checked={consent2} onToggle={() => setConsent2(v => !v)} colors={colors}>
          {hasFullConsent2 ? (
            t('customerConsent.consent2')
          ) : (
            <>
              {t('customerConsent.consent2Prefix')}
              <Text style={{fontWeight: '700', color: colors.text}}>
                {t('customerConsent.companyName')}
              </Text>
            </>
          )}
        </ConsentCheckbox>

        <ConsentCheckbox checked={consent3} onToggle={() => setConsent3(v => !v)} colors={colors}>
          {t('customerConsent.consent3')}
        </ConsentCheckbox>

        {/* Proceed button */}
        <TouchableOpacity
          style={[
            styles.proceedButton,
            {
              backgroundColor: allConsentsAccepted ? primaryColor : `${primaryColor}80`,
            },
          ]}
          onPress={handleProceed}
          activeOpacity={0.8}
          disabled={!allConsentsAccepted}>
          <Text style={styles.proceedButtonText}>{t('customerConsent.proceedButton')}</Text>
        </TouchableOpacity>
        </>
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  languageChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 20,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldHalf: {
    flex: 1,
    marginBottom: 0,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  fieldBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  fieldValue: {
    fontSize: 13,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  proceedButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CustomerConsentScreen;
