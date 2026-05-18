import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {getClientConfig} from '../config/client-config';

interface PasswordRules {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasSpecial: boolean;
}

const getPasswordRules = (password: string): PasswordRules => ({
  minLength: password.length >= 6,
  hasNumber: /\d/.test(password),
  hasUppercase: /[A-Z]/.test(password),
  hasSpecial: /[@#$%&!*?^()_+\-=[\]{}|;:'",.<>/\\]/.test(password),
});

const allRulesPassed = (rules: PasswordRules) =>
  rules.minLength && rules.hasNumber && rules.hasUppercase && rules.hasSpecial;

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  colors: ReturnType<typeof getThemeColors>;
}

const PasswordField = ({
  label,
  value,
  onChangeText,
  showPassword,
  onToggleVisibility,
  colors,
}: PasswordFieldProps) => (
  <View style={styles.fieldContainer}>
    <Text style={[styles.fieldLabel, {color: colors.textSecondary}]}>{label}</Text>
    <View style={[styles.inputRow, {borderColor: colors.border, backgroundColor: colors.card}]}>
      <TextInput
        style={[styles.input, {color: colors.text}]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textTertiary}
      />
      <TouchableOpacity onPress={onToggleVisibility} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  </View>
);

interface RequirementRowProps {
  label: string;
  met: boolean;
  colors: ReturnType<typeof getThemeColors>;
}

const RequirementRow = ({label, met, colors}: RequirementRowProps) => (
  <View style={styles.requirementRow}>
    <View
      style={[
        styles.requirementIcon,
        {backgroundColor: met ? '#4CAF50' : colors.textSecondary},
      ]}>
      <Feather name={met ? 'check' : 'x'} size={12} color="#FFFFFF" />
    </View>
    <Text style={[styles.requirementText, {color: colors.text}]}>{label}</Text>
  </View>
);

const ChangePasswordScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const clientConfig = getClientConfig();
  const primaryColor = clientConfig.branding?.primaryColor || colors.primary;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const canSubmit = useMemo(() => {
    return (
      currentPassword.trim().length > 0 &&
      allRulesPassed(passwordRules) &&
      newPassword === confirmPassword
    );
  }, [currentPassword, passwordRules, newPassword, confirmPassword]);

  const handleUpdatePassword = async () => {
    if (!canSubmit) {
      if (newPassword !== confirmPassword) {
        Alert.alert(t('common.error'), t('changePasswordPage.passwordMismatch'));
      } else {
        Alert.alert(t('common.error'), t('changePasswordPage.requirementsNotMet'));
      }
      return;
    }

    try {
      setIsSubmitting(true);
      // API integration will be added later
      Alert.alert(t('common.success'), t('changePasswordPage.updateSuccess'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('changePasswordPage.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: '#F5F5F5'}]} edges={['top', 'bottom']}>
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.pageTitle, {color: primaryColor}]}>{t('changePasswordPage.title')}</Text>
          <Text style={[styles.pageSubtitle, {color: colors.textSecondary}]}>
            {t('changePasswordPage.subtitle')}
          </Text>

          <View style={[styles.formCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <PasswordField
              label={t('changePasswordPage.currentPassword')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              showPassword={showCurrent}
              onToggleVisibility={() => setShowCurrent(v => !v)}
              colors={colors}
            />
            <PasswordField
              label={t('changePasswordPage.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              showPassword={showNew}
              onToggleVisibility={() => setShowNew(v => !v)}
              colors={colors}
            />
            <PasswordField
              label={t('changePasswordPage.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              showPassword={showConfirm}
              onToggleVisibility={() => setShowConfirm(v => !v)}
              colors={colors}
            />

            <Text style={[styles.requirementsTitle, {color: colors.text}]}>
              {t('changePasswordPage.requirementsTitle')}
            </Text>

            <RequirementRow
              label={t('changePasswordPage.ruleMinLength')}
              met={passwordRules.minLength}
              colors={colors}
            />
            <RequirementRow
              label={t('changePasswordPage.ruleNumber')}
              met={passwordRules.hasNumber}
              colors={colors}
            />
            <RequirementRow
              label={t('changePasswordPage.ruleUppercase')}
              met={passwordRules.hasUppercase}
              colors={colors}
            />
            <RequirementRow
              label={t('changePasswordPage.ruleSpecial')}
              met={passwordRules.hasSpecial}
              colors={colors}
            />

            <TouchableOpacity
              style={[
                styles.updateButton,
                {backgroundColor: canSubmit && !isSubmitting ? primaryColor : `${primaryColor}80`},
              ]}
              onPress={handleUpdatePassword}
              activeOpacity={0.8}
              disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.updateButtonText}>{t('changePasswordPage.updateButton')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerNote, {color: colors.text}]}>{t('changePasswordPage.footerNote')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
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
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  formCard: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  requirementText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  updateButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});

export default ChangePasswordScreen;
