import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import DeviceInfo from 'react-native-device-info';

const {width, height} = Dimensions.get('window');

const LoginScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  
  // Hardcoded default values for easy testing
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('password123');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation effects
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (loginMethod === 'password') {
      if (!username || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        setIsLoading(false);
        return;
      }
      // Mock login - replace with actual API call
      navigation.navigate('Home');
    } else {
      if (!phoneNumber) {
        Alert.alert('Error', 'Please enter your phone number');
        setIsLoading(false);
        return;
      }
      if (!showOtpInput) {
        setShowOtpInput(true);
        Alert.alert('Success', 'OTP sent to your phone number');
        setIsLoading(false);
        return;
      }
      if (!otp) {
        Alert.alert('Error', 'Please enter OTP');
        setIsLoading(false);
        return;
      }
      // Mock OTP verification - replace with actual API call
      navigation.navigate('Home');
    }
    setIsLoading(false);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowOtpInput(true);
    Alert.alert('Success', 'OTP sent to your phone number');
    setIsLoading(false);
  };

  const renderLoadingSpinner = () => (
    <View style={styles.spinnerContainer}>
      <View style={styles.spinner} />
    </View>
  );

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();
  console.log('App Version:', appVersion, 'Build:', buildNumber);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            <View style={styles.logoSection}>
              <Image source={require('../assets/isp_logo.png')} style={[{ width: 220, height: 70 }, styles.logo]} />
            </View>
            <Text style={[styles.title, {color: colors.text}]}>Microscan Internet Private Limited</Text>
            {/* <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
              Welcome to your ISP dashboard
            </Text> */}
          </Animated.View>

          {/* Login Interface */}
          <Animated.View 
            style={[
              styles.loginInterface,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            
            {/* Tab Navigation */}
            <View style={[styles.tabNavigation, {backgroundColor: colors.background}]}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  loginMethod === 'password' && [styles.activeTabButton, {backgroundColor: colors.primary}],
                ]}
                onPress={() => {
                  setLoginMethod('password');
                  setShowOtpInput(false);
                }}>
                <Text
                  style={[
                    styles.tabButtonText,
                    {color: colors.textSecondary},
                    loginMethod === 'password' && styles.activeTabButtonText,
                  ]}>
                  Password Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  loginMethod === 'otp' && [styles.activeTabButton, {backgroundColor: colors.primary}],
                ]}
                onPress={() => {
                  setLoginMethod('otp');
                  setShowOtpInput(false);
                }}>
                <Text
                  style={[
                    styles.tabButtonText,
                    {color: colors.textSecondary},
                    loginMethod === 'otp' && styles.activeTabButtonText,
                  ]}>
                  OTP Login
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Password Login Form */}
              {loginMethod === 'password' && (
                <View>
                  <View style={styles.inputField}>
                    <Text style={[styles.fieldLabel, {color: colors.text}]}>
                      Username
                    </Text>
                    <TextInput
                      style={[styles.textInput, {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                      }]}
                      placeholder="Enter your username"
                      placeholderTextColor={colors.textTertiary}
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                  <View style={styles.inputField}>
                    <Text style={[styles.fieldLabel, {color: colors.text}]}>
                      Password
                    </Text>
                    <TextInput
                      style={[styles.textInput, {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                      }]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>
              )}

              {/* OTP Login Form */}
              {loginMethod === 'otp' && (
                <View>
                  <View style={styles.inputField}>
                    <Text style={[styles.fieldLabel, {color: colors.text}]}>
                      Phone Number
                    </Text>
                    <TextInput
                      style={[styles.textInput, {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                      }]}
                      placeholder="Enter your phone number"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>
                  
                  {showOtpInput && (
                    <View style={styles.inputField}>
                      <Text style={[styles.fieldLabel, {color: colors.text}]}>
                        OTP
                      </Text>
                      <TextInput
                        style={[styles.textInput, {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                          color: colors.text,
                        }]}
                        placeholder="Enter OTP"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={setOtp}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, {backgroundColor: colors.primary}]}
                onPress={handleLogin}
                disabled={isLoading}>
                {isLoading ? (
                  renderLoadingSpinner()
                ) : (
                  <Text style={styles.loginButtonText}>
                    {loginMethod === 'otp' && !showOtpInput ? 'Send OTP' : 'Login'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* Features Display - Card Style */}
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, marginTop: 10}}>
            <View style={{flex: 1, alignItems: 'center', borderRadius: 20, padding: 20, marginHorizontal: 5, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4}}>
              <View style={{width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}}>
                <Text style={{fontSize: 28}}>⚡</Text>
              </View>
              <Text style={{fontSize: 9, fontWeight: '700', marginBottom: 4, textAlign: 'center', letterSpacing: 1, color: colors.text}}>High Speed</Text>
            </View>
            <View style={{flex: 1, alignItems: 'center', borderRadius: 20, padding: 20, marginHorizontal: 5, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4}}>
              <View style={{width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}}>
                <Text style={{fontSize: 28}}>🛡️</Text>
              </View>
              <Text style={{fontSize: 9, fontWeight: '700', marginBottom: 4, textAlign: 'center', letterSpacing: 1, color: colors.text}}>Secure</Text>
            </View>
            <View style={{flex: 1, alignItems: 'center', borderRadius: 20, padding: 20, marginHorizontal: 5, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4}}>
              <View style={{width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}}>
                <Text style={{fontSize: 28}}>📞</Text>
              </View>
              <Text style={{fontSize: 9, fontWeight: '700', marginBottom: 4, textAlign: 'center', letterSpacing: 1, color: colors.text}}>Support</Text>
            </View>
            <View style={{flex: 1, alignItems: 'center', borderRadius: 20, padding: 20, marginHorizontal: 5, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4}}>
              <View style={{width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}}>
                <Text style={{fontSize: 28}}>🌐</Text>
              </View>
              <Text style={{fontSize: 9, fontWeight: '700', marginBottom: 4, textAlign: 'center', letterSpacing: 1, color: colors.text}}>Reliable</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      <Text style={{textAlign: 'center', color: colors.textSecondary, marginBottom: 16, fontSize: 12}}>
        Version {appVersion} ({buildNumber})
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoSection: {
    marginBottom: 20,
  },
  logo: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  loginInterface: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  formSection: {
    gap: 20,
  },
  inputField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  otpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
  },
  featureIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  featureIcon: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconText: {
    fontSize: 24,
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoginScreen; 