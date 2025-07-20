# Auto Data Reload System

## Overview

The app now includes an intelligent auto data reload system that automatically refreshes user data when the app comes back from background after extended periods of inactivity. This ensures that users always see the most up-to-date information without manual intervention.

## How It Works

### 1. Background/Foreground Detection
- **App State Monitoring**: The system monitors when the app goes to background and comes back to foreground
- **Time Tracking**: Records the exact time when the app goes to background
- **Threshold Check**: When the app becomes active, checks if it was in background for more than 4 hours

### 2. Automatic Data Reload
- **Trigger Conditions**: 
  - App becomes active after being in background for 4+ hours
  - User navigates to a screen that hasn't been refreshed recently
  - Manual trigger through hooks
- **Data Refreshed**:
  - User account data (balance, plan details, usage)
  - Session information
  - Any other dynamic data that might have changed

### 3. Smart Reload Logic
- **Session Validation**: Checks if user is still logged in before attempting reload
- **Token Refresh**: Automatically refreshes expired tokens during reload
- **Error Handling**: Gracefully handles network errors and continues with existing data
- **User Experience**: Reload happens silently in background without interrupting user

## Implementation Details

### Core Components

#### 1. AutoDataReloader Service (`src/services/autoDataReloader.ts`)
```typescript
// Singleton service that handles app state monitoring
const autoDataReloader = AutoDataReloader.getInstance();

// Automatically reloads data when app becomes active after 4+ hours
await autoDataReloader.autoReloadUserData();
```

#### 2. Auto Data Reload Hooks (`src/utils/useAutoDataReload.ts`)
```typescript
// Hook for general auto reload functionality
const { reloadData, checkIfReloadNeeded } = useAutoDataReload({
  onReloadStart: () => console.log('Reload starting...'),
  onReloadSuccess: (data) => console.log('Reload successful'),
  onReloadError: (error) => console.log('Reload failed:', error)
});

// Hook specifically for screens
const { reloadOnFocus } = useScreenDataReload({
  onReloadSuccess: () => fetchScreenData()
});
```

### Integration in Screens

#### HomeScreen Integration
```typescript
const { reloadOnFocus } = useScreenDataReload({
  onReloadStart: () => console.log('Auto reload starting...'),
  onReloadSuccess: (data) => {
    console.log('Auto reload successful, refreshing screen data');
    fetchAccountData(); // Refresh the screen data
  },
  onReloadError: (error) => console.log('Auto reload failed:', error)
});

// Auto reload when screen comes into focus
useFocusEffect(
  React.useCallback(() => {
    reloadOnFocus();
  }, [reloadOnFocus])
);
```

#### SessionsScreen Integration
```typescript
const { reloadOnFocus } = useScreenDataReload({
  onReloadStart: () => console.log('Auto reload starting in SessionsScreen...'),
  onReloadSuccess: (data) => {
    console.log('Auto reload successful in SessionsScreen, refreshing data');
    fetchSessions(); // Refresh sessions data
  },
  onReloadError: (error) => console.log('Auto reload failed in SessionsScreen:', error)
});
```

## Configuration

### Background Threshold
- **Default**: 4 hours
- **Configurable**: Can be changed in `AutoDataReloader.BACKGROUND_THRESHOLD_HOURS`
- **Logic**: Only triggers reload if app was in background for longer than threshold

### Reload Frequency
- **App Launch**: Checks if reload is needed on app startup
- **Screen Focus**: Checks when user navigates to screens
- **Background Return**: Checks when app becomes active from background

## User Experience

### What Users See
1. **Seamless Experience**: Reload happens automatically in background
2. **No Interruption**: Users can continue using the app normally
3. **Fresh Data**: All screens show the most recent information
4. **No Manual Action**: No need to pull-to-refresh or manually reload

### Error Handling
- **Network Issues**: If reload fails, app continues with existing data
- **Session Issues**: Automatically handles token refresh and session validation
- **Graceful Degradation**: App remains functional even if auto-reload fails

## Benefits

### For Users
- **Always Fresh Data**: No more stale information after long periods
- **Better Experience**: No need to manually refresh screens
- **Reliable Information**: Account balances, usage, and status are always current

### For Developers
- **Centralized Logic**: All auto-reload logic in one place
- **Easy Integration**: Simple hooks for screen integration
- **Configurable**: Easy to adjust thresholds and behavior
- **Robust**: Handles edge cases and errors gracefully

## Testing

### Manual Testing
1. **Background Test**: Put app in background for 4+ hours, then bring to foreground
2. **Screen Navigation**: Navigate between screens after long periods
3. **Network Issues**: Test behavior when network is unavailable
4. **Session Expiry**: Test with expired sessions

### Expected Behavior
- ✅ Data reloads automatically after 4+ hours in background
- ✅ Screens refresh when focused after long periods
- ✅ No reload for short background periods (< 4 hours)
- ✅ Graceful handling of network errors
- ✅ Automatic token refresh during reload

## Future Enhancements

### Potential Improvements
1. **Adaptive Thresholds**: Different thresholds for different types of data
2. **Selective Reload**: Only reload specific data that's likely to change
3. **User Preferences**: Allow users to configure auto-reload settings
4. **Analytics**: Track reload success rates and user patterns
5. **Offline Support**: Queue reloads for when network becomes available

### Performance Optimizations
1. **Batch Reloads**: Group multiple API calls together
2. **Caching**: Cache data to reduce unnecessary reloads
3. **Smart Timing**: Reload during low-activity periods
4. **Background Processing**: Use background tasks for heavy reloads 