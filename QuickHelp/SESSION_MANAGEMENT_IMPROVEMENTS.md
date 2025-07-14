# Session Management Improvements

## Problem Solved

The "Invalid Username" error was occurring because:

1. **Session Expiry**: After 7 days of inactivity, the session would expire
2. **Token Regeneration Failure**: When trying to regenerate tokens, the app was sending empty passwords
3. **Server Rejection**: The server rejected token regeneration requests without valid credentials
4. **Poor Error Handling**: Users got confusing "Invalid Username" errors instead of clear session expiry messages

## Solutions Implemented

### 1. Enhanced Session Manager (`src/services/sessionManager.ts`)

**New Features:**
- **Session Expiry Monitoring**: Tracks when sessions are about to expire
- **Proactive Warnings**: Warns users 24 hours before session expiry
- **Better Error Messages**: Clear messages about session expiry instead of "Invalid Username"
- **Session Refresh**: Automatically extends session when tokens are updated
- **🆕 Automatic Logout**: Logs out users after 7 days of inactivity
- **🆕 Activity Tracking**: Tracks when users last used the app

**Key Methods:**
```typescript
// Check if session needs refresh
await sessionManager.shouldRefreshSession()

// Get detailed session expiry info
const info = await sessionManager.getSessionExpiryInfo()
// Returns: { isExpiringSoon: boolean, hoursRemaining: number }

// Check session status before actions
const isValid = await sessionManager.isSessionValid()

// 🆕 Update activity time (call when user performs actions)
await sessionManager.updateActivityTime()

// 🆕 Get inactivity information
const inactivityInfo = await sessionManager.getInactivityInfo()
// Returns: { isInactive: boolean, hoursSinceLastActivity: number }

// 🆕 Get days since last activity
const days = await sessionManager.getDaysSinceLastActivity()
```

### 2. Improved API Service (`src/services/api.ts`)

**Enhanced Token Regeneration:**
- **Session Expiry Check**: Prevents token regeneration when session is about to expire
- **Better Error Handling**: Clear error messages for different failure scenarios
- **Automatic Session Clearing**: Clears invalid sessions automatically

**Key Improvements:**
```typescript
// Before: Generic "Invalid Username" error
throw new Error('Invalid username or password');

// After: Clear session expiry message
throw new Error('Your session has expired. Please login again to continue.');
```

### 3. Session Monitor (`src/services/sessionMonitor.ts`)

**Proactive Monitoring:**
- **Background Checks**: Monitors session status every 30 minutes
- **User Warnings**: Shows alerts when session is expiring soon
- **Automatic Integration**: Starts/stops monitoring with login/logout
- **🆕 Inactivity Monitoring**: Tracks user activity and warns before automatic logout
- **🆕 Activity Tracking**: Updates activity time when users interact with the app

**Features:**
- Checks session status every 30 minutes
- Warns users 24 hours before expiry
- **🆕 Warns users after 6 days of inactivity**
- **🆕 Automatically logs out after 7 days of inactivity**
- Provides different warning levels based on time remaining
- Integrates with AuthContext automatically

**New Methods:**
```typescript
// Track user activity (call when user performs actions)
await sessionMonitor.trackUserActivity()

// Get inactivity status
const status = await sessionMonitor.getInactivityStatus()
// Returns: { daysSinceLastActivity: number, daysUntilLogout: number, isInactive: boolean }
```

### 4. Session Status Component (`src/components/SessionStatus.tsx`)

**Visual Indicators:**
- **Color-coded Warnings**: Red (≤1 hour), Orange (≤6 hours), Yellow (≤24 hours)
- **Real-time Updates**: Checks status every 5 minutes
- **User Actions**: Allows users to refresh session status
- **🆕 Inactivity Warnings**: Shows inactivity status with countdown
- **🆕 Continue Using Button**: Allows users to reset inactivity timer

**🆕 New Features:**
- Shows inactivity countdown (e.g., "You will be logged out in 2 days due to inactivity")
- "Continue Using" button to reset inactivity timer
- Different colors for inactivity vs session expiry warnings

### 5. Activity Tracking Hook (`src/utils/useActivityTracker.ts`)

**🆕 New Feature:**
- **useActivityTracker**: Simple hook to track user activity
- **useAutoActivityTracker**: Automatic tracking when app becomes active
- **App State Monitoring**: Tracks when app becomes active/inactive

**Usage:**
```typescript
import { useActivityTracker, useAutoActivityTracker } from '../utils/useActivityTracker';

// Simple activity tracking
const { trackActivity } = useActivityTracker();

// Automatic tracking when app becomes active
const { trackActivity } = useAutoActivityTracker();
```

## Usage Examples

### Basic Session Check
```typescript
import sessionManager from '../services/sessionManager';

// Check if user is logged in
const isLoggedIn = await sessionManager.isLoggedIn();

// Get session expiry info
const sessionInfo = await sessionManager.getSessionExpiryInfo();
if (sessionInfo.isExpiringSoon) {
  console.log(`Session expires in ${sessionInfo.hoursRemaining} hours`);
}

// 🆕 Get inactivity info
const inactivityInfo = await sessionManager.getInactivityInfo();
if (inactivityInfo.isInactive) {
  console.log('User has been inactive for too long');
}
```

### API Call with Session Handling
```typescript
import { apiService } from '../services/api';

// This now automatically handles session expiry
try {
  const userData = await apiService.authUser(username, token);
} catch (error) {
  if (error.message.includes('session has expired')) {
    // Redirect to login screen
    navigation.navigate('Login');
  }
}
```

### Session Monitoring
```typescript
import sessionMonitor from '../services/sessionMonitor';

// Start monitoring (automatically done in AuthContext)
sessionMonitor.startMonitoring();

// Check before important actions
const canProceed = await sessionMonitor.checkSessionBeforeAction();

// 🆕 Track user activity
await sessionMonitor.trackUserActivity();
```

### Activity Tracking in Components
```typescript
import { useActivityTracker } from '../utils/useActivityTracker';

const MyComponent = () => {
  const { trackActivity } = useActivityTracker();

  const handleUserAction = () => {
    // Track activity when user performs actions
    trackActivity();
    // ... rest of the action
  };

  return (
    <TouchableOpacity onPress={handleUserAction}>
      <Text>Perform Action</Text>
    </TouchableOpacity>
  );
};
```

## Error Handling Flow

### Before (Problematic):
1. User makes API call
2. Token is expired
3. App tries to regenerate token with empty password
4. Server returns "Invalid Username" error
5. User gets confused error message

### After (Improved):
1. User makes API call
2. Token is expired
3. App checks if session is about to expire
4. If session is expiring soon, shows clear message
5. If session is still valid, attempts token regeneration
6. If regeneration fails, shows "Session expired, please login again"
7. User gets clear, actionable error message

### 🆕 Inactivity Handling:
1. User doesn't use app for 6 days
2. App shows warning: "You will be logged out in 1 day due to inactivity"
3. User can click "Continue Using" to reset timer
4. If user doesn't use app for 7 days, automatic logout occurs
5. Clear message: "You have been automatically logged out due to 7 days of inactivity"

## Benefits

### For Users:
- **Clear Messages**: No more confusing "Invalid Username" errors
- **Proactive Warnings**: Know when session will expire before it happens
- **Better UX**: Smooth experience with automatic session handling
- **Visual Indicators**: See session status at a glance
- **🆕 Inactivity Awareness**: Know when they'll be logged out due to inactivity
- **🆕 Activity Control**: Can reset inactivity timer by continuing to use the app

### For Developers:
- **Centralized Logic**: All session handling in one place
- **Easy to Use**: Existing API calls automatically get session handling
- **Configurable**: Adjust warning thresholds and check intervals
- **Maintainable**: Clear separation of concerns
- **🆕 Activity Tracking**: Easy hooks to track user activity
- **🆕 Automatic Cleanup**: Users automatically logged out after inactivity

## Configuration

### Session Expiry Settings
```typescript
// In sessionManager.ts
private readonly SESSION_EXPIRY_HOURS = 24 * 7; // 7 days
private readonly SESSION_WARNING_HOURS = 24 * 6; // 6 days
private readonly INACTIVITY_LOGOUT_HOURS = 24 * 7; // 7 days of inactivity
```

### Monitoring Intervals
```typescript
// In sessionMonitor.ts
private readonly CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
private readonly WARNING_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
private readonly INACTIVITY_WARNING_DAYS = 6; // Warn after 6 days
```

## Migration Guide

### For Existing Code:
1. **No Breaking Changes**: Existing API calls work the same way
2. **Automatic Improvements**: Better error handling out of the box
3. **Optional Features**: Session monitoring can be enabled/disabled
4. **🆕 Activity Tracking**: Add activity tracking to important user interactions

### For New Features:
1. **Use Session Status Component**: Add to screens for user feedback
2. **Check Session Before Actions**: Use `sessionMonitor.checkSessionBeforeAction()`
3. **Handle Session Errors**: Catch and handle session expiry errors gracefully
4. **🆕 Track User Activity**: Use `useActivityTracker` hook in components
5. **🆕 Handle Inactivity**: Check for inactivity before important actions

## Testing

### Test Session Expiry:
1. Set session expiry to a short time (e.g., 1 hour)
2. Wait for session to expire
3. Make API calls and verify error messages
4. Check that session monitoring works correctly

### Test Token Regeneration:
1. Use valid session
2. Simulate token expiry
3. Verify token regeneration works
4. Check error handling when regeneration fails

### 🆕 Test Inactivity Logout:
1. Set inactivity threshold to a short time (e.g., 1 hour)
2. Don't use the app for the threshold period
3. Verify automatic logout occurs
4. Check that activity tracking resets the timer

## Troubleshooting

### Common Issues:

1. **"Invalid Username" still appears**
   - Check if using old API endpoints
   - Verify session manager is properly initialized
   - Ensure error handling is updated

2. **Session warnings not showing**
   - Check if session monitor is started
   - Verify session expiry settings
   - Check console for errors

3. **Token regeneration failing**
   - Verify server accepts empty password for regeneration
   - Check network connectivity
   - Review server logs for authentication issues

4. **🆕 Inactivity logout not working**
   - Check if activity tracking is being called
   - Verify inactivity threshold settings
   - Ensure session monitor is running

### Debug Commands:
```typescript
// Check session status
const session = await sessionManager.getCurrentSession();
console.log('Session:', session);

// Check session expiry
const info = await sessionManager.getSessionExpiryInfo();
console.log('Session Info:', info);

// 🆕 Check inactivity status
const inactivityInfo = await sessionManager.getInactivityInfo();
console.log('Inactivity Info:', inactivityInfo);

// Test token regeneration
const newToken = await apiService.regenerateToken();
console.log('New Token:', newToken);

// 🆕 Test activity tracking
await sessionMonitor.trackUserActivity();
console.log('Activity tracked');
``` 