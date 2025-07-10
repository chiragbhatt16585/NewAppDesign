import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
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
//import WebViewScreen from '../screens/WebViewScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
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
        {/* <Stack.Screen name="WebView" component={WebViewScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 