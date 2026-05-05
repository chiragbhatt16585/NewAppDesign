import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import CommonHeader from '../components/CommonHeader';
import LeftBorderLine from '../components/LeftBorderLine';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import sessionManager from '../services/sessionManager';
import {apiService} from '../services/api';

type ProfileForm = {
  name: string;
  email: string;
  mobile: string;
  dob: string;
};

const ProfileUpdateScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date(2000, 0, 1));
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [adminLoginId, setAdminLoginId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDate = (value: string): Date | null => {
    if (!value || value === 'N/A') {
      return null;
    }
    const isoCandidate = value.includes('T') ? value.split('T')[0] : value;
    const date = new Date(isoCandidate);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
    return null;
  };
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    email: '',
    mobile: '',
    dob: '',
  });
  const [initialForm, setInitialForm] = useState<ProfileForm>({
    name: '',
    email: '',
    mobile: '',
    dob: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const session = await sessionManager.getCurrentSession();
        const sessionUsername = session?.username;
        if (!sessionUsername) {
          setIsLoading(false);
          return;
        }
        const authResponse = await apiService.authUser(sessionUsername);
        setUsername(sessionUsername);
        setAdminLoginId(authResponse?.admin_login_id || 'bhaskar');
        setMobileNumber(authResponse?.primary_mobile || '');
        const fullName =
          `${authResponse?.first_name || ''} ${authResponse?.last_name || ''}`.trim() || 'N/A';

        const profileData: ProfileForm = {
          name: fullName,
          email: authResponse?.primary_email || 'N/A',
          mobile: authResponse?.primary_mobile || 'N/A',
          dob:
            authResponse?.dob ||
            authResponse?.date_of_birth ||
            authResponse?.birth_date ||
            'N/A',
        };

        setForm(profileData);
        setInitialForm(profileData);
        const parsedDob = parseDate(profileData.dob);
        if (parsedDob) {
          setDobDate(parsedDob);
        }
      } catch {
        // Keep fallback values
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const canSave = useMemo(() => {
    return (
      form.name !== initialForm.name ||
      form.email !== initialForm.email ||
      form.mobile !== initialForm.mobile ||
      form.dob !== initialForm.dob
    );
  }, [form, initialForm]);

  const setField = (key: keyof ProfileForm, value: string) => {
    setForm(prev => ({...prev, [key]: value}));
  };

  const normalizeValue = (value: string) => {
    const trimmed = String(value || '').trim();
    return trimmed === 'N/A' ? '' : trimmed;
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const isAdultDob = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // DOB must be strictly before today
    if (selected >= today) {
      return false;
    }

    // Must be age 18+
    const minAllowedDob = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    return selected <= minAllowedDob;
  };

  const validateChangedFields = (): string | null => {
    const mobileChanged = normalizeValue(form.mobile) !== normalizeValue(initialForm.mobile);
    const emailChanged = normalizeValue(form.email) !== normalizeValue(initialForm.email);
    const dobChanged = normalizeValue(form.dob) !== normalizeValue(initialForm.dob);

    if (mobileChanged) {
      const mobileValue = normalizeValue(form.mobile).replace(/\D/g, '');
      if (mobileValue.length !== 10) {
        return 'Please enter a valid 10-digit mobile number.';
      }
    }

    if (emailChanged) {
      const emailValue = normalizeValue(form.email);
      if (!emailValue || !isValidEmail(emailValue)) {
        return 'Please enter a valid email address.';
      }
    }

    if (dobChanged) {
      const dobValue = normalizeValue(form.dob);
      const parsedDob = parseDate(dobValue);
      if (!parsedDob) {
        return 'Please select a valid DOB.';
      }
      if (!isAdultDob(parsedDob)) {
        return 'DOB must be before today and age should be 18 years or above.';
      }
    }

    return null;
  };

  const onEditPress = () => {
    if (isEditing) {
      setForm(initialForm);
      setIsEditing(false);
      return;
    }
    setIsEditing(true);
  };

  const onSavePress = async () => {
    try {
      setIsSaving(true);
      if (!canSave) {
        Alert.alert('No Changes', 'No profile changes found.');
        setIsEditing(false);
        return;
      }

      const validationError = validateChangedFields();
      if (validationError) {
        Alert.alert('Validation Error', validationError);
        return;
      }

      const adminDetails = await apiService.getAdminDetials('admin');
      const updateWithoutOtp = String(
        adminDetails?.settings?.update_profile_without_otp ??
          adminDetails?.update_profile_without_otp ??
          ''
      )
        .trim()
        .toLowerCase();

      if (__DEV__) {
        console.log('[ProfileUpdate] update_profile_without_otp raw:', adminDetails?.settings?.update_profile_without_otp);
        console.log('[ProfileUpdate] update_profile_without_otp normalized:', updateWithoutOtp);
      }

      if (updateWithoutOtp === 'no') {
        await apiService.sendProfileUpdateOTP({
          username,
          loginId: username,
          adminLoginId: adminLoginId || 'bhaskar',
          otpSentOn: mobileNumber || form.mobile,
        });
        setShowOtpModal(true);
        Alert.alert('OTP Sent', 'Please enter OTP to continue profile details update.');
        return;
      }

      const nameParts = String(form.name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      await apiService.updateUserProfileDetails({
        username,
        adminLoginId: adminLoginId || 'bhaskar',
        otp: '',
        primaryEmail: form.email,
        firstName,
        middleName,
        lastName,
        primaryMobile: form.mobile,
        birthDate: form.dob && form.dob !== 'N/A' ? form.dob : '',
      });

      setIsEditing(false);
      setShowOtpModal(false);
      setOtp('');
      Alert.alert('Success', 'Profile details updated successfully.');
      const refreshedForm = {...form};
      setInitialForm(refreshedForm);
      setForm(refreshedForm);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to process profile details update.');
    } finally {
      setIsSaving(false);
    }
  };

  const onVerifyOtpPress = async () => {
    if (!otp || otp.trim().length < 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid OTP.');
      return;
    }
    if (!canSave) {
      Alert.alert('No Changes', 'No profile changes found.');
      setShowOtpModal(false);
      setIsEditing(false);
      return;
    }
    const validationError = validateChangedFields();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }
    try {
      setIsSaving(true);

      const nameParts = String(form.name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      await apiService.updateUserProfileDetails({
        username,
        adminLoginId: adminLoginId || 'bhaskar',
        otp: otp.trim(),
        primaryEmail: form.email,
        firstName,
        middleName,
        lastName,
        primaryMobile: form.mobile,
        birthDate: form.dob && form.dob !== 'N/A' ? form.dob : '',
      });

      setShowOtpModal(false);
      setOtp('');
      setIsEditing(false);
      const refreshedForm = {...form};
      setInitialForm(refreshedForm);
      setForm(refreshedForm);
      Alert.alert('Success', 'Profile details updated successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to verify OTP/update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderRow = (
    label: string,
    value: string,
    field: keyof ProfileForm,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
  ) => (
    <View style={[styles.row, {borderBottomColor: colors.borderLight}]}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      {isEditing ? (
        <TextInput
          value={value}
          onChangeText={text => setField(field, text)}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.borderLight,
              backgroundColor: colors.background,
            },
          ]}
          keyboardType={keyboardType}
          placeholder={label}
          placeholderTextColor={colors.textSecondary}
        />
      ) : (
        <Text style={[styles.value, {color: colors.text}]}>{value || 'N/A'}</Text>
      )}
    </View>
  );

  const onDobChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
    }
    if (selectedDate) {
      setDobDate(selectedDate);
      setField('dob', formatDate(selectedDate));
      if (Platform.OS === 'ios') {
        setShowDobPicker(false);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, {color: colors.textSecondary}]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <LeftBorderLine />
      <ScrollView showsVerticalScrollIndicator={false}>
        <CommonHeader navigation={navigation} />

        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, {color: colors.text}]}>Profile Details</Text>
          <TouchableOpacity
            style={[styles.editButton, {backgroundColor: colors.card}]}
            onPress={onEditPress}
            activeOpacity={0.8}>
            <Feather name={isEditing ? 'x' : 'edit-2'} size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          {renderRow('Name', form.name, 'name')}
          {renderRow('Email', form.email, 'email', 'email-address')}
          {renderRow('Mobile', form.mobile, 'mobile', 'phone-pad')}
          <View style={[styles.row, styles.lastRow, {borderBottomColor: colors.borderLight}]}>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Birthday</Text>
            {isEditing ? (
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dateInputButton,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={() => setShowDobPicker(true)}
                activeOpacity={0.8}>
                <Text style={[styles.value, {color: colors.text}]}>
                  {form.dob || 'Select Date'}
                </Text>
                <Feather name="calendar" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.value, {color: colors.text}]}>{form.dob || 'N/A'}</Text>
            )}
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, {backgroundColor: colors.primary}]}
            onPress={onSavePress}
            disabled={isSaving}
            activeOpacity={0.85}>
            <Text style={styles.saveButtonText}>{isSaving ? 'Please wait...' : 'Save'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}>
        <View style={styles.otpOverlay}>
          <View style={[styles.otpModalCard, {backgroundColor: colors.card}]}>
            <Text style={[styles.otpTitle, {color: colors.text}]}>Verify OTP</Text>
            <Text style={[styles.otpHint, {color: colors.textSecondary}]}>
              Enter the OTP sent to {mobileNumber || form.mobile}
            </Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              style={[
                styles.input,
                styles.otpInput,
                {
                  color: colors.text,
                  borderColor: colors.borderLight,
                  backgroundColor: colors.background,
                },
              ]}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              placeholder="Enter OTP"
              placeholderTextColor={colors.textSecondary}
              maxLength={6}
            />
            <Text style={[styles.otpNote, {color: colors.textSecondary}]}>
              OTP auto-fill is enabled when SMS format supports it.
            </Text>
            <View style={styles.otpButtonRow}>
              <TouchableOpacity
                style={[styles.otpButton, {backgroundColor: colors.borderLight}]}
                onPress={() => {
                  setShowOtpModal(false);
                  setOtp('');
                }}>
                <Text style={[styles.otpButtonText, {color: colors.text}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.otpButton, {backgroundColor: colors.primary}]}
                onPress={onVerifyOtpPress}
                disabled={isSaving}>
                <Text style={styles.otpButtonTextPrimary}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDobPicker && (
        <DateTimePicker
          value={dobDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={onDobChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 14,
    marginTop: 10,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  card: {
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    elevation: 4,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  otpHint: {
    fontSize: 13,
    marginBottom: 14,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 18,
  },
  otpNote: {
    fontSize: 12,
    marginTop: 10,
  },
  otpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  otpModalCard: {
    borderRadius: 14,
    padding: 16,
    elevation: 6,
  },
  otpButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  otpButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  otpButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  otpButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default ProfileUpdateScreen;
