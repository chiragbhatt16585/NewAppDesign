import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Image,
  Dimensions,
  FlatList,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../utils/AuthContext';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import {useSessionValidation} from '../utils/useSessionValidation';
//import ispLogo from '../assets/isp_logo.png';

const {width: screenWidth} = Dimensions.get('window');

const HomeScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentAdIndexRef = useRef(0); // Use ref to track current index without re-renders
  const {logout} = useAuth();
  const {checkSessionAndHandle} = useSessionValidation();

  // State for API data
  const [authData, setAuthData] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiResponse, setApiResponse] = useState<string>('');

  // Component rendering indicator (removed to prevent spam)



  // Mock advertisement data
  const advertisements = [
    {
      id: '1',
      image: require('../assets/1st-slide-desk.webp'),
      // title: 'First time in GOA',
      // subtitle: 'Experience blazing fast connectivity',
      backgroundColor: 'rgba(26, 115, 232, 0.8)',
    },
    {
      id: '2',
      image: require('../assets/DNA3.jpg'),
      // title: 'Advanced Technology',
      // subtitle: 'Cutting-edge network solutions',
      backgroundColor: 'rgba(220, 53, 69, 0.8)',
    },
    {
      id: '3',
      image: require('../assets/Group-60974.webp'),
      // title: 'Premium Service',
      // subtitle: 'Unmatched quality and reliability',
      backgroundColor: 'rgba(40, 167, 69, 0.8)',
    },
  ];

  // API call to fetch account summary and usage data
  useEffect(() => {
    //console.warn('=== HOMESCREEN MOUNTED ===');
    //Alert.alert('HomeScreen', 'Component mounted');
    fetchAccountData();
  }, []);

  // Handle back button press - exit app instead of going back to login
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      
      // Check session validity before making API call
      const isSessionValid = await checkSessionAndHandle(navigation);
      if (!isSessionValid) {
        // Don't return immediately, let the API call handle token regeneration
        // Session validation failed, but continuing with API call
      }
      
      // Get current session data
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { username, token } = session;

      // Call the authUser API to get user's account information
      const authResponse = await apiService.authUser(username, token);
      
      // console.warn('=== AUTH USER API RESPONSE ===');
      // console.warn('Full Response:', JSON.stringify(authResponse, null, 2));
      // console.warn('Response Type:', typeof authResponse);
      // console.warn('Is Array:', Array.isArray(authResponse));
      // console.warn('Keys:', authResponse ? Object.keys(authResponse) : 'No response');
      
      // Display response on screen and in alert
      const responseString = JSON.stringify(authResponse, null, 2);
      setApiResponse(responseString);
      //Alert.alert('API Response', `Response received: ${responseString.substring(0, 200)}...`);
      
      if (authResponse) {
        // console.warn('=== RESPONSE DETAILS ===');
        // console.warn('First Name:', authResponse.firstname);
        // console.warn('Last Name:', authResponse.lastname);
        // console.warn('Current Plan:', authResponse.currentPlan);
        // console.warn('Account Status:', authResponse.accountStatus);
        // console.warn('Data Allotted:', authResponse.dataAllotted);
        // console.warn('Data Used:', authResponse.dataUsed);
        // console.warn('Days Allotted:', authResponse.daysAllotted);
        // console.warn('Days Used:', authResponse.daysUsed);
        // console.warn('Login Status:', authResponse.loginStatus);
        // console.warn('Plan Price:', authResponse.planPrice);
        // console.warn('Plan Duration:', authResponse.planDuration);
        // console.warn('Expiry Date:', authResponse.expiryDateString);
        // console.warn('Last Renew Date:', authResponse.lastRenewDateString);
        // console.warn('Creation Date:', authResponse.creationDateString);
        // console.warn('Disable Time:', authResponse.disableTime);
        
        // // Log all available keys for reference
        // console.warn('=== ALL AVAILABLE KEYS ===');
        // Object.keys(authResponse).forEach(key => {
        //   console.warn(`${key}:`, authResponse[key]);
        // });

        setAuthData(authResponse);
        
        // Extract plan details from auth response
        if (authResponse.currentPlan) {
          setPlanDetails({
            name: authResponse.currentPlan,
            price: authResponse.planPrice || '₹999',
            duration: authResponse.planDuration || '30 days',
            dataLimit: authResponse.dataAllotted || '100 GB',
          });
        }
        
        //Alert.alert('Success', 'Account data loaded successfully!');
      } else {
        //console.warn('No auth response received');
        //Alert.alert('No Response', 'No auth response received from API');
      }
    } catch (error: any) {
      //console.error('=== ERROR FETCHING ACCOUNT DATA ===');
      //console.error('Error:', error);
      //console.error('Error Message:', error.message);
      //console.error('Error Stack:', error.stack);
      //Alert.alert('Error', `Failed to load account data: ${error.message}`);
    } finally {
      //console.warn('Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleAdPress = (ad: any) => {
    //Alert.alert('Advertisement', `Opening ${ad.title}...`);
  };

  const renderAdItem = ({item}: {item: any}) => (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => handleAdPress(item)}
      activeOpacity={0.8}>
      <Image source={item.image} style={styles.adImage} />
      {(item.title || item.subtitle) && (
        <View style={[styles.adOverlay, {backgroundColor: item.backgroundColor}]}>
          {item.title && <Text style={styles.adTitle}>{item.title}</Text>}
          {item.subtitle && <Text style={styles.adSubtitle}>{item.subtitle}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAdDot = (index: number) => (
    <View
      key={index}
      style={[
        styles.adDot,
        {backgroundColor: index === currentAdIndex ? colors.primary : colors.borderLight},
      ]}
    />
  );

  const onAdViewableItemsChanged = ({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      currentAdIndexRef.current = newIndex;
      setCurrentAdIndex(newIndex);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (currentAdIndexRef.current + 1) % advertisements.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        currentAdIndexRef.current = nextIndex;
        setCurrentAdIndex(nextIndex);
      }
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array to prevent infinite re-renders

  const handleRenew = () => {
    navigation.navigate('RenewPlan');
  };

  const handlePayBill = () => {
    navigation.navigate('PayBill');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Opening support chat...');
  };

  const handleMore = () => {
    navigation.navigate('MoreOptions');
  };

  const handleProfilePress = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleMoreOptions = () => {
    setShowProfileMenu(false);
    navigation.navigate('MoreOptions');
  };

  const handleContactUs = () => {
    setShowProfileMenu(false);
    navigation.navigate('ContactUs');
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await logout();
            navigation.navigate('Login');
          } catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, navigate to login
            navigation.navigate('Login');
          }
        }
      }
    ]);
  };

  // Calculate usage percentages
  const dataFill = authData?.usage_details?.[0]?.plan_data === 'Unlimited' ? 50 : 
    authData?.usage_details?.[0] ? (parseFloat(authData.usage_details[0].data_used) / (1024 * 1024 * 1024) / 100 * 100) : 0;
  const daysFill = authData?.usage_details?.[0]?.plan_days === 'Unlimited' ? 50 : 
    authData?.usage_details?.[0] ? (parseFloat(authData.usage_details[0].days_used) / parseFloat(authData.usage_details[0].plan_days) * 100) : 0;

  // Loading spinner component
  const LoadingSpinner = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading account data...</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LogoImage type="header" />
          </View>
          <View style={styles.headerRight}>
            
            <TouchableOpacity 
              style={[styles.profileButton, {backgroundColor: colors.accent}]} 
              onPress={handleProfilePress}>
              <Text style={styles.profileText}>
                {authData ? `${authData.first_name?.[0] || ''}${authData.last_name?.[0] || ''}` : 'CB'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <View style={[styles.profileMenu, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleMoreOptions}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>⋮</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>More Options</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleContactUs}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>📞</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.contactUs')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleLogout}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🚪</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, {color: colors.textSecondary}]}>{t('common.welcome')},</Text>
          <Text style={[styles.userName, {color: colors.text}]}>
            {authData ? `${authData.first_name || ''} ${authData.last_name || ''}`.trim() || 'User' : 'User'}
          </Text>
        </View>

        {/* Account Summary Card */}
        <View style={[styles.accountCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, {color: colors.text}]}>{t('home.accountSummary')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AccountDetails')}>
              <Text style={[styles.editText, {color: colors.primary}]}>{t('common.viewDetails')}</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.currentPlan')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>
                  {authData?.current_plan || 'No Plan'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.validity')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>
                  {authData?.usage_details?.[0] ? 
                    `${authData.usage_details[0].days_used} used of ${authData.usage_details[0].plan_days} days` : 
                    'No data available'}
                </Text>
              </View>

              {/* Account Status */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Account Status</Text>
                <Text style={[styles.detailValue, {color: authData?.user_status === 'active' ? '#4CAF50' : '#F44336'}]}>
                  {authData?.user_status?.replace(/_+/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Active'}
                </Text>
              </View>

              {/* Login Status */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Login Status</Text>
                <Text style={[styles.detailValue, {color: authData?.login_status === 'IN' ? '#4CAF50' : '#F44336'}]}>
                  {authData?.login_status === 'IN' ? 'Online' : 'Offline'}
                </Text>
              </View>
            </>
          )}

          

          {/* Renewal Count */}
          {/* <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Renewal Count</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>
              {authData?.renewal_count || '0'}
            </Text>
          </View> */}

          {/* Connection Type */}
          {/* <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Connection Type</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>
              {authData?.connection_type || 'N/A'}
            </Text>
          </View> */}

          {/* User Profile */}
          {/* <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>User Profile</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>
              {authData?.user_profile || 'N/A'}
            </Text>
          </View> */}
        </View>

        {/* Advertisement Carousel */}
        <View style={styles.adCarouselSection}>
          <FlatList
            ref={flatListRef}
            data={advertisements}
            renderItem={renderAdItem}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onAdViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
          <View style={styles.adDots}>
            {advertisements.map((_, index) => renderAdDot(index))}
          </View>
        </View>

        {/* Quick Menu Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('home.quickMenu')}</Text>
          <View style={[styles.quickMenuRow, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <TouchableOpacity 
              style={styles.quickMenuRowItem} 
              onPress={() => navigation.navigate('AccountDetails')}>
              <Text style={styles.quickMenuRowIcon}>👤</Text>
              <Text style={[styles.quickMenuRowTitle, {color: colors.text}]}>{t('navigation.account')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickMenuRowItem} onPress={() => navigation.navigate('Sessions')}>
              <Text style={styles.quickMenuRowIcon}>📊</Text>
              <Text style={[styles.quickMenuRowTitle, {color: colors.text}]}>{t('navigation.sessions')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickMenuRowItem} onPress={() => navigation.navigate('Tickets')}>
              <Text style={styles.quickMenuRowIcon}>📋</Text>
              <Text style={[styles.quickMenuRowTitle, {color: colors.text}]}>{t('navigation.tickets')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickMenuRowItem} onPress={() => navigation.navigate('Ledger')}>
              <Text style={styles.quickMenuRowIcon}>📄</Text>
              <Text style={[styles.quickMenuRowTitle, {color: colors.text}]}>{t('navigation.ledger')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('home.quickActions')}</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
              onPress={handleRenew}>
              <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}>
                <Text style={styles.iconText}>🔄</Text>
              </View>
              <Text style={[styles.actionTitle, {color: colors.text}]}>{t('home.renewPlan')}</Text>
              <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Extend your plan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
              onPress={handlePayBill}>
              <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}>
                <Text style={styles.iconText}>💳</Text>
              </View>
              <Text style={[styles.actionTitle, {color: colors.text}]}>{t('home.payBill')}</Text>
              <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>₹{authData?.payment_dues || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
              onPress={handleSupport}>
              <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}>
                <Text style={styles.iconText}>🆘</Text>
              </View>
              <Text style={[styles.actionTitle, {color: colors.text}]}>{t('home.support')}</Text>
              <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Get help</Text>
            </TouchableOpacity>



            <TouchableOpacity 
              style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
              onPress={() => navigation.navigate('ContactUs')}>
              <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}>
                <Text style={styles.iconText}>📞</Text>
              </View>
              <Text style={[styles.actionTitle, {color: colors.text}]}>{t('common.contactUs')}</Text>
              <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Reach out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Information */}
        <View style={[styles.billCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.billTitle, {color: colors.text}]}>{t('account.billingInfo')}</Text>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <View style={styles.billDetails}>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Account Number</Text>
                  <Text style={[styles.billAmount, {color: colors.accent}]}>{authData?.account_no || 'N/A'}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Renewal Date</Text>
                  <Text style={[styles.billDate, {color: colors.text}]}>{authData?.renew_date || 'N/A'}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Expiry Date</Text>
                  <Text style={[styles.billDate, {color: colors.text}]}>{authData?.exp_date || 'N/A'}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Next Renewal</Text>
                  <Text style={[styles.billDate, {color: colors.text}]}>{authData?.next_renewal_date || 'N/A'}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Payment Dues</Text>
                  <Text style={[styles.billAmount, {color: authData?.payment_dues > 0 ? '#F44336' : '#4CAF50'}]}>
                    ₹{authData?.payment_dues || 0}
                  </Text>
                </View>
              </View>
              {/* Only show Pay Now button if there are payment dues */}
              {authData?.payment_dues > 0 && (
                <TouchableOpacity 
                  style={[styles.payNowButton, {backgroundColor: colors.accent}]} 
                  onPress={handlePayBill}>
                  <Text style={styles.payNowText}>Pay Now</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* More Options
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.moreButton, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
            onPress={handleMore}>
            <Text style={[styles.moreButtonText, {color: colors.text}]}>{t('more.title')}</Text>
            <Text style={[styles.arrowText, {color: colors.textSecondary}]}>›</Text>
          </TouchableOpacity>
        </View> */}

        {/* Usage Statistics */}
        <View style={[styles.usageCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.usageHeader}>
            <Text style={[styles.usageTitle, {color: colors.text}]}>Usage Statistics</Text>
            <View style={[styles.usageBadge, {backgroundColor: colors.primaryLight}]}>
              <Text style={[styles.usageBadgeText, {color: colors.primary}]}>Live</Text>
            </View>
          </View>
          
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Data Usage Section */}
              <View style={styles.dataUsageSection}>
                <View style={styles.dataUsageHeader}>
                  <Text style={[styles.dataUsageLabel, {color: colors.textSecondary}]}>Data Usage</Text>
                  <Text style={[styles.dataUsageValue, {color: colors.text}]}>
                    {authData?.usage_details?.[0] ? 
                      `${(parseFloat(authData.usage_details[0].data_used) / (1024 * 1024 * 1024)).toFixed(2)} GB` : 
                      '0 GB'}
                  </Text>
                </View>
                <View style={[styles.dataUsageBar, {backgroundColor: colors.borderLight}]}>
                  <View style={[styles.dataUsageProgress, {width: `${dataFill}%`, backgroundColor: colors.primary}]} />
                </View>
                <Text style={[styles.dataUsageTotal, {color: colors.textSecondary}]}>
                  of {authData?.usage_details?.[0]?.plan_data || 'Unlimited'}
                </Text>
              </View>
              
              {/* Usage Stats Row */}
              <View style={styles.usageStatsRow}>
                <View style={styles.usageStat}>
                  <Text style={[styles.usageStatIcon, {color: colors.primary}]}>⏱️</Text>
                  <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Hours Used</Text>
                  <Text style={[styles.usageStatValue, {color: colors.text}]}>
                    {authData?.usage_details[0]?.hours_used || '0:00:00'}
                  </Text>
                </View>
                
                <View style={styles.usageStat}>
                  <Text style={[styles.usageStatIcon, {color: colors.success}]}>📅</Text>
                  <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Days Remaining</Text>
                  <Text style={[styles.usageStatValue, {color: colors.text}]}>
                    {authData?.usage_details?.[0] ? 
                      `${parseInt(authData.usage_details[0].plan_days) - parseInt(authData.usage_details[0].days_used)}` : 
                      '0'}
                  </Text>
                </View>
                
                {authData?.usage_details?.[0]?.plan_data !== 'Unlimited' && (
                  <View style={styles.usageStat}>
                    <Text style={[styles.usageStatIcon, {color: colors.accent}]}>📊</Text>
                    <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Usage %</Text>
                    <Text style={[styles.usageStatValue, {color: colors.text}]}>
                      {Math.round(dataFill)}%
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionText: {
    fontSize: 18,
  },
  profileMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 2,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logo: {
    marginRight: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  accountCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  adCarouselSection: {
    height: screenWidth * 0.4, // Reduced height for more compact design
    marginHorizontal: 20,
    marginBottom: 20,
  },
  adCard: {
    width: screenWidth - 40, // Account for horizontal margins
    height: '100%',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  adOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    padding: 10,
    borderRadius: 8,
  },
  adTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  adSubtitle: {
    color: '#fff',
    fontSize: 10,
  },
  adDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  adDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  billCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  billDetails: {
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  billLabel: {
    fontSize: 14,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  billDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  payNowButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  arrowText: {
    fontSize: 20,
  },
  usageCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  usageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  usageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dataUsageSection: {
    marginBottom: 20,
  },
  dataUsageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataUsageLabel: {
    fontSize: 14,
  },
  dataUsageValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dataUsageBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  dataUsageProgress: {
    height: '100%',
    borderRadius: 4,
  },
  dataUsageTotal: {
    fontSize: 12,
    textAlign: 'right',
  },
  usageStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageStat: {
    alignItems: 'center',
    flex: 1,
  },
  usageStatIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  usageStatLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  usageStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  usageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  usageLabel: {
    fontSize: 14,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickMenuItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickMenuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickMenuIconText: {
    fontSize: 24,
  },
  quickMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickMenuRowItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickMenuRowIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickMenuRowTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  testButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  apiResponseCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  apiResponseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  apiResponseScroll: {
    maxHeight: 200, // Limit height for scrolling
  },
  apiResponseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default HomeScreen; 