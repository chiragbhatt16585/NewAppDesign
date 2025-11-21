import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import LogoImage from './LogoImage';

interface CommonHeaderProps {
  navigation: any;
  title?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
}

const CommonHeader = ({
  navigation,
  title,
  showBackButton = true,
  rightComponent,
  onBackPress,
}: CommonHeaderProps) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, {backgroundColor: colors.surface, borderBottomColor: colors.border}]}>
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity
            style={[styles.backButton, {backgroundColor: colors.background}]}
            onPress={handleBackPress}>
            <Text style={[styles.backButtonText, {color: colors.text}]}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={styles.logoContainer}>
          <LogoImage type="header" />
        </View>
      </View>
      
      {title && (
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: colors.text}]}>{title}</Text>
        </View>
      )}
      
      {rightComponent ? (
        rightComponent
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
  },
  logoContainer: {
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
});

export default CommonHeader; 