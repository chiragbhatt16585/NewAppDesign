import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AccountDetailsScreen from '../screens/AccountDetailsScreen';
import PayBillScreen from '../screens/PayBillScreen';
import RenewPlanScreen from '../screens/RenewPlanScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import UsageDetailsScreen from '../screens/UsageDetailsScreen';
import TicketsScreen from '../screens/TicketsScreen';
import MoreOptionsScreen from '../screens/MoreOptionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import KYCScreen from '../screens/KYCScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import UpdateSSIDScreen from '../screens/UpdateSSIDScreen';
import OffersScreen from '../screens/OffersScreen';
import PartnerAppsScreen from '../screens/PartnerAppsScreen';
import WebViewScreen from '../screens/WebViewScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
    <Stack.Screen name="PayBill" component={PayBillScreen} />
    <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    <Stack.Screen name="UsageDetails" component={UsageDetailsScreen} />
  </Stack.Navigator>
);

const SupportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tickets" component={TicketsScreen} />
  </Stack.Navigator>
);

const MenuStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MoreOptions" component={MoreOptionsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Language" component={LanguageScreen} />
    <Stack.Screen name="KYC" component={KYCScreen} />
    <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    <Stack.Screen name="UpdateSSID" component={UpdateSSIDScreen} />
    <Stack.Screen name="Offers" component={OffersScreen} />
    <Stack.Screen name="PartnerApps" component={PartnerAppsScreen} />
  </Stack.Navigator>
);

const SpeedTestStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SpeedTestWeb" component={WebViewScreen} initialParams={{ url: 'https://www.speedtest.net', title: 'Speed Test' }} />
  </Stack.Navigator>
);

const MainTabs = React.memo(() => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  }), [colors.primary, colors.textSecondary, colors.surface, colors.border]);

  const getTabBarIcon = (routeName: string) => ({ color, size }: { color: string; size: number }) => {
    const map: Record<string, string> = {
      Home: 'home',
      Pay: 'credit-card',
      SpeedTest: 'activity',
      Support: 'help-circle',
      Menu: 'menu',
    };
    const name = map[routeName] || 'circle';
    return <Feather name={name} size={size} color={color} />;
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ title: 'Home', tabBarIcon: getTabBarIcon('Home') }} 
      />
      <Tab.Screen 
        name="Pay" 
        component={RenewPlanScreen} 
        options={{ title: 'Recharge', tabBarIcon: getTabBarIcon('Pay') }} 
      />
      <Tab.Screen 
        name="SpeedTest" 
        component={SpeedTestStack} 
        options={{ title: 'Speed Test', tabBarIcon: getTabBarIcon('SpeedTest') }} 
      />
      <Tab.Screen 
        name="Support" 
        component={SupportStack} 
        options={{ title: 'Support', tabBarIcon: getTabBarIcon('Support') }} 
      />
      <Tab.Screen 
        name="Menu" 
        component={MenuStack} 
        options={{ title: 'Menu', tabBarIcon: getTabBarIcon('Menu') }} 
      />
    </Tab.Navigator>
  );
});

MainTabs.displayName = 'MainTabs';

export default MainTabs;


