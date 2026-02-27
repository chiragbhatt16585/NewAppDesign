# Token Regeneration Fix

## Problem
The app was failing to automatically regenerate authentication tokens when they expired, causing users to be logged out and see blank data.

## Root Cause
1. **Client Mismatch**: The API service was hardcoded to use DNA Infotel's API endpoint (`crm.dnainfotel.com`) regardless of which client the app was built for.
2. **Missing Credentials**: Token regeneration was attempting to authenticate without stored credentials.
3. **Infinite Loops**: No safeguards against repeated token regeneration attempts.

## Solution

### 1. Dynamic API Configuration
- Made the API service dynamically switch between client configurations
- Added `updateApiConfig()` function to change API endpoints based on client
- API service now detects and uses the correct client's API endpoint

### 2. Improved Credential Storage
- Enhanced credential storage to properly save and retrieve passwords
- Added better logging to track credential availability
- Fixed credential retrieval during token regeneration

### 3. Enhanced Token Regeneration
- Added proper credential retrieval in `performTokenRegeneration()`
- Implemented safeguards against infinite regeneration loops
- Added maximum retry limits (2 attempts)
- Improved error handling and logging

### 4. Client Detection
- Session manager now stores the current client name
- API configuration is restored when app starts
- AuthContext uses stored client information for login

## Usage

### Building for Different Clients
```bash
# Build for Microscan
./scripts/build-for-client.sh microscan

# Build for DNA Infotel
./scripts/build-for-client.sh dna-infotel

# Build for One Seven Star
./scripts/build-for-client.sh one-sevenstar
```

### How It Works
1. When you build for a specific client, the build script copies the correct API configuration
2. The session manager detects and stores the current client
3. During login, the correct client configuration is used
4. Token regeneration uses the stored credentials and correct API endpoint
5. If token expires, it's automatically regenerated without user intervention

## Files Modified
- `src/services/api.ts` - Dynamic API configuration and improved token regeneration
- `src/services/sessionManager.ts` - Client storage and API configuration restoration
- `src/utils/AuthContext.tsx` - Client-aware login process
- `src/services/credentialStorage.ts` - Enhanced credential management
- `src/services/autoDataReloader.ts` - Fixed API call conflicts

## Testing
The fix includes comprehensive logging to help debug any issues:
- Token regeneration attempts are logged
- Credential availability is tracked
- API configuration changes are logged
- Error conditions are clearly identified

## Result
- ✅ Tokens are automatically regenerated when they expire
- ✅ Users stay logged in without manual intervention
- ✅ Data loads properly after token refresh
- ✅ No more blank screens due to authentication failures
- ✅ Support for multiple clients with correct API endpoints 