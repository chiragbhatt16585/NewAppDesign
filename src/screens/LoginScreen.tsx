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
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import { useLanguage } from '../utils/LanguageContext';

const {width, height} = Dimensions.get('window');

const LoginScreen = ({navigation}: any) => {
  const {isDark, setThemeMode, themeMode} = useTheme();
  const colors = getThemeColors(isDark);
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  
  // State management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Auth flow states
  const [authType, setAuthType] = useState<'none' | 'password' | 'otp' | 'both'>('none');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [currentStep, setCurrentStep] = useState<'username' | 'auth' | 'both'>('username');

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Reset auth step if username is cleared
  useEffect(() => {
    if (!username.trim()) {
      setCurrentStep('username');
      setShowPasswordInput(false);
      setShowOtpSection(false);
      setAuthType('none');
      setPassword('');
      setOtp('');
    }
  }, [username]);

  const checkExistingSession = async () => {
    try {
      const isLoggedIn = await sessionManager.isLoggedIn();
      if (isLoggedIn) {
        console.log('User is already logged in, navigating to Home');
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

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

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  const checkAuthType = async () => {
    if (!username || username.trim() === '') {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('=== CHECKING AUTH TYPE ===');
      console.log('Username:', username);
      
      // Call API to check auth type
      const response = await apiService.checkAuthType(username.trim());
      
      console.log('=== AUTH TYPE RESPONSE ===');
      console.log('Response:', response);
      
      if (response && response.auth_type) {
        const authTypeValue = response.auth_type.toLowerCase() as 'password' | 'otp' | 'both';
        setAuthType(authTypeValue);
        
        if (authTypeValue === 'password') {
          setShowPasswordInput(true);
          setCurrentStep('auth');
        } else if (authTypeValue === 'otp') {
          setShowOtpSection(true);
          setShowOtpInput(true);
          setCurrentStep('auth');
          // Send OTP automatically
          await sendOtp();
        } else if (authTypeValue === 'both') {
          setCurrentStep('both');
        }
      } else {
        // Fallback: show both options if we can't determine auth type
        setCurrentStep('both');
        setAuthType('password');
        setShowPasswordInput(true);
      }
    } catch (error: any) {
      console.error('=== AUTH TYPE CHECK ERROR ===');
      console.error('Error:', error);
      
      // If we get token expired error, show both options
      if (error.message && error.message.includes('Token Expired')) {
        Alert.alert('Info', 'Please choose your login method');
        setCurrentStep('both');
        setAuthType('password');
        setShowPasswordInput(true);
      } else {
        Alert.alert('Error', error.message || 'Failed to check authentication type. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!username) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('=== SENDING OTP ===');
      console.log('Username:', username);
      
      const response = await apiService.authenticate(username, '', '', 'no', username);
      
      console.log('=== OTP SEND RESPONSE ===');
      console.log('Response:', response);
      
      // Check if OTP was sent successfully - handle both response types
      if (response && (
        (response as any).message === 'OTP Send Successfully...' || 
        (response as any).status === 'ok' ||
        response.token // If we get a token, OTP was successful
      )) {
        setShowOtpInput(true);
        setResendCountdown(30); // Start 30 second countdown
        Alert.alert('Success', 'OTP sent to your registered number');
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('=== OTP SEND ERROR ===');
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      if (currentStep === 'both') {
        // Handle both password and OTP login
        if (!password && !otp) {
          Alert.alert('Error', 'Please enter either password or OTP');
          setIsLoading(false);
          return;
        }
        
        if (password) {
          // Password login
          console.log('=== PASSWORD LOGIN ATTEMPT ===');
          const response = await apiService.authenticate(username, password);
          
          if (response && response.token) {
            await sessionManager.createSession(username, response.token);
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('Home');
            return;
          }
        }
        
        if (otp) {
          // OTP login
          console.log('=== OTP LOGIN ATTEMPT ===');
          const response = await apiService.authenticate(username, '', otp, 'no', username);
          
          if (response && response.token) {
            await sessionManager.createSession(username, response.token);
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('Home');
            return;
          }
        }
        
        Alert.alert('Error', 'Login failed. Please check your credentials.');
      } else {
        // Single auth type login
        if (authType === 'password') {
          if (!password) {
            Alert.alert('Error', 'Please enter your password');
            setIsLoading(false);
            return;
          }
          
          console.log('=== PASSWORD LOGIN ATTEMPT ===');
          const response = await apiService.authenticate(username, password);
          
          if (response && response.token) {
            await sessionManager.createSession(username, response.token);
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('Home');
          } else {
            Alert.alert('Error', 'Login failed. Please check your credentials.');
          }
        } else if (authType === 'otp') {
          if (!otp) {
            Alert.alert('Error', 'Please enter OTP');
            setIsLoading(false);
            return;
          }
          
          console.log('=== OTP LOGIN ATTEMPT ===');
          const response = await apiService.authenticate(username, '', otp, 'no', username);
          
          if (response && response.token) {
            await sessionManager.createSession(username, response.token);
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('Home');
          } else {
            Alert.alert('Error', 'Invalid OTP. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoadingSpinner = () => (
    <View style={styles.spinnerContainer}>
      <View style={styles.spinner} />
    </View>
  );

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  // Language cycling handler
  const handleLanguageChange = () => {
    const currentIdx = availableLanguages.findIndex(l => l.code === currentLanguage);
    const nextIdx = (currentIdx + 1) % availableLanguages.length;
    changeLanguage(availableLanguages[nextIdx].code);
  };

  // Language icon handler: navigate to Language screen
  const handleLanguageIconPress = () => {
    navigation.navigate('Language');
  };

  // Theme toggle handler
  const handleThemeToggle = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        
        <View style={styles.mainContainer}>
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
              <Image source={require('../assets/isp_logo.png')} style={[{ width: 180, height: 60 }, styles.logo]} />
            </View>
            <Text style={[styles.title, {color: colors.text}]}>Microscan Internet Private Limited</Text>
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
            
            {/* Username Input - Always shown first */}
            <View style={styles.formSection}>
              <View style={styles.inputField}>
                {/* <Text style={[styles.fieldLabel, {color: colors.text}]}>
                  Username
                </Text> */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                      flex: 1,
                    }]}
                    placeholder="Enter your username"
                    placeholderTextColor={colors.textTertiary}
                    value={username}
                    onChangeText={setUsername}
                    autoComplete="off"
                    importantForAutofill="no"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {currentStep === 'username' && (
                    <TouchableOpacity
                      style={[styles.checkButton, {backgroundColor: colors.primary}]}
                      onPress={checkAuthType}
                      disabled={isLoading || !username.trim()}>
                      <Text style={styles.checkButtonText}>▶</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Password Input - Show when auth type is password */}
              {showPasswordInput && currentStep !== 'username' && (
                <View style={styles.inputField}>
                  {/* <Text style={[styles.fieldLabel, {color: colors.text}]}>
                    Password
                  </Text> */}
                  <View style={styles.inputContainer}>
                    <View style={{flex: 1, position: 'relative', height: 60}}>
                      <TextInput
                        style={[styles.passwordInput, {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                          color: colors.text,
                        }]}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}>
                        <Text style={[styles.eyeIcon, {color: colors.textSecondary}]}>
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* OTP Input - Show when auth type is OTP */}
              {showOtpSection && currentStep !== 'username' && (
                <View style={styles.inputField}>
                  {/* <Text style={[styles.fieldLabel, {color: colors.text}]}>
                    OTP
                  </Text> */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.textInput, {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                        flex: 1,
                      }]}
                      placeholder="Enter OTP"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.resendButton, 
                      {borderColor: colors.primary},
                      resendCountdown > 0 && {borderColor: colors.textTertiary}
                    ]}
                    onPress={sendOtp}
                    disabled={isLoading || resendCountdown > 0}>
                    <Text style={[
                      styles.resendButtonText, 
                      {color: resendCountdown > 0 ? colors.textTertiary : colors.primary}
                    ]}>
                      {resendCountdown > 0 ? `${resendCountdown}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Both Options - Show when auth type is both */}
              {currentStep === 'both' && username.trim() && (
                <View>
                  <View style={styles.tabNavigation}>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        authType === 'password' && [styles.activeTabButton, {backgroundColor: colors.primary}],
                      ]}
                      onPress={() => {
                        setAuthType('password');
                        setShowPasswordInput(true);
                        setShowOtpSection(false);
                      }}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          {color: colors.textSecondary},
                          authType === 'password' && styles.activeTabButtonText,
                        ]}>
                        Password Login
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        authType === 'otp' && [styles.activeTabButton, {backgroundColor: colors.primary}],
                      ]}
                      onPress={() => {
                        setAuthType('otp');
                        setShowOtpSection(true);
                        setShowPasswordInput(false);
                        sendOtp();
                      }}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          {color: colors.textSecondary},
                          authType === 'otp' && styles.activeTabButtonText,
                        ]}>
                        OTP Login
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {authType === 'password' && (
                    <View style={styles.inputField}>
                      <Text style={[styles.fieldLabel, {color: colors.text}]}>
                        Password
                      </Text>
                      <View style={styles.inputContainer}>
                        <View style={{flex: 1, position: 'relative', height: 60}}>
                          <TextInput
                            style={[styles.passwordInput, {
                              borderColor: colors.border,
                              backgroundColor: colors.surface,
                              color: colors.text,
                            }]}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.textTertiary}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                          />
                          <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}>
                            <Text style={[styles.eyeIcon, {color: colors.textSecondary}]}>
                              {showPassword ? '👁️' : '👁️‍🗨️'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}

                  {authType === 'otp' && (
                    <View style={styles.inputField}>
                      {/* <Text style={[styles.fieldLabel, {color: colors.text}]}>
                        OTP
                      </Text> */}
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.textInput, {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            flex: 1,
                          }]}
                          placeholder="Enter OTP"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="number-pad"
                          value={otp}
                          onChangeText={setOtp}
                        />
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.resendButton, 
                          {borderColor: colors.primary},
                          resendCountdown > 0 && {borderColor: colors.textTertiary}
                        ]}
                        onPress={sendOtp}
                        disabled={isLoading || resendCountdown > 0}>
                        <Text style={[
                          styles.resendButtonText, 
                          {color: resendCountdown > 0 ? colors.textTertiary : colors.primary}
                        ]}>
                          {resendCountdown > 0 ? `${resendCountdown}s` : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Login Button - Show when auth type is determined */}
              {(showPasswordInput || showOtpSection || currentStep === 'both') && currentStep !== 'username' && (
                <>
                  <TouchableOpacity
                    style={[styles.loginButton, {backgroundColor: colors.primary}]}
                    onPress={handleLogin}
                    disabled={isLoading}>
                    {isLoading ? (
                      renderLoadingSpinner()
                    ) : (
                      <Text style={styles.loginButtonText}>
                        Login
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
          
          {/* Features Display - Compact Style */}
          <View style={styles.featuresContainer}>
            <View style={[styles.featureCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[styles.featureIcon, {backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}]}>
                <Text style={styles.featureEmoji}>⚡</Text>
              </View>
              <Text style={[styles.featureText, {color: colors.text}]}>High Speed</Text>
            </View>
            <View style={[styles.featureCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[styles.featureIcon, {backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}]}>
                <Text style={styles.featureEmoji}>🛡️</Text>
              </View>
              <Text style={[styles.featureText, {color: colors.text}]}>Secure</Text>
            </View>
            <View style={[styles.featureCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[styles.featureIcon, {backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}]}>
                <Text style={styles.featureEmoji}>📞</Text>
              </View>
              <Text style={[styles.featureText, {color: colors.text}]}>Support</Text>
            </View>
            <View style={[styles.featureCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <View style={[styles.featureIcon, {backgroundColor: isDark ? 'rgba(255, 0, 128, 0.2)' : '#f0f9ff'}]}>
                <Text style={styles.featureEmoji}>🌐</Text>
              </View>
              <Text style={[styles.featureText, {color: colors.text}]}>Reliable</Text>
            </View>
          </View>

          {/* Language & Theme Row (moved here) */}
          <View style={{ width: '100%', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={handleLanguageIconPress} accessibilityLabel="Change Language">
                <Text style={{ fontSize: 22 }} role="img" aria-label="language">🌐</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleThemeToggle} accessibilityLabel="Toggle Theme">
                <Text style={{ fontSize: 22 }} role="img" aria-label="theme">{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Version Info */}
          <Text style={[styles.versionText, {color: colors.textSecondary}]}>
            Version {appVersion} ({buildNumber})
          </Text>
        </View>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoSection: {
    marginBottom: 15,
  },
  logo: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  loginInterface: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 600,
  },
  formSection: {
    gap: 16,
    width: '100%',
  },
  inputField: {
    gap: 6,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    height: 60,
    flex: 1,
    minWidth: 200,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 60, // Extra padding for eye icon
    paddingVertical: 16,
    fontSize: 16,
    height: 60,
    flex: 1,
    minWidth: 200,
  },
  checkButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  resendContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  resendButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabNavigation: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
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
  loginButton: {
    borderRadius: 12,
    paddingVertical: 14,
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
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 12,
    marginTop: 15,
  },
});

export default LoginScreen; 