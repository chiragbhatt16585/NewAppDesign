# Multi-Client Enhanced Token Handling

## Overview

Both Microscan and DNA Infotel clients now include enhanced API services with automatic token regeneration, preventing app crashes and providing seamless user experiences across all client configurations.

## Updated Client Configurations

### 1. Microscan Client (`config/microscan/api.ts`)
- **Domain**: `mydesk.microscan.co.in`
- **ISP Name**: Microscan
- **Enhanced Features**: Automatic token regeneration, retry mechanism, error handling

### 2. DNA Infotel Client (`config/dna-infotel/api.ts`)
- **Domain**: `crm.dnainfotel.com`
- **ISP Name**: DNA Infotel
- **Enhanced Features**: Automatic token regeneration, retry mechanism, error handling

## Key Features Implemented

### ✅ Automatic Token Regeneration
Both clients now automatically handle token expiration without user intervention:
- **Seamless Experience**: No app crashes when tokens expire
- **Background Processing**: Token regeneration happens transparently
- **User Continuity**: Users continue using the app normally

### ✅ Smart Error Detection
Both clients detect various token expiration patterns:
- "token expired" messages
- "unauthorized" responses
- "invalid token" errors
- "authentication failed" messages

### ✅ Retry Mechanism
- **Automatic Retries**: Failed requests due to token expiration are retried
- **Configurable**: Default 1 retry, customizable per request
- **Graceful Fallback**: Users are logged out only if regeneration fails

## Implementation Details

### Enhanced API Methods (Both Clients)

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
   - Handles different error message formats from servers

#### Updated Methods:
1. **`userLedger()`** - Now uses `makeAuthenticatedRequest()` wrapper
2. **`downloadInvoicePDF()`** - Enhanced with automatic token handling
3. **`downloadReceiptPDF()`** - Enhanced with automatic token handling

### Session Manager Integration
Both clients use the same session manager (`src/services/sessionManager.ts`) for:
- Token storage and retrieval
- Session validation
- Token updates when regeneration succeeds
- Session clearing when regeneration fails

## Usage Examples

### Basic API Call (Automatic Token Handling)
```typescript
// This now automatically handles token expiration for both clients
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

## Error Handling Flow (Both Clients)

1. **API Call Made**: User initiates an action (e.g., load ledger)
2. **Token Check**: System checks if current token is valid
3. **Request Execution**: API call is made with current token
4. **Error Detection**: If token expired error is detected:
   - System attempts token regeneration
   - If successful, retries original request with new token
   - If failed, logs user out gracefully
5. **Success**: User gets their data without interruption

## Benefits for Both Clients

### For Users:
- **No Interruptions**: App continues working even when tokens expire
- **No Manual Login**: Automatic token refresh keeps users logged in
- **Better UX**: No error messages or crashes due to token issues
- **Consistent Experience**: Same behavior across Microscan and DNA Infotel

### For Developers:
- **Centralized Logic**: All token handling is in one place per client
- **Easy to Use**: Existing API calls automatically get token handling
- **Configurable**: Can adjust retry attempts and error handling per request
- **Maintainable**: Clear separation of concerns

## Configuration Differences

### Microscan Client
- **Domain**: `mydesk.microscan.co.in`
- **API Endpoints**: Uses Microscan-specific endpoints
- **Token Handling**: Same enhanced functionality

### DNA Infotel Client
- **Domain**: `crm.dnainfotel.com`
- **API Endpoints**: Uses DNA Infotel-specific endpoints
- **Token Handling**: Same enhanced functionality

## Testing Both Clients

### Test Token Expiration:
1. Use a short-lived token for either client
2. Make API calls after token expires
3. Verify automatic regeneration works
4. Confirm user experience remains smooth

### Test Regeneration Failure:
1. Simulate network issues during regeneration
2. Verify graceful logout for both clients
3. Confirm clear error messages

## Migration Guide

### Existing Code (Both Clients):
```typescript
// Old way - could fail on token expiration
const data = await apiService.userLedger(username, realm);
```

### New Way (Both Clients):
```typescript
// Same code - now with automatic token handling
const data = await apiService.userLedger(username, realm);
```

**No code changes needed!** All existing API calls automatically get the enhanced token handling for both clients.

## Security Considerations

### For Both Clients:
- Tokens are stored securely in AsyncStorage
- Failed regeneration attempts clear sensitive data
- No passwords are stored in session (regeneration uses stored credentials)
- Session expiry prevents indefinite token usage
- Each client maintains separate session data

## Troubleshooting

### If Token Regeneration Fails:
1. User is automatically logged out
2. Session is cleared
3. User is redirected to login screen
4. Clear error message is shown

### Debugging:
- Check console logs for token regeneration attempts
- Monitor session manager for token updates
- Verify API endpoints are accessible for each client
- Check client-specific domain configurations

## Future Enhancements

1. **Token Refresh Proactive**: Refresh tokens before they expire
2. **Background Refresh**: Refresh tokens in background when app is idle
3. **Multiple Token Support**: Handle different token types for different services
4. **Analytics**: Track token regeneration success rates per client
5. **Client-Specific Configurations**: Customize token handling per client needs

## Summary

Both Microscan and DNA Infotel clients now have identical enhanced token handling capabilities:

✅ **Automatic token regeneration**
✅ **Smart error detection**
✅ **Retry mechanism**
✅ **Graceful fallback**
✅ **No code changes required**
✅ **Consistent user experience**

The implementation ensures that users of both clients enjoy the same seamless experience when tokens expire, with no interruptions or app crashes. 