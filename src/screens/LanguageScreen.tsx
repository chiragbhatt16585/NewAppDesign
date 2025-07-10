import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useLanguage} from '../utils/LanguageContext';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {useTranslation} from 'react-i18next';

const LanguageScreen = ({navigation}: any) => {
  const {currentLanguage, changeLanguage, availableLanguages} = useLanguage();
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    // Navigate back or to home screen
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: colors.text}]}>
            {t('more.language')}
          </Text>
        </View>

        {/* Language Options */}
        <View style={styles.languageContainer}>
          {availableLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                {
                  backgroundColor: colors.card,
                  borderColor: currentLanguage === language.code ? colors.primary : colors.borderLight,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.7}>
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, {color: colors.text}]}>
                  {language.nativeName}
                </Text>
                <Text style={[styles.languageEnglishName, {color: colors.textSecondary}]}>
                  {language.name}
                </Text>
              </View>
              {currentLanguage === language.code && (
                <View style={[styles.selectedIndicator, {backgroundColor: colors.primary}]}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, {color: colors.textSecondary}]}>
            {t('common.selectLanguage')}
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  languageContainer: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageEnglishName: {
    fontSize: 14,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LanguageScreen; 