import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { useAuthData } from '../utils/AuthDataContext';
import useMenuSettings from '../hooks/useMenuSettings';
import { getClientConfig } from '../config/client-config';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AccountDetailsScreen from '../screens/AccountDetailsScreen';
import PayBillScreen from '../screens/PayBillScreen';
import RenewPlanScreen from '../screens/RenewPlanScreen';
import UpgradePlanScreen from '../screens/UpgradePlanScreen';
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
import TroubleshootingScreen from '../screens/TroubleshootingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
    <Stack.Screen name="PayBill" component={PayBillScreen} />
    <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    <Stack.Screen name="UsageDetails" component={UsageDetailsScreen} />
    <Stack.Screen name="FixYourInternet" component={TroubleshootingScreen} />
  </Stack.Navigator>
);

const SupportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    <Stack.Screen name="FixYourInternet" component={TroubleshootingScreen} />
  </Stack.Navigator>
);

const HelpStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FixYourInternet" component={TroubleshootingScreen} />
    <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    <Stack.Screen name="Tickets" component={TicketsScreen} />
  </Stack.Navigator>
);

const MenuStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MoreOptions" component={MoreOptionsScreen} />
    <Stack.Screen name="ContactUs" component={ContactUsScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Language" component={LanguageScreen} />
    <Stack.Screen name="KYC" component={KYCScreen} />
    <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    <Stack.Screen name="UpdateSSID" component={UpdateSSIDScreen} />
    <Stack.Screen name="Offers" component={OffersScreen} />
    <Stack.Screen name="PartnerApps" component={PartnerAppsScreen} />
    <Stack.Screen name="FixYourInternet" component={TroubleshootingScreen} />
  </Stack.Navigator>
);


const MainTabs = React.memo(() => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { authData } = useAuthData();
  const { menu, refresh: refreshMenu } = useMenuSettings();
  const isMicroscan = getClientConfig().clientId === 'microscan';
  const [tabBarKey, setTabBarKey] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // When app returns from background, force tab bar to re-layout so it doesn't stay missing (iOS/Android)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current === 'background' && nextState === 'active') {
        setTabBarKey((k) => k + 1);
        refreshMenu().catch(() => {});
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refreshMenu]);

  // Check if AppSideNavigationMenu contains "First Payment"
  const shouldHideRecharge = useMemo(() => {
    if (!authData?.AppSideNavigationMenu || !Array.isArray(authData.AppSideNavigationMenu)) {
      return false;
    }
    const shouldHide = authData.AppSideNavigationMenu.includes('First Payment');
    console.log('[MainTabs] shouldHideRecharge:', {
      AppSideNavigationMenu: authData.AppSideNavigationMenu,
      shouldHide,
    });
    return shouldHide;
  }, [authData?.AppSideNavigationMenu]);

  // Check if proforma_invoices_dues exists and has a value
  const shouldHideRenewAndUpgrade = useMemo(() => {
    // proforma_invoices_dues is at the root level of authData
    const proformaDues = authData?.proforma_invoices_dues;
    
    // If no proforma dues, show the tabs
    if (proformaDues === null || proformaDues === undefined || proformaDues === '') {
      return false;
    }
    
    // Convert to string and check if it's a valid non-zero value
    const duesValue = String(proformaDues).trim();
    const numericValue = parseFloat(duesValue);
    
    // Hide tabs if dues exist and are greater than 0
    const shouldHide = duesValue !== '' && duesValue !== '0' && !isNaN(numericValue) && numericValue > 0;

    console.log('[MainTabs] shouldHideRenewAndUpgrade:', {
      proforma_invoices_dues: proformaDues,
      numericValue,
      shouldHide,
    });

    return shouldHide;
  }, [authData]);

  // Check menu API status for Renew Plan and Upgrade Plan
  // PRIMARY CHECK: Status must be "active" first, then other conditions apply
  // Status can be "active", "in_active", "inactive", etc. - only "active" shows the tab
  const isRenewPlanActive = useMemo(() => {
    if (!Array.isArray(menu)) {
      console.log('[MainTabs] Menu is not an array:', menu);
      return false;
    }
    const renewPlanItem = menu.find((m: any) => 
      m?.menu_label === 'Renew Plan' && 
      m?.menu_api_type === 'main'
    );
    
    // FIRST: Check if menu item exists
    if (!renewPlanItem) {
      console.log('[MainTabs] Renew Plan menu item not found');
      return false;
    }
    
    // SECOND: Check if status is exactly "active" (case-insensitive)
    // Handle "in_active", "inactive", or any other value as non-active
    const status = String(renewPlanItem?.status || '').toLowerCase().trim();
    const isActive = status === 'active';
    
    console.log('[MainTabs] Renew Plan menu item:', {
      found: true,
      menu_label: renewPlanItem?.menu_label,
      menu_api_type: renewPlanItem?.menu_api_type,
      status: renewPlanItem?.status,
      statusLowercase: status,
      isActive,
      willShowTab: isActive,
    });
    
    // Only return true if status is exactly "active"
    return isActive;
  }, [menu]);

  const isUpgradePlanActive = useMemo(() => {
    if (!Array.isArray(menu)) {
      console.log('[MainTabs] Menu is not an array:', menu);
      return false;
    }
    const upgradePlanItem = menu.find((m: any) => 
      m?.menu_label === 'Upgrade Plan' && 
      m?.menu_api_type === 'main'
    );
    
    // FIRST: Check if menu item exists
    if (!upgradePlanItem) {
      console.log('[MainTabs] Upgrade Plan menu item not found');
      return false;
    }
    
    // SECOND: Check if status is exactly "active" (case-insensitive)
    // Handle "in_active", "inactive", or any other value as non-active
    const status = String(upgradePlanItem?.status || '').toLowerCase().trim();
    const isActive = status === 'active';
    
    console.log('[MainTabs] Upgrade Plan menu item:', {
      found: true,
      menu_label: upgradePlanItem?.menu_label,
      menu_api_type: upgradePlanItem?.menu_api_type,
      status: upgradePlanItem?.status,
      statusLowercase: status,
      isActive,
      willShowTab: isActive,
    });
    
    // Only return true if status is exactly "active"
    return isActive;
  }, [menu]);

  const renewTabVisible = isRenewPlanActive && !shouldHideRecharge && !shouldHideRenewAndUpgrade;
  const upgradeTabVisible = isUpgradePlanActive && !shouldHideRenewAndUpgrade;

  useEffect(() => {
    console.log('[MainTabs] Tab visibility summary:', {
      isRenewPlanActive,
      isUpgradePlanActive,
      shouldHideRecharge,
      AppSideNavigationMenu: authData?.AppSideNavigationMenu,
      shouldHideRenewAndUpgrade,
      renewTabVisible,
      upgradeTabVisible,
    });
  }, [
    isRenewPlanActive,
    isUpgradePlanActive,
    shouldHideRecharge,
    shouldHideRenewAndUpgrade,
    renewTabVisible,
    upgradeTabVisible,
    authData?.AppSideNavigationMenu,
  ]);

  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  }), [colors.primary, colors.textSecondary, colors.surface, colors.border]);

  const getTabBarIcon = (routeName: string) => ({ color, size }: { color: string; size: number }) => {
    const map: Record<string, string> = {
      Home: 'home',
      Pay: 'refresh-cw',
      UpgradePlan: 'arrow-up-circle',
      Help: 'help-circle',
      Support: 'headphones',
      Menu: 'menu',
    };
    const name = map[routeName] || 'circle';
    return <Feather name={name} size={size} color={color} />;
  };

  return (
    <Tab.Navigator key={tabBarKey} screenOptions={screenOptions}>
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ title: 'Home', tabBarIcon: getTabBarIcon('Home') }} 
      />
      {/* Renew Plan: FIRST check if status is "active", THEN check other conditions */}
      {renewTabVisible && (
        <Tab.Screen 
          name="Pay" 
          component={RenewPlanScreen} 
          options={{ title: 'Renew Plan', tabBarIcon: getTabBarIcon('Pay') }} 
        />
      )}
      {/* Upgrade Plan: FIRST check if status is "active", THEN check other conditions */}
      {upgradeTabVisible && (
      <Tab.Screen 
        name="UpgradePlan" 
        component={UpgradePlanScreen} 
        options={{ title: 'Upgrade Plan', tabBarIcon: getTabBarIcon('UpgradePlan') }} 
      />
      )}
      {getClientConfig().clientId !== 'log2space-common' && isMicroscan && (
        <Tab.Screen
          name="Help"
          component={HelpStack}
          options={{ title: 'Help', tabBarIcon: getTabBarIcon('Help') }}
        />
      )}
      {getClientConfig().clientId !== 'log2space-common' && !isMicroscan && (
        <Tab.Screen
          name="Support"
          component={SupportStack}
          options={{ title: 'Support', tabBarIcon: getTabBarIcon('Support') }}
        />
      )}
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


