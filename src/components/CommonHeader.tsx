import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';

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
      {showBackButton ? (
        <TouchableOpacity
          style={[styles.backButton, {backgroundColor: colors.background}]}
          onPress={handleBackPress}>
          <Text style={[styles.backButtonText, {color: colors.text}]}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <View style={styles.headerCenter}>
        <Image 
          source={require('../assets/isp_logo.png')} 
          style={[{ width: 180, height: 56 }, styles.logo]} 
        />
        {title && (
          <Text style={[styles.headerTitle, {color: colors.text}]}>{title}</Text>
        )}
      </View>
      
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
    paddingVertical: 16,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logo: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  placeholder: {
    width: 40,
  },
});

export default CommonHeader; 