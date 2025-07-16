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
import PlanConfirmationScreen from '../screens/PlanConfirmationScreen';
import PayBillScreen from '../screens/PayBillScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import KYCScreen from '../screens/KYCScreen';
//import WebViewScreen from '../screens/WebViewScreen';

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
        console.log('=== NAVIGATION STATE RESTORATION ===');
        console.log('Initial route prop:', initialRoute);
        
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
        console.log('❌ Failed to restore navigation state:', err);
        setCurrentInitialRoute(initialRoute || 'Home');
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []); // Remove initialRoute dependency to prevent re-triggering

  const onStateChange = async (state: any) => {
    try {
      console.log('=== NAVIGATION STATE SAVING DISABLED ===');
      console.log('State to save:', state);
      console.log('Current routes:', state?.routes?.map((r: any) => r.name));
      console.log('Current index:', state?.index);
      
      // Temporarily disable state saving to prevent navigation issues
      // await AsyncStorage.setItem('navigationState', JSON.stringify(state));
      console.log('✅ Navigation state saving disabled');
    } catch (err) {
      console.log('❌ Failed to save navigation state:', err);
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
        <Stack.Screen name="MoreOptions" component={MoreOptionsScreen} />
        <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
        <Stack.Screen name="Ledger" component={LedgerScreen} />
        <Stack.Screen name="Tickets" component={TicketsScreen} />
        <Stack.Screen name="Sessions" component={SessionsScreen} />
        <Stack.Screen name="RenewPlan" component={RenewPlanScreen} />
        <Stack.Screen name="PlanConfirmation" component={PlanConfirmationScreen} />
        <Stack.Screen name="PayBill" component={PayBillScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="KYC" component={KYCScreen} />
        {/* <Stack.Screen name="WebView" component={WebViewScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 