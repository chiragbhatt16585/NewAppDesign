# Client API Updates - Session Validation

## Overview

All client-specific API files have been updated to use the new session validation approach that prevents automatic logout and ensures persistent login sessions.

## Updated Client APIs

### 1. DNA Infotel API (`config/dna-infotel/api.ts`)
✅ **Updated Today**
- Has `makeAuthenticatedRequest` method
- Added `getComplaintProblems` and `submitComplaint` methods with session validation
- Uses session validation before API calls
- Updates activity time on every request
- Handles token regeneration automatically

### 2. Microscan API (`config/microscan/api.ts`)
✅ **Updated Today**
- Has `makeAuthenticatedRequest` method
- Added `getComplaintProblems` and `submitComplaint` methods with session validation
- Uses session validation before API calls
- Updates activity time on every request
- Handles token regeneration automatically

### 3. One-Sevenstar API (`config/one-sevenstar/api.ts`)
✅ **Updated Today**
- Enhanced `makeAuthenticatedRequest` method to match other clients
- Updated `authUser` method to use `makeAuthenticatedRequest` wrapper
- Added `getComplaintProblems` and `submitComplaint` methods with session validation
- Uses session validation before API calls
- Updates activity time on every request
- Handles token regeneration automatically

## Key Features Implemented

### Session Validation
```typescript
// All APIs now use this pattern
async makeAuthenticatedRequest<T>(
  requestFn: (token: string) => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  // Check session validity
  const token = await sessionManager.getToken();
  if (!token) {
    await sessionManager.clearSession();
    throw new Error('Authentication required. Please login again.');
  }

  // Update activity time (but don't logout)
  await sessionManager.updateActivityTime();

  // Make API call with token
  return await requestFn(token);
}
```

### Persistent Login
- **No automatic logout** due to inactivity
- **No session expiry** - sessions persist until manual logout
- **Activity tracking** for analytics only (doesn't cause logout)
- **Token regeneration** when tokens expire

### Error Handling
- Clear error messages for authentication issues
- Automatic token regeneration on token expiry
- Graceful fallback to login screen when needed
- No silent failures or "data not displayed" issues

## API Methods Updated

### All Clients Now Support:
1. **`makeAuthenticatedRequest`** - Wrapper for all authenticated API calls
2. **`authUser`** - Uses session validation
3. **`userLedger`** - Uses session validation
4. **`lastTenSessions`** - Uses session validation
5. **`lastTenComplaints`** - Uses session validation
6. **`getComplaintProblems`** - Uses session validation
7. **`submitComplaint`** - Uses session validation
8. **`viewUserKyc`** - Uses session validation
9. **`downloadInvoicePDF`** - Uses session validation
10. **`downloadReceiptPDF`** - Uses session validation

## Benefits

### For Users:
- **Persistent Login**: Stay logged in until manual logout
- **No Unexpected Logouts**: No automatic logout due to inactivity
- **Reliable Data Loading**: Data always displays when session is valid
- **Clear Error Messages**: Know exactly what's wrong when issues occur

### For Developers:
- **Consistent Behavior**: All clients work the same way
- **Centralized Logic**: Session validation in one place
- **Easy Maintenance**: Same code pattern across all clients
- **Better Debugging**: Clear logging and error tracking

## New KYC Functionality

### `viewUserKyc(username: string, realm: string)`
- **Purpose**: Fetches user KYC (Know Your Customer) information
- **Parameters**:
  - `username`: User's username (automatically trimmed and lowercased)
  - `realm`: Client realm (e.g., 'dna-infotel', 'microscan', 'one-sevenstar')
- **Returns**: User KYC data from the server
- **Session Validation**: ✅ Uses `makeAuthenticatedRequest` with token regeneration
- **Error Handling**: ✅ Network error detection and proper error messages
- **API Endpoint**: `/selfcareViewUserKyc`

### Usage Example:
```typescript
// Get user KYC data
const kycData = await apiService.viewUserKyc(username, realm);
console.log('KYC Data:', kycData);
```

### Error Handling:
- **Network Errors**: Returns "Please check your internet connection and try again."
- **Authentication Errors**: Returns "Invalid username or password"
- **API Errors**: Returns specific error message from server
- **Token Issues**: Automatically regenerates token and retries

## Testing

### Manual Testing:
1. Login to any client app
2. Leave app inactive for any time
3. Return to app
4. Data should load normally without logout

### Automated Testing:
```typescript
// Session validation test runs during app initialization
await testSessionValidation();
```

## Configuration

### Session Behavior (All Clients):
```typescript
// Sessions persist until manual logout
// No automatic expiry or inactivity logout
private readonly SESSION_EXPIRY_HOURS = 24 * 7; // Not used
private readonly INACTIVITY_LOGOUT_HOURS = 24 * 7; // Not used
```

### Activity Tracking (All Clients):
- Activity time updated on every API call
- Used for analytics only
- Does not cause automatic logout
- Sessions only clear on manual logout or missing token

## Migration Notes

- **No Breaking Changes**: All existing API calls continue to work
- **Automatic Improvements**: Better error handling out of the box
- **Backward Compatible**: Existing functionality preserved
- **Enhanced Security**: Better token management and regeneration

## Future Enhancements

1. **Biometric Integration**: Use biometric auth for sensitive operations
2. **Offline Support**: Handle session validation when offline
3. **Custom Settings**: Allow users to choose session preferences
4. **Advanced Analytics**: Better tracking of user activity patterns 