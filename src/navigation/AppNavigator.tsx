import React, { useState, useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MoreOptionsScreen from '../screens/MoreOptionsScreen';
import AccountDetailsScreen from '../screens/AccountDetailsScreen';
import LedgerScreen from '../screens/LedgerScreen';
import TicketsScreen from '../screens/TicketsScreen';
import SessionsScreen from '../screens/SessionsScreen';
import RenewPlanScreen from '../screens/RenewPlanScreen';
import UpgradePlanScreen from '../screens/UpgradePlanScreen';
import UpgradePlanConfirmationScreen from '../screens/UpgradePlanConfirmationScreen';
import PlanConfirmationScreen from '../screens/PlanConfirmationScreen';
import PaymentLinkScreen from '../screens/PaymentLinkScreen';
import PaymentResponseScreen from '../screens/PaymentResponseScreen';
import PayBillScreen from '../screens/PayBillScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import KYCScreen from '../screens/KYCScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import UsageDetailsScreen from '../screens/UsageDetailsScreen';
import WebViewScreen from '../screens/WebViewScreen';
import ReferFriendScreen from '../screens/ReferFriendScreen';
import SetPinScreen from '../screens/SetPinScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import AuthSetupScreen from '../screens/AuthSetupScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TermsScreen from '../screens/TermsScreen';
import FAQScreen from '../screens/FAQScreen';
import AIDemoScreen from '../screens/AIDemoScreen';
import UpdateSSIDScreen from '../screens/UpdateSSIDScreen';
import OffersScreen from '../screens/OffersScreen';
import PartnerAppsScreen from '../screens/PartnerAppsScreen';

const Stack = createStackNavigator();

interface AppNavigatorProps {
  initialRoute?: string;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRoute }) => {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();
  const [currentInitialRoute, setCurrentInitialRoute] = useState('Home');

  useEffect(() => {
    const restoreState = async () => {
      try {
        // console.log('=== NAVIGATION STATE RESTORATION ===');
        // console.log('Initial route prop:', initialRoute);
        
        // For now, always start with a clean navigation state
        setCurrentInitialRoute(initialRoute || 'Home');
        setIsReady(true);
        
        // TODO: Re-enable state restoration once back button issue is fixed
        /*
        const savedStateString = await AsyncStorage.getItem('navigationState');
        console.log('Saved state string:', savedStateString);
        
        if (savedStateString) {
          const savedState = JSON.parse(savedStateString);
          console.log('Parsed saved state:', savedState);
          
          // Check if the saved state has valid routes
          if (savedState && savedState.routes && savedState.routes.length > 0) {
            console.log('✅ Using saved navigation state with', savedState.routes.length, 'routes');
            setInitialState(savedState);
            // Use the current route name for initial route fallback
            const currentRoute = savedState.routes[savedState.index || 0];
            setCurrentInitialRoute(currentRoute?.name || initialRoute || 'Home');
          } else {
            console.log('❌ No valid saved navigation state found, using initial route:', initialRoute || 'Home');
            setCurrentInitialRoute(initialRoute || 'Home');
          }
        } else {
          console.log('❌ No saved navigation state found, using initial route:', initialRoute || 'Home');
          setCurrentInitialRoute(initialRoute || 'Home');
        }
        */
      } catch (err) {
        // console.log('❌ Failed to restore navigation state:', err);
        setCurrentInitialRoute(initialRoute || 'Home');
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []); // Remove initialRoute dependency to prevent re-triggering

  const onStateChange = async (state: any) => {
    try {
      // console.log('=== NAVIGATION STATE SAVING DISABLED ===');
      // console.log('State to save:', state);
      // console.log('Current routes:', state?.routes?.map((r: any) => r.name));
      // console.log('Current index:', state?.index);
      
      // Temporarily disable state saving to prevent navigation issues
      // await AsyncStorage.setItem('navigationState', JSON.stringify(state));
      // console.log('✅ Navigation state saving disabled');
    } catch (err) {
      // console.log('❌ Failed to save navigation state:', err);
    }
  };

  if (!isReady) {
    return null; // Show loading state
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}>
      <Stack.Navigator
        initialRouteName={initialState ? undefined : currentInitialRoute}
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SetPinScreen" component={SetPinScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SecuritySettingsScreen" component={SecuritySettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AuthSetupScreen" component={AuthSetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TermsScreen" component={TermsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FAQScreen" component={FAQScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIDemo" component={AIDemoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UpdateSSID" component={UpdateSSIDScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Offers" component={OffersScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PartnerApps" component={PartnerAppsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MoreOptions" component={MoreOptionsScreen} />
        <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
        <Stack.Screen name="Ledger" component={LedgerScreen} />
        <Stack.Screen name="Tickets" component={TicketsScreen} />
        <Stack.Screen name="Sessions" component={SessionsScreen} />
        <Stack.Screen name="RenewPlan" component={RenewPlanScreen} />
        <Stack.Screen name="UpgradePlan" component={UpgradePlanScreen} />
        <Stack.Screen name="UpgradePlanConfirmation" component={UpgradePlanConfirmationScreen} />
        <Stack.Screen name="PlanConfirmation" component={PlanConfirmationScreen} />
        <Stack.Screen name="PayBill" component={PayBillScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="KYC" component={KYCScreen} />
        <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
        <Stack.Screen name="UsageDetails" component={UsageDetailsScreen} />
        <Stack.Screen name="WebView" component={WebViewScreen} />
        <Stack.Screen name="ReferFriend" component={ReferFriendScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PaymentLink" component={PaymentLinkScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PaymentResponse" component={PaymentResponseScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 