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
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import { useAuth } from '../utils/AuthContext';
import DeviceInfo from 'react-native-device-info';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import { useLanguage } from '../utils/LanguageContext';
import clientStrings from '../config/client-strings.json';

const {width, height} = Dimensions.get('window');

const LoginScreen = ({navigation}: any) => {
  const {isDark, setThemeMode, themeMode} = useTheme();
  const colors = getThemeColors(isDark);
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { login, loginWithOtp } = useAuth();
  
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
  
  // Validation states
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  
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
      setUsernameError(false);
      setPasswordError(false);
      setOtpError(false);
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
      setUsernameError(true);
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    
    setUsernameError(false);

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
    if (!username || username.trim() === '') {
      setUsernameError(true);
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    
    setUsernameError(false);
    
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

  const validateForm = () => {
    let isValid = true;
    
    // Validate username
    if (!username || username.trim() === '') {
      setUsernameError(true);
      isValid = false;
    } else {
      setUsernameError(false);
    }
    
    // Validate password if password auth is active
    if (authType === 'password') {
      if (!password || password.trim() === '') {
        setPasswordError(true);
        isValid = false;
      } else {
        setPasswordError(false);
      }
    }
    
    // Validate OTP if OTP auth is active
    if (authType === 'otp') {
      if (!otp || otp.trim() === '') {
        setOtpError(true);
        isValid = false;
      } else {
        setOtpError(false);
      }
    }
    
    // For both auth type, check if at least one field is filled
    if (currentStep === 'both') {
      if ((!password || password.trim() === '') && (!otp || otp.trim() === '')) {
        setPasswordError(true);
        setOtpError(true);
        isValid = false;
      } else {
        setPasswordError(false);
        setOtpError(false);
      }
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (currentStep === 'both') {
        // Handle both password and OTP login
        if (!password && !otp) {
          setPasswordError(true);
          setOtpError(true);
          Alert.alert('Error', 'Please enter either password or OTP');
          setIsLoading(false);
          return;
        }
        
        // Clear errors when user starts typing
        if (password) setPasswordError(false);
        if (otp) setOtpError(false);
        
        if (password) {
          // Password login
          console.log('=== PASSWORD LOGIN ATTEMPT ===');
          const success = await login(username, password);
          
          if (success) {
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('Home');
            return;
          }
        }
        
        if (otp) {
          // OTP login
          console.log('=== OTP LOGIN ATTEMPT ===');
          const success = await loginWithOtp(username, otp);
          
          if (success) {
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('Home');
            return;
          }
        }
        
        Alert.alert('Error', 'Login failed. Please check your credentials.');
      } else {
        // Single auth type login
        if (authType === 'password') {
          if (!password || password.trim() === '') {
            setPasswordError(true);
            Alert.alert('Error', 'Please enter your password');
            setIsLoading(false);
            return;
          }
          
          setPasswordError(false);
          
          console.log('=== PASSWORD LOGIN ATTEMPT ===');
          console.log('Username:', username);
          console.log('Password length:', password.length);
          
          const success = await login(username, password);
          
          if (success) {
            console.log('=== LOGIN SUCCESS ===');
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('Home');
          } else {
            console.log('=== LOGIN FAILED ===');
            Alert.alert('Error', 'Login failed. Please check your credentials.');
          }
        } else if (authType === 'otp') {
          if (!otp || otp.trim() === '') {
            setOtpError(true);
            Alert.alert('Error', 'Please enter OTP');
            setIsLoading(false);
            return;
          }
          
          setOtpError(false);
          
          console.log('=== OTP LOGIN ATTEMPT ===');
          const success = await loginWithOtp(username, otp);
          
          if (success) {
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

  // Open Spacecom website
  const handleSpacecomWebsite = async () => {
    try {
      const url = 'https://spacecom.in/';
      
      // Try to open URL directly without canOpenURL check
      // This works better on iOS and Android
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open website:', error);
      Alert.alert('Error', 'Failed to open website. Please try again.');
    }
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
              <LogoImage type="login" />
            </View>
            <Text style={[styles.title, {color: colors.text}]}>{clientStrings.company_name}</Text>
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
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, {
                      borderColor: usernameError ? '#EF4444' : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                      flex: 1,
                    }]}
                    placeholder="Enter your username"
                    placeholderTextColor={colors.textTertiary}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (text.trim()) setUsernameError(false);
                    }}
                    autoComplete="off"
                    importantForAutofill="no"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {currentStep === 'username' && (
                    <TouchableOpacity
                      style={[
                        styles.checkButton, 
                        {
                          backgroundColor: username.trim() ? colors.primary : colors.textTertiary
                        }
                      ]}
                      onPress={checkAuthType}
                      disabled={isLoading}>
                      <Text style={styles.checkButtonText}>▶</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {usernameError && (
                  <Text style={[styles.errorText, {color: '#EF4444'}]}>
                    Please enter your username
                  </Text>
                )}
              </View>

              {/* Password Input - Show when auth type is password */}
              {showPasswordInput && currentStep !== 'username' && (
                <View style={styles.inputField}>
                  <View style={styles.inputContainer}>
                    <View style={{flex: 1, position: 'relative', height: 60}}>
                      <TextInput
                        style={[styles.passwordInput, {
                          borderColor: passwordError ? '#EF4444' : colors.border,
                          backgroundColor: colors.surface,
                          color: colors.text,
                        }]}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (text.trim()) setPasswordError(false);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}>
                        <Text style={[styles.eyeIcon, {color: colors.textSecondary}]}> {showPassword ? '👁️' : '👁️‍🗨️'} </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {passwordError && (
                    <Text style={[styles.errorText, {color: '#EF4444'}]}>
                      Please enter your password
                    </Text>
                  )}
                </View>
              )}

              {/* OTP Input - Show when auth type is OTP */}
              {showOtpSection && currentStep !== 'username' && (
                <View style={styles.inputField}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.textInput, {
                        borderColor: otpError ? '#EF4444' : colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                        flex: 1,
                      }]}
                      placeholder="Enter OTP"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text);
                        if (text.trim()) setOtpError(false);
                      }}
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
                  {otpError && (
                    <Text style={[styles.errorText, {color: '#EF4444'}]}>
                      Please enter OTP
                    </Text>
                  )}
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
                      <Text style={[styles.fieldLabel, {color: colors.text}]}>Password</Text>
                      <View style={styles.inputContainer}>
                        <View style={{flex: 1, position: 'relative', height: 60}}>
                          <TextInput
                            style={[styles.passwordInput, {
                              borderColor: passwordError ? '#EF4444' : colors.border,
                              backgroundColor: colors.surface,
                              color: colors.text,
                            }]}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.textTertiary}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              if (text.trim()) setPasswordError(false);
                            }}
                          />
                          <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}>
                            <Text style={[styles.eyeIcon, {color: colors.textSecondary}]}> {showPassword ? '👁️' : '👁️‍🗨️'} </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {passwordError && (
                        <Text style={[styles.errorText, {color: '#EF4444'}]}>
                          Please enter your password
                        </Text>
                      )}
                    </View>
                  )}

                  {authType === 'otp' && (
                    <View style={styles.inputField}>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.textInput, {
                            borderColor: otpError ? '#EF4444' : colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            flex: 1,
                          }]}
                          placeholder="Enter OTP"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="number-pad"
                          value={otp}
                          onChangeText={(text) => {
                            setOtp(text);
                            if (text.trim()) setOtpError(false);
                          }}
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
                      {otpError && (
                        <Text style={[styles.errorText, {color: '#EF4444'}]}>
                          Please enter OTP
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Login Button - Show when auth type is determined */}
              {(showPasswordInput || showOtpSection || currentStep === 'both') && currentStep !== 'username' && (
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

          {/* Powered By Info */}
          <Text style={[styles.poweredByText, {color: colors.textSecondary}]}> 
            Powered By{"\n"}
            <Text  
              style={[styles.companyLink, {color: colors.primary}]} 
              onPress={handleSpacecomWebsite} 
            > 
              Spacecom Software LLP 
            </Text> 
          </Text>
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
    marginBottom: 16,
  },
  logoSection: {
    marginBottom: 0,
  },
  logo: {
    marginBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
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
  poweredByText: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  companyLink: {
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default LoginScreen; 