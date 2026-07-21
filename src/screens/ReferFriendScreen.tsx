import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import ActiveTicketModal from '../components/ActiveTicketModal';
import { getClientConfig } from '../config/client-config';
import { isReferFriendFieldVisible, isReferFriendFieldRequired } from '../config/refer-friend-config';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import { useTranslation } from 'react-i18next';

type FormData = {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  altPhone: string;
  email: string;
  address1: string;
  building: string;
  building_id: string;
  building_name: string;
  area: string;
  location: string;
  pincode: string;
  city: string;
  city_name: string;
  remarks: string;
  salesPerson: string;
};

const ReferFriendScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const isMicroscan = getClientConfig().clientId === 'microscan';
  const showBuildingField = isReferFriendFieldVisible('building');
  const showAreaField = isReferFriendFieldVisible('area');
  const showLocationField = isReferFriendFieldVisible('location');
  const buildingRequired = isReferFriendFieldRequired('building');
  const pincodeRequired = isReferFriendFieldRequired('pincode');
  const address1Required = isReferFriendFieldRequired('address1');
  const cityRequired = isReferFriendFieldRequired('city');
  const firstNameRequired = isReferFriendFieldRequired('firstName');
  const lastNameRequired = isReferFriendFieldRequired('lastName');
  const mobileNumberRequired = isReferFriendFieldRequired('mobileNumber');
  const emailRequired = isReferFriendFieldRequired('email');
  const addressFieldWidthStyle =
    showAreaField && showLocationField ? styles.halfField : undefined;

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [showSalesExec, setShowSalesExec] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    altPhone: '',
    email: '',
    address1: '',
    building: '',
    building_id: '',
    building_name: '',
    area: '',
    location: '',
    pincode: '',
    city: '',
    city_name: '',
    remarks: '',
    salesPerson: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resultModal, setResultModal] = useState<{
    variant: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const normalizeOption = (item: any) => {
    const value =
      item?.value ?? item?.id ?? item?.city_id ?? item?.building_id ?? item?.code ?? '';
    const label =
      item?.label ?? item?.name ?? item?.city_name ?? item?.building_name ?? item?.title ?? '';
    return { ...item, value: String(value), label: String(label) };
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsPageLoading(true);
      try {
        const session = await sessionManager.getCurrentSession();
        if (!session?.username) throw new Error('No user session found');
        const { getClientConfig } = require('../config/client-config');
        const clientConfig = getClientConfig();
        const realm = clientConfig.clientId;
        const [buildingsData, citiesData] = await Promise.all([
          showBuildingField ? apiService.getAllBuildings(realm) : Promise.resolve([]),
          apiService.getAllCities(realm),
        ]);
        const normalizedBuildings = Array.isArray(buildingsData)
          ? buildingsData.map(normalizeOption).filter((b: any) => b.value && b.label)
          : [];
        const normalizedCities = Array.isArray(citiesData)
          ? citiesData.map(normalizeOption).filter((c: any) => c.value && c.label)
          : [];
        if (__DEV__) {
          console.log('[ReferFriend] getAllBuildings => response', JSON.stringify(buildingsData, null, 2));
          console.log('[ReferFriend] getAllCities => response', JSON.stringify(citiesData, null, 2));
        }
        setBuildings(normalizedBuildings);
        setCities(normalizedCities);
        const authData = await apiService.authUser(session.username);
        if (authData?.display_sales_exec_selection_in_customer_referral === 'yes') {
          const salesData = await apiService.getAllSalesPersons(realm);
          if (__DEV__) {
            console.log('[ReferFriend] getAllSalesPersons => response', JSON.stringify(salesData, null, 2));
          }
          setShowSalesExec(true);
          setSalesPersons(salesData);
        } else {
          setShowSalesExec(false);
        }
      } catch (e: any) {
        Toast.show({ type: 'error', text1: e.message || 'Error loading data' });
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchData();
  }, [showBuildingField]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (firstNameRequired && !formData.firstName.trim()) {
      newErrors.firstName = t('referFriend.firstNameRequired');
      isValid = false;
    }
    if (lastNameRequired && !formData.lastName.trim()) {
      newErrors.lastName = t('referFriend.lastNameRequired');
      isValid = false;
    }
    if (mobileNumberRequired && !formData.mobileNumber.trim()) {
      newErrors.mobileNumber = t('referFriend.mobileNumberRequired');
      isValid = false;
    } else if (
      mobileNumberRequired &&
      formData.mobileNumber.trim() &&
      !/^\d{10}$/.test(formData.mobileNumber.trim())
    ) {
      newErrors.mobileNumber = t('referFriend.mobileNumberRequired');
      isValid = false;
    } else if (
      !mobileNumberRequired &&
      formData.mobileNumber.trim() &&
      !/^\d{10}$/.test(formData.mobileNumber.trim())
    ) {
      newErrors.mobileNumber = t('referFriend.mobileNumberRequired');
      isValid = false;
    }
    if (emailRequired && !formData.email.trim()) {
      newErrors.email = t('referFriend.emailRequired');
      isValid = false;
    } else if (emailRequired && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = t('referFriend.emailRequired');
      isValid = false;
    } else if (
      !emailRequired &&
      formData.email.trim() &&
      !/\S+@\S+\.\S+/.test(formData.email.trim())
    ) {
      newErrors.email = t('referFriend.emailRequired');
      isValid = false;
    }
    if (address1Required && !formData.address1.trim()) {
      newErrors.address1 = t('referFriend.address1Required');
      isValid = false;
    }
    if (showBuildingField && buildingRequired && !formData.building_id) {
      newErrors.building = t('referFriend.buildingRequired');
      isValid = false;
    }
    if (showAreaField && !formData.area.trim()) {
      newErrors.area = t('referFriend.areaRequired');
      isValid = false;
    }
    if (showLocationField && !formData.location.trim()) {
      newErrors.location = t('referFriend.locationRequired');
      isValid = false;
    }
    if (pincodeRequired && !formData.pincode.trim()) {
      newErrors.pincode = t('referFriend.pincodeRequired');
      isValid = false;
    } else if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = t('referFriend.pincodeRequired');
      isValid = false;
    }
    if (cityRequired && !formData.city) {
      newErrors.city = t('referFriend.cityRequired');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setIsSubmitting(true);
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      const payload = {
        firstName: formData.firstName.trim(),
        middleName: '',
        lastName: formData.lastName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim(),
        address1: formData.address1.trim(),
        address2: formData.altPhone.trim(),
        building_id: formData.building_id,
        building_name: formData.building_name,
        area: formData.area.trim(),
        location: formData.location.trim(),
        pincode: formData.pincode.trim(),
        city: formData.city,
        city_name: formData.city_name,
        remarks: formData.remarks.trim(),
        salesPerson: formData.salesPerson,
      };
      if (__DEV__) {
        console.log('[ReferFriend] submit => payload', JSON.stringify(payload, null, 2));
      }
      const response = await apiService.addNewInquiry(session.username, payload, realm);
      if (__DEV__) {
        console.log('[ReferFriend] submit => api response', JSON.stringify(response, null, 2));
      }
      setFormData({
        firstName: '',
        lastName: '',
        mobileNumber: '',
        altPhone: '',
        email: '',
        address1: '',
        building: '',
        building_id: '',
        building_name: '',
        area: '',
        location: '',
        pincode: '',
        city: '',
        city_name: '',
        remarks: '',
        salesPerson: '',
      });
      setResultModal({
        variant: 'success',
        title: 'Inquiry Submitted',
        message: response?.message || 'Your inquiry submitted successfully!',
      });
    } catch (e: any) {
      setResultModal({
        variant: 'error',
        title: 'Unable to Submit Inquiry',
        message: e.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (hasError?: boolean) => [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: hasError ? '#EF4444' : colors.border,
      color: colors.text,
    },
    hasError && styles.inputError,
  ];

  const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
      {label}
      {required ? <Text style={styles.requiredStar}> *</Text> : null}
    </Text>
  );

  const SectionHeader = ({
    icon,
    title,
  }: {
    icon: React.ComponentProps<typeof Feather>['name'];
    title: string;
  }) => (
    <View style={styles.sectionHeader}>
      {isMicroscan ? (
        <Feather name={icon} size={22} color={colors.primary} style={styles.sectionIconMicroscan} />
      ) : (
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary }]}>
          <Feather name={icon} size={18} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      )}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  const BuildingSelector = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
      if (formData.building_name) {
        setSearchText(formData.building_name);
      }
    }, [formData.building_name]);

    const filteredBuildings = useMemo(() => {
      if (!searchText || searchText.length < 3) return [];
      return buildings
        .filter(
          b =>
            b.label && b.label.toLowerCase().includes(searchText.toLowerCase()),
        )
        .slice(0, 5);
    }, [searchText, buildings]);

    const handleBuildingSelect = (building: any) => {
      setSearchText(building.label);
      setShowDropdown(false);
      const cityObj = cities.find(c => String(c.value) === String(building.city_id));
      const cityName = cityObj ? cityObj.label : '';
      setFormData(prev => ({
        ...prev,
        building: building.value || building.building_id,
        building_id: building.building_id,
        building_name: building.label,
        area: building.area_name || '',
        location: building.location_name || '',
        city: building.city_id || '',
        city_name: cityName,
        pincode: building.pincode || '',
      }));
      setErrors(prev => ({
        ...prev,
        building: '',
        area: '',
        location: '',
        city: '',
        pincode: '',
      }));
    };

    return (
      <View style={styles.fieldBlock}>
        <FieldLabel label={t('referFriend.building')} required={buildingRequired} />
        <View style={[styles.autocompleteContainer, errors.building ? styles.inputErrorWrap : null]}>
          <TextInput
            ref={inputRef}
            placeholder={t('referFriend.selectBuilding')}
            value={searchText}
            onChangeText={text => {
              setSearchText(text);
              setShowDropdown(text.length >= 3);
              if (formData.building_id) {
                handleInputChange('building', '');
                handleInputChange('building_id', '');
                handleInputChange('building_name', '');
              }
            }}
            style={inputStyle(!!errors.building)}
            onFocus={() => {
              if (searchText.length >= 3) setShowDropdown(true);
            }}
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Feather
            name="chevron-down"
            size={18}
            color={colors.textSecondary}
            style={styles.selectChevron}
          />
          {showDropdown && filteredBuildings.length > 0 && (
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {filteredBuildings.map(building => (
                  <TouchableHighlight
                    key={building.value}
                    onPress={() => {
                      handleBuildingSelect(building);
                      inputRef.current?.blur?.();
                    }}
                    underlayColor="#F3F4F6"
                  >
                    <View style={styles.dropdownItem}>
                      <Text style={[styles.buildingName, { color: colors.text }]}>{building.label}</Text>
                    </View>
                  </TouchableHighlight>
                ))}
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
        {errors.building ? <Text style={styles.errorText}>{errors.building}</Text> : null}
      </View>
    );
  };

  const CitySelector = () => (
    <View style={[styles.fieldBlock, styles.halfField]}>
      <FieldLabel label={t('referFriend.city')} required={cityRequired} />
      <View style={[styles.selectWrap, errors.city ? styles.inputErrorWrap : null]}>
        <TouchableOpacity
          style={[inputStyle(!!errors.city), styles.selectButton]}
          onPress={() => setShowCityDropdown(!showCityDropdown)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectText,
              { color: formData.city_name ? colors.text : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {formData.city_name || t('referFriend.selectCity')}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {showCityDropdown && (
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {cities.map(city => (
              <TouchableHighlight
                key={city.value}
                onPress={() => {
                  handleInputChange('city', city.value);
                  handleInputChange('city_name', city.label);
                  setShowCityDropdown(false);
                }}
                underlayColor="#F3F4F6"
              >
                <View style={styles.dropdownItem}>
                  <Text style={{ color: colors.text, fontSize: 15 }}>{city.label}</Text>
                </View>
              </TouchableHighlight>
            ))}
          </View>
        )}
      </View>
      {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headingContainer}>
            <Text style={[styles.pageHeading, { color: colors.text }]}>{t('referFriend.title')}</Text>
            <Text style={[styles.pageSubheading, { color: colors.textSecondary }]}>
              {t('referFriend.subtitle')}
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            {isPageLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.pageLoader} />
            ) : (
              <>
                <SectionHeader icon="user" title={t('referFriend.personalDetails')} />
                <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

                <View style={styles.row}>
                  <View style={[styles.fieldBlock, styles.halfField]}>
                    <FieldLabel label={t('referFriend.firstName')} required={firstNameRequired} />
                    <TextInput
                      style={inputStyle(!!errors.firstName)}
                      placeholder={t('referFriend.firstName')}
                      value={formData.firstName}
                      onChangeText={v => handleInputChange('firstName', v)}
                      placeholderTextColor={colors.textSecondary}
                    />
                    {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
                  </View>
                  <View style={[styles.fieldBlock, styles.halfField]}>
                    <FieldLabel label={t('referFriend.lastName')} required={lastNameRequired} />
                    <TextInput
                      style={inputStyle(!!errors.lastName)}
                      placeholder={t('referFriend.lastName')}
                      value={formData.lastName}
                      onChangeText={v => handleInputChange('lastName', v)}
                      placeholderTextColor={colors.textSecondary}
                    />
                    {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldBlock, styles.halfField]}>
                    <FieldLabel label={t('referFriend.mobileNumber')} required={mobileNumberRequired} />
                    <TextInput
                      style={inputStyle(!!errors.mobileNumber)}
                      placeholder={t('referFriend.mobileNumber')}
                      value={formData.mobileNumber}
                      onChangeText={v => handleInputChange('mobileNumber', v)}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholderTextColor={colors.textSecondary}
                    />
                    {errors.mobileNumber ? <Text style={styles.errorText}>{errors.mobileNumber}</Text> : null}
                  </View>
                  <View style={[styles.fieldBlock, styles.halfField]}>
                    <FieldLabel label={t('referFriend.altPhone')} />
                    <TextInput
                      style={inputStyle()}
                      placeholder={t('referFriend.altPhone')}
                      value={formData.altPhone}
                      onChangeText={v => handleInputChange('altPhone', v)}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <FieldLabel label={t('referFriend.email')} required={emailRequired} />
                  <TextInput
                    style={inputStyle(!!errors.email)}
                    placeholder={t('referFriend.email')}
                    value={formData.email}
                    onChangeText={v => handleInputChange('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                <SectionHeader icon="map-pin" title={t('referFriend.installationAddress')} />
                <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

                <View style={styles.fieldBlock}>
                  <FieldLabel label={t('referFriend.address1')} required={address1Required} />
                  <TextInput
                    style={inputStyle(!!errors.address1)}
                    placeholder={t('referFriend.address1')}
                    value={formData.address1}
                    onChangeText={v => handleInputChange('address1', v)}
                    placeholderTextColor={colors.textSecondary}
                  />
                  {errors.address1 ? <Text style={styles.errorText}>{errors.address1}</Text> : null}
                </View>

                {showBuildingField ? <BuildingSelector /> : null}

                {showAreaField || showLocationField ? (
                  <View style={styles.row}>
                    {showAreaField ? (
                      <View style={[styles.fieldBlock, addressFieldWidthStyle]}>
                        <FieldLabel label={t('referFriend.area')} required />
                        <TextInput
                          style={inputStyle(!!errors.area)}
                          placeholder={t('referFriend.area')}
                          value={formData.area}
                          onChangeText={v => handleInputChange('area', v)}
                          placeholderTextColor={colors.textSecondary}
                        />
                        {errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}
                      </View>
                    ) : null}
                    {showLocationField ? (
                      <View style={[styles.fieldBlock, addressFieldWidthStyle]}>
                        <FieldLabel label={t('referFriend.landmark')} required />
                        <TextInput
                          style={inputStyle(!!errors.location)}
                          placeholder={t('referFriend.landmark')}
                          value={formData.location}
                          onChangeText={v => handleInputChange('location', v)}
                          placeholderTextColor={colors.textSecondary}
                        />
                        {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.row}>
                  <CitySelector />
                  <View style={[styles.fieldBlock, styles.halfField]}>
                    <FieldLabel label={t('referFriend.pincode')} required={pincodeRequired} />
                    <TextInput
                      style={inputStyle(!!errors.pincode)}
                      placeholder={t('referFriend.pincode')}
                      value={formData.pincode}
                      onChangeText={v => handleInputChange('pincode', v)}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholderTextColor={colors.textSecondary}
                    />
                    {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}
                  </View>
                </View>

                {showSalesExec && (
                  <>
                    <SectionHeader icon="briefcase" title={t('referFriend.salesExecutive')} />
                    <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
                    <View style={[styles.salesPickerContainer, { borderColor: colors.border }]}>
                      <Picker
                        selectedValue={formData.salesPerson}
                        onValueChange={v => handleInputChange('salesPerson', v)}
                        style={{ color: colors.text }}
                      >
                        <Picker.Item label={t('referFriend.selectSalesExecutive')} value="" />
                        {salesPersons.map(person => (
                          <Picker.Item key={person.value} label={person.label} value={person.value} />
                        ))}
                      </Picker>
                    </View>
                  </>
                )}

                <SectionHeader icon="message-circle" title={t('referFriend.additionalInfo')} />
                <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

                <View style={styles.fieldBlock}>
                  <TextInput
                    style={[inputStyle(), styles.remarksInput]}
                    placeholder={t('referFriend.remarks')}
                    value={formData.remarks}
                    onChangeText={v => handleInputChange('remarks', v)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.privacyNote, { color: colors.textSecondary }]}>
                    <Text style={styles.noteBold}>{t('referFriend.noteLabel')} </Text>
                    {t('referFriend.privacyNote')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.submitDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>{t('referFriend.submit')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ActiveTicketModal
        visible={!!resultModal}
        variant={resultModal?.variant}
        title={resultModal?.title}
        message={resultModal?.message}
        actionLabel="OK"
        onClose={() => setResultModal(null)}
        onAction={() => setResultModal(null)}
      />
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headingContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pageSubheading: {
    fontSize: 16,
    lineHeight: 22,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  formCard: {
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  pageLoader: {
    paddingVertical: 48,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionIconMicroscan: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    marginBottom: 16,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  requiredStar: {
    color: '#EF4444',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 15,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputErrorWrap: {
    borderRadius: 10,
  },
  selectWrap: {
    position: 'relative',
    zIndex: 20,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    paddingRight: 8,
  },
  selectChevron: {
    position: 'absolute',
    right: 14,
    top: 15,
    pointerEvents: 'none',
  },
  remarksInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  privacyNote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  noteBold: {
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 30,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 40,
    elevation: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  buildingName: {
    fontSize: 15,
    fontWeight: '500',
  },
  salesPickerContainer: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
});

export default ReferFriendScreen;
