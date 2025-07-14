# API Integration Documentation

## Overview
This document describes the API integration implementation for the ISP App, following the same structure as the reference app but with modern TypeScript and React Native patterns.

## API Service Structure

### Core Files
- `src/services/api.ts` - Main API service with all endpoints
- `src/utils/AuthContext.tsx` - Authentication context for state management

### Key Features

#### 1. API Service (`api.ts`)
- **Domain Configuration**: Uses `myaccount.microscan.co.in` as the base domain
- **Authentication**: Handles login with username/password and OTP
- **Token Management**: Automatic token storage and refresh
- **Error Handling**: Comprehensive error handling with network detection
- **Storage**: AsyncStorage for credentials and user data

#### 2. Authentication Context (`AuthContext.tsx`)
- **State Management**: Manages authentication state across the app
- **Login Methods**: Both password and OTP login support
- **Auto-login**: Checks authentication status on app start
- **Logout**: Proper cleanup of stored data

## API Endpoints

### Authentication
- `POST /l2s/api/selfcareL2sUserLogin` - Main login endpoint
- `POST /l2s/api/selfcareHelpdesk` - User authentication and profile data

### Configuration
- `GET /tmp/isp_details.json` - Admin details and configuration

## Usage Examples

### Login with Password
```typescript
import { useAuth } from '../utils/AuthContext';

const { login } = useAuth();

const handleLogin = async () => {
  const success = await login(username, password);
  if (success) {
    // Navigate to home screen
  }
};
```

### Login with OTP
```typescript
import { useAuth } from '../utils/AuthContext';

const { loginWithOtp } = useAuth();

const handleOtpLogin = async () => {
  const success = await loginWithOtp(phoneNumber, otp);
  if (success) {
    // Navigate to home screen
  }
};
```

### Check Authentication Status
```typescript
import { useAuth } from '../utils/AuthContext';

const { isAuthenticated, userData, loading } = useAuth();

if (loading) {
  // Show loading screen
} else if (isAuthenticated) {
  // User is logged in
} else {
  // User needs to login
}
```

## Storage Keys
- `Authentication` - Auth token
- `username` - Stored username
- `password` - Stored password
- `signedIn` - Login preference
- `domainName` - Domain configuration
- `menuItems` - App menu items

## Error Handling
- Network error detection
- Timeout handling (6 seconds)
- Proper error messages for user feedback
- Automatic retry for token refresh

## Security Features
- Credential encryption in AsyncStorage
- Token-based authentication
- Automatic token refresh
- Secure logout with data cleanup

## Next Steps
1. Add more API endpoints (plans, payments, complaints, etc.)
2. Implement offline support
3. Add request/response interceptors
4. Implement proper error boundaries
5. Add API response caching

## Testing
- Test with actual API endpoints
- Verify token refresh mechanism
- Test offline scenarios
- Validate error handling 