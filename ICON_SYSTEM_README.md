# Icon System Documentation

## Overview
The app now uses a centralized icon system based on React Native Vector Icons (MaterialIcons) for consistent, professional iconography throughout the application.

## Benefits
- ✅ **Consistent Design**: All icons follow the same visual style
- ✅ **Professional Look**: No more mismatched emojis or text symbols
- ✅ **Easy Maintenance**: Centralized icon management
- ✅ **Type Safety**: TypeScript support for icon names
- ✅ **Scalability**: Easy to add new icons and maintain consistency

## Usage

### 1. Import the Icon Library
```typescript
import { ICONS, AppIcon } from '../utils/iconLibrary';
```

### 2. Use Icons in Components
```typescript
// Option 1: Direct icon name usage
<Icon name={ICONS.SETTINGS} size={24} color={colors.primary} />

// Option 2: Using AppIcon wrapper component
<AppIcon name="SETTINGS" size={24} color={colors.primary} />
```

### 3. Available Icons

#### Navigation & UI
- `ARROW_RIGHT` - Right chevron for navigation
- `ARROW_LEFT` - Left chevron for navigation
- `CLOSE` - Close/X button
- `CHECK` - Checkmark for confirmation
- `INFO` - Information icon
- `WARNING` - Warning icon
- `ERROR` - Error icon

#### Settings & Preferences
- `LANGUAGE` - Language selection
- `THEME_LIGHT` - Light theme toggle
- `THEME_DARK` - Dark theme toggle
- `SECURITY` - Security settings
- `LOCK` - PIN/lock settings
- `FINGERPRINT` - Biometric authentication

#### Content & Information
- `HELP` - Help/FAQ
- `DESCRIPTION` - Terms & conditions
- `BUSINESS` - Company information
- `PHONE` - App version/device info
- `NOTE` - Notes/documentation

#### Status Icons
- `CHECK_CIRCLE` - Success/active status
- `CANCEL` - Error/inactive status

#### Common Actions
- `EDIT` - Edit functionality
- `DELETE` - Delete functionality
- `ADD` - Add new item
- `SEARCH` - Search functionality
- `SETTINGS` - General settings
- `HOME` - Home navigation
- `USER` - User profile
- `NOTIFICATIONS` - Notifications
- `LOGOUT` - Logout functionality

## Adding New Icons

1. **Find the icon name** from [Material Icons](https://fonts.google.com/icons?selected=Material+Icons)
2. **Add to the ICONS object** in `src/utils/iconLibrary.ts`
3. **Use consistently** across the app

## Example Implementation

```typescript
// Before (inconsistent emojis)
<Text style={styles.iconText}>🌐</Text>
<Text style={styles.iconText}>🔒</Text>

// After (consistent icons)
<Icon name={ICONS.LANGUAGE} size={24} color={colors.primary} />
<Icon name={ICONS.SECURITY} size={24} color={colors.primary} />
```

## Migration Guide

When updating existing components:
1. Replace emoji/text icons with `ICONS` constants
2. Use `Icon` component from `react-native-vector-icons/MaterialIcons`
3. Import `ICONS` from the icon library
4. Remove unused icon-related styles

## Best Practices

- Always use the `ICONS` constants instead of hardcoded strings
- Maintain consistent icon sizes within similar contexts
- Use appropriate colors that match the theme system
- Consider accessibility - ensure icons have proper contrast
- Keep icon names semantic and descriptive
