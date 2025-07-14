# Enhanced Token Handling with Automatic Regeneration

## Overview

The ISP app now includes an enhanced API service that automatically handles token expiration and regeneration, preventing app crashes and providing a seamless user experience.

## Key Features

### 1. Automatic Token Regeneration
- **Seamless Experience**: When a token expires, the system automatically attempts to regenerate it without user intervention
- **No App Crashes**: Token expiration errors are caught and handled gracefully
- **Transparent to Users**: Users continue using the app normally while token regeneration happens in the background

### 2. Smart Error Detection
The system detects token expiration errors by checking for:
- "token expired" messages
- "unauthorized" responses
- "invalid token" errors
- "authentication failed" messages

### 3. Retry Mechanism
- **Automatic Retries**: Failed requests due to token expiration are automatically retried with the new token
- **Configurable Retries**: Default is 1 retry, but can be configured per request
- **Fallback Handling**: If token regeneration fails, users are gracefully logged out

## Implementation Details

### Enhanced API Service (`src/services/api.ts`)

#### New Methods Added:

1. **`makeAuthenticatedRequest<T>()`**
   - Generic wrapper for all authenticated API calls
   - Automatically handles token regeneration
   - Supports configurable retry attempts

2. **Enhanced `regenerateToken()`**
   - Prevents multiple simultaneous regeneration attempts
   - Uses session data to regenerate tokens
   - Returns new token or false if regeneration fails

3. **Token Expiration Detection**
   - `isTokenExpiredError()` function detects various token-related errors
   - Handles different error message formats from the server

#### Updated Methods:

1. **`userLedger()`** - Now uses `makeAuthenticatedRequest()` wrapper
2. **`downloadInvoicePDF()`** - Enhanced with automatic token handling
3. **`downloadReceiptPDF()`** - Enhanced with automatic token handling

### Session Manager Integration

The session manager (`src/services/sessionManager.ts`) provides:
- Token storage and retrieval
- Session validation
- Token updates when regeneration succeeds
- Session clearing when regeneration fails

## Usage Examples

### Basic API Call (Automatic Token Handling)
```typescript
// This now automatically handles token expiration
const ledgerData = await apiService.userLedger(username, 'default');
```

### Download with Token Handling
```typescript
// Downloads automatically retry with new token if needed
await downloadService.downloadPdf({
  id: item.id,
  type: 'invoice',
  invoiceNo: item.no
});
```

### Custom API Call with Token Handling
```typescript
const result = await apiService.makeAuthenticatedRequest(async (token) => {
  const response = await fetch(url, {
    headers: { Authentication: token },
    body: formData
  });
  return response.json();
});
```

## Error Handling Flow

1. **API Call Made**: User initiates an action (e.g., load ledger)
2. **Token Check**: System checks if current token is valid
3. **Request Execution**: API call is made with current token
4. **Error Detection**: If token expired error is detected:
   - System attempts token regeneration
   - If successful, retries original request with new token
   - If failed, logs user out gracefully
5. **Success**: User gets their data without interruption

## Benefits

### For Users:
- **No Interruptions**: App continues working even when tokens expire
- **No Manual Login**: Automatic token refresh keeps users logged in
- **Better UX**: No error messages or crashes due to token issues

### For Developers:
- **Centralized Logic**: All token handling is in one place
- **Easy to Use**: Existing API calls automatically get token handling
- **Configurable**: Can adjust retry attempts and error handling per request
- **Maintainable**: Clear separation of concerns

## Configuration

### Retry Attempts
```typescript
// Default: 1 retry
const result = await apiService.makeAuthenticatedRequest(requestFn);

// Custom retries
const result = await apiService.makeAuthenticatedRequest(requestFn, 3);
```

### Error Messages
The system handles various token expiration messages:
- "Token expired"
- "Unauthorized"
- "Invalid token"
- "Authentication failed"

## Troubleshooting

### If Token Regeneration Fails:
1. User is automatically logged out
2. Session is cleared
3. User is redirected to login screen
4. Clear error message is shown

### Debugging:
- Check console logs for token regeneration attempts
- Monitor session manager for token updates
- Verify API endpoints are accessible

## Migration Guide

### Existing Code:
```typescript
// Old way - could fail on token expiration
const data = await apiService.userLedger(username, realm);
```

### New Way:
```typescript
// Same code - now with automatic token handling
const data = await apiService.userLedger(username, realm);
```

**No code changes needed!** All existing API calls automatically get the enhanced token handling.

## Testing

### Test Token Expiration:
1. Use a short-lived token
2. Make API calls after token expires
3. Verify automatic regeneration works
4. Confirm user experience remains smooth

### Test Regeneration Failure:
1. Simulate network issues during regeneration
2. Verify graceful logout
3. Confirm clear error messages

## Future Enhancements

1. **Token Refresh Proactive**: Refresh tokens before they expire
2. **Background Refresh**: Refresh tokens in background when app is idle
3. **Multiple Token Support**: Handle different token types for different services
4. **Analytics**: Track token regeneration success rates

## Security Considerations

- Tokens are stored securely in AsyncStorage
- Failed regeneration attempts clear sensitive data
- No passwords are stored in session (regeneration uses stored credentials)
- Session expiry prevents indefinite token usage 