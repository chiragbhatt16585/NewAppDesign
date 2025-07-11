# ISP Connect App

A modern React Native app for ISP customers to manage their internet services, inspired by Vodafone, Airtel, and Jio apps.

## Features

- **Login Screen**: Username/Password and OTP login options with ISP logo and beautiful gradient background
- **Home Screen**: Account details, quick actions, and bill management with branded header
- **Ledger Screen**: Complete transaction history with PDF download functionality
- **More Options Screen**: Extended menu with additional features and logo
- **Modern UI**: Clean, responsive design with beautiful animations and gradients
- **Cross-platform**: Works on both Android and iOS
- **Branded Design**: ISP logo integration throughout the app
- **PDF Download**: Download invoices, receipts, and proforma invoices
- **Real API Integration**: Connected to backend services for live data

## Screenshots

### Login Screen
- Beautiful grey gradient background
- ISP logo prominently displayed in header
- Tabbed interface for Username/Password and OTP login
- Modern form design with validation
- Smooth keyboard handling
- Glass-morphism effect on form container

### Home Screen
- ISP logo in header alongside user information
- Account details with plan information
- Quick action buttons (Renew, Pay Bill, Support, Contact Us)
- Bill information with payment options
- Usage statistics with progress bar
- More options menu with logout button

### Ledger Screen
- **Transaction History**: View all invoices, receipts, and proforma invoices
- **Tabbed Interface**: Dynamic tabs showing only available data types
- **PDF Download**: Download any document with one tap
- **Pull-to-Refresh**: Refresh data by pulling down
- **Account Summary**: Bottom section with balance details
- **Loading States**: Proper loading indicators
- **Error Handling**: Graceful error handling with retry options
- **Empty States**: Beautiful empty state when no data available

### More Options Screen
- ISP logo in header with back navigation
- **Ledger**: Transaction history with PDF downloads
- **KYC**: Identity verification
- **Upgrade Plan**: Change your plan
- **Usage Details**: Detailed statistics
- **Renew Plan**: Extend your plan
- **Speed Test**: Opens Speedtest.net website
- **Refer Friend**: Referral program
- **Logout**: Sign out functionality

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd ISPApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **For iOS (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### Android
```bash
npx react-native run-android
```

#### iOS (macOS only)
```bash
npx react-native run-ios
```

## Project Structure

```
src/
├── screens/
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── LedgerScreen.tsx
│   ├── AccountDetailsScreen.tsx
│   ├── BiometricAuthScreen.tsx
│   ├── ContactUsScreen.tsx
│   ├── LanguageScreen.tsx
│   ├── PayBillScreen.tsx
│   ├── PlanConfirmationScreen.tsx
│   ├── RenewPlanScreen.tsx
│   ├── SessionsScreen.tsx
│   ├── TicketsScreen.tsx
│   ├── WebViewScreen.tsx
│   └── MoreOptionsScreen.tsx
├── components/
│   ├── CommonHeader.tsx
│   ├── LogoImage.tsx
│   ├── PatternLock.tsx
│   └── PinInput.tsx
├── services/
│   ├── api.ts
│   ├── biometricAuth.ts
│   ├── downloadService.ts
│   └── sessionManager.ts
├── navigation/
│   └── AppNavigator.tsx
├── utils/
│   ├── AuthContext.tsx
│   ├── LanguageContext.tsx
│   ├── ThemeContext.tsx
│   └── themeStyles.ts
└── i18n/
    ├── index.ts
    └── translations/
        ├── en.json
        ├── gu.json
        ├── hi.json
        └── mr.json
```

## Features Implemented

### Login Screen
- ✅ Beautiful grey gradient background
- ✅ ISP logo in header
- ✅ Username/Password login (pre-filled for testing)
- ✅ OTP login with phone number (pre-filled for testing)
- ✅ Form validation
- ✅ Modern UI with tabs
- ✅ Keyboard handling
- ✅ Glass-morphism effect on form

### Home Screen
- ✅ ISP logo in header with user info
- ✅ Account details display
- ✅ Renew button
- ✅ Pay Bill button
- ✅ Support button
- ✅ Contact Us button
- ✅ More menu options
- ✅ Usage statistics
- ✅ Bill information
- ✅ Clean header layout

### Ledger Screen (NEW)
- ✅ **Real API Integration**: Connected to backend `userLedger` API
- ✅ **Dynamic Tabs**: Shows only tabs with available data
- ✅ **PDF Download**: Download invoices, receipts, and proforma invoices
- ✅ **Cross-platform Download**: Works on both Android and iOS
- ✅ **Pull-to-Refresh**: Refresh data by pulling down
- ✅ **Loading States**: Proper loading indicators with spinner
- ✅ **Error Handling**: Graceful error handling with retry button
- ✅ **Empty States**: Beautiful empty state when no transactions
- ✅ **Account Summary**: Bottom section with balance details
- ✅ **File Management**: Automatic file cleanup and overwrite handling
- ✅ **Permissions**: Android storage permissions for downloads
- ✅ **User Feedback**: Success/error alerts for download status

### More Options Screen
- ✅ ISP logo in header with back navigation
- ✅ Ledger (Transaction history with PDF downloads)
- ✅ KYC (Identity verification)
- ✅ Upgrade Plan (Change plan)
- ✅ Usage Details (Detailed statistics)
- ✅ Renew Plan (Extend plan)
- ✅ Speed Test (Opens Speedtest.net)
- ✅ Refer Friend (Referral program)
- ✅ Logout functionality
- ✅ Back navigation
- ✅ Modern card-based design

## API Integration

### Ledger API
- **Endpoint**: `selfcareGetUserInformation`
- **Features**:
  - Fetches user invoices, receipts, and proforma invoices
  - Returns account summary with balances
  - Handles authentication with session tokens
  - Error handling for network issues
  - Data transformation for UI display

### Download API
- **Endpoints**:
  - `selfcareGenerateInvoicePDF` - For invoices and proforma invoices
  - `selfcareGenerateReceiptPDF` - For receipts/payments
- **Features**:
  - Cross-platform PDF download
  - File management (cleanup, overwrite)
  - User feedback (success/error alerts)
  - Proper error handling

## Services

### API Service (`api.ts`)
- ✅ **Authentication**: Session-based authentication
- ✅ **userLedger**: Fetch transaction history
- ✅ **Error Handling**: Network error detection
- ✅ **Data Transformation**: Format dates and structure data
- ✅ **Request Management**: Proper headers and timeouts

### Download Service (`downloadService.ts`)
- ✅ **Cross-platform**: Works on Android and iOS
- ✅ **File Management**: Automatic cleanup and overwrite
- ✅ **Permissions**: Android storage permissions
- ✅ **User Feedback**: Success/error alerts
- ✅ **Error Handling**: Comprehensive error handling
- ✅ **File Naming**: Proper file naming based on document type

### Session Manager (`sessionManager.ts`)
- ✅ **Session Storage**: Secure session management
- ✅ **Token Management**: Authentication token handling
- ✅ **User Data**: Username and session data storage

## Design Features

- **Gradient Backgrounds**: Beautiful grey gradients for visual appeal
- **Glass-morphism**: Semi-transparent form containers with blur effects
- **Branded Design**: ISP logo integration throughout the app
- **Color Scheme**: Modern blue (#3498db) with grey gradients
- **Typography**: Clear hierarchy with proper font weights
- **Cards**: Elevated cards with shadows for depth
- **Icons**: Emoji icons for quick recognition
- **Responsive**: Works on different screen sizes
- **Accessibility**: Proper contrast and touch targets
- **Navigation**: Smooth transitions between screens

## Special Features

### Ledger Functionality
- **Real-time Data**: Live data from backend APIs
- **PDF Downloads**: Download any transaction document
- **Dynamic UI**: Tabs show only available data types
- **Pull-to-Refresh**: Refresh data by pulling down
- **Account Summary**: Complete balance breakdown
- **Cross-platform**: Works seamlessly on Android and iOS

### PDF Download System
- **Android**: Downloads to Downloads folder with notification
- **iOS**: Downloads to Documents folder with preview option
- **File Management**: Automatic cleanup and overwrite
- **User Feedback**: Clear success/error messages
- **Permissions**: Proper Android storage permissions
- **Error Handling**: Comprehensive error handling

### Gradient Background
- **Beautiful grey gradient**: From dark grey to light grey
- **Professional appearance**: Modern, sophisticated look
- **Cross-platform**: Works on both Android and iOS
- **Performance optimized**: Smooth rendering

### ISP Logo Integration
- **Cross-platform**: Works on both Android and iOS
- **Responsive sizing**: Adapts to different screen sizes
- **Error handling**: Graceful fallback if image fails to load
- **Consistent placement**: Logo appears in all major screens

### Speed Test Integration
- Opens Speedtest.net website directly in device browser
- Handles errors gracefully if browser is not available
- Uses React Native Linking API

### Logout Functionality
- Available in More Options screen
- Confirmation dialog before logout
- Returns to Login screen after logout

### Pre-filled Login Credentials
- **Username**: `testuser`
- **Password**: `password123`
- **Phone**: `9876543210`
- **OTP**: `123456`
- **Quick testing**: No need to type credentials

## Dependencies Added

### Core Dependencies
- `react-native-fetch-blob`: For PDF downloads
- `react-native-safe-area-context`: For safe area handling
- `react-i18next`: For internationalization
- `i18next`: Internationalization framework

### Development Dependencies
- `@types/react-native-fetch-blob`: TypeScript types for fetch-blob

## Recent Updates

### Ledger Screen Implementation
- ✅ **API Integration**: Connected to real backend APIs
- ✅ **PDF Download**: Full cross-platform download functionality
- ✅ **Dynamic Tabs**: Shows only available data types
- ✅ **Pull-to-Refresh**: Refresh functionality
- ✅ **Loading States**: Proper loading indicators
- ✅ **Error Handling**: Comprehensive error handling
- ✅ **Empty States**: Beautiful empty state design
- ✅ **Account Summary**: Complete balance breakdown

### Download Service
- ✅ **Cross-platform**: Android and iOS support
- ✅ **File Management**: Automatic cleanup and overwrite
- ✅ **Permissions**: Android storage permissions
- ✅ **User Feedback**: Success/error alerts
- ✅ **Error Handling**: Comprehensive error handling

### API Service
- ✅ **userLedger**: Complete transaction history API
- ✅ **Authentication**: Session-based authentication
- ✅ **Error Handling**: Network error detection
- ✅ **Data Transformation**: Proper data formatting

## Next Steps

1. **Payment Gateway**: Integrate payment processing for bill payments
2. **Push Notifications**: Add notification support for important updates
3. **Offline Support**: Add offline capabilities for basic functionality
4. **Testing**: Add unit and integration tests
5. **Real Speed Test**: Integrate native speed test functionality
6. **KYC Integration**: Connect to real KYC verification services
7. **Custom Logo**: Replace with your specific ISP logo
8. **Custom Gradients**: Adjust gradient colors to match brand
9. **Biometric Authentication**: Implement fingerprint/face ID login
10. **Multi-language Support**: Complete internationalization

## Technologies Used

- React Native 0.80.1
- React Navigation 6
- React Native Safe Area Context
- React Native Gesture Handler
- React Native Reanimated
- React Native Linear Gradient
- React Native Fetch Blob
- TypeScript
- React Native Vector Icons
- React i18next

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
