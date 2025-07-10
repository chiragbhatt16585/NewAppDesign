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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {useTranslation} from 'react-i18next';
//import ispLogo from '../assets/isp_logo.png';

const {width: screenWidth} = Dimensions.get('window');

const HomeScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Mock user data - replace with actual API data
  const userData = {
    name: 'Chirag Bhatt',
    planName: 'Premium Fiber 100 Mbps',
    planPrice: '₹999/month',
    dataUsage: '75 GB used of 100 GB',
    validity: '15 days remaining',
    billAmount: '₹999',
    dueDate: '25th July 2024',
  };

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

  const handleAdPress = (ad: any) => {
    Alert.alert('Advertisement', `Opening ${ad.title}...`);
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
      setCurrentAdIndex(viewableItems[0].index);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (currentAdIndex + 1) % advertisements.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentAdIndex(nextIndex);
      }
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [currentAdIndex, advertisements.length]);

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

  const handleContactUs = () => {
    setShowProfileMenu(false);
    navigation.navigate('ContactUs');
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: () => navigation.navigate('Login')}
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../assets/isp_logo.png')} style={{ width: 180, height: 56 }} />
            <TouchableOpacity 
              style={[styles.profileButton, {backgroundColor: colors.accent}]} 
              onPress={handleProfilePress}>
              <Text style={styles.profileText}>CB</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <View style={[styles.profileMenu, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleContactUs}>
              <Text style={styles.menuIcon}>📞</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.contactUs')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, {color: colors.textSecondary}]}>{t('common.welcome')},</Text>
          <Text style={[styles.userName, {color: colors.text}]}>{userData.name}</Text>
        </View>

        {/* Account Summary Card */}
        <View style={[styles.accountCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, {color: colors.text}]}>{t('home.accountSummary')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AccountDetails')}>
              <Text style={[styles.editText, {color: colors.primary}]}>{t('common.viewDetails')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.currentPlan')}</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{userData.planName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.planPrice')}</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{userData.planPrice}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.dataUsage')}</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{userData.dataUsage}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.validity')}</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{userData.validity}</Text>
          </View>
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
              <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>{userData.billAmount}</Text>
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
              onPress={handleContactUs}>
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
          <View style={styles.billDetails}>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, {color: colors.textSecondary}]}>{t('account.currentBill')}</Text>
              <Text style={[styles.billAmount, {color: colors.accent}]}>{userData.billAmount}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, {color: colors.textSecondary}]}>{t('home.dueDate')}</Text>
              <Text style={[styles.billDate, {color: colors.text}]}>{userData.dueDate}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.payNowButton, {backgroundColor: colors.accent}]} 
            onPress={handlePayBill}>
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        </View>

        {/* More Options */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.moreButton, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
            onPress={handleMore}>
            <Text style={[styles.moreButtonText, {color: colors.text}]}>{t('more.title')}</Text>
            <Text style={[styles.arrowText, {color: colors.textSecondary}]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Usage Statistics */}
        <View style={[styles.usageCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.usageTitle, {color: colors.text}]}>Usage Statistics</Text>
          <View style={[styles.usageBar, {backgroundColor: colors.borderLight}]}>
            <View style={[styles.usageProgress, {width: '75%', backgroundColor: colors.primary}]} />
          </View>
          <Text style={[styles.usageText, {color: colors.textSecondary}]}>{userData.dataUsage}</Text>
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
    borderRadius: 12,
    padding: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
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
    height: screenWidth * 0.6, // Reduced height for more compact design
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
  moreButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  moreButtonText: {
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
  usageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  usageBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  usageProgress: {
    height: '100%',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 14,
    textAlign: 'center',
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
});

export default HomeScreen; 