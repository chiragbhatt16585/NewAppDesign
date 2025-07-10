# ISP Connect App

A modern React Native app for ISP customers to manage their internet services, inspired by Vodafone, Airtel, and Jio apps.

## Features

- **Login Screen**: Username/Password and OTP login options with ISP logo and beautiful gradient background
- **Home Screen**: Account details, quick actions, and bill management with branded header
- **More Options Screen**: Extended menu with additional features and logo
- **Modern UI**: Clean, responsive design with beautiful animations and gradients
- **Cross-platform**: Works on both Android and iOS
- **Branded Design**: ISP logo integration throughout the app

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

### More Options Screen
- ISP logo in header with back navigation
- **Ledger**: Transaction history
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
│   └── MoreOptionsScreen.tsx
├── components/
│   └── LogoImage.tsx
├── navigation/
│   └── AppNavigator.tsx
└── utils/
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

### More Options Screen
- ✅ ISP logo in header with back navigation
- ✅ Ledger (Transaction history)
- ✅ KYC (Identity verification)
- ✅ Upgrade Plan (Change plan)
- ✅ Usage Details (Detailed statistics)
- ✅ Renew Plan (Extend plan)
- ✅ Speed Test (Opens Speedtest.net)
- ✅ Refer Friend (Referral program)
- ✅ Logout functionality
- ✅ Back navigation
- ✅ Modern card-based design

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

## Next Steps

1. **Backend Integration**: Connect to real APIs for user data
2. **Authentication**: Implement proper JWT token handling
3. **Payment Gateway**: Integrate payment processing
4. **Push Notifications**: Add notification support
5. **Offline Support**: Add offline capabilities
6. **Testing**: Add unit and integration tests
7. **Real Speed Test**: Integrate native speed test functionality
8. **KYC Integration**: Connect to real KYC verification services
9. **Custom Logo**: Replace with your specific ISP logo
10. **Custom Gradients**: Adjust gradient colors to match brand

## Technologies Used

- React Native 0.80.1
- React Navigation 6
- React Native Safe Area Context
- React Native Gesture Handler
- React Native Reanimated
- React Native Linear Gradient
- TypeScript
- React Native Vector Icons

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
