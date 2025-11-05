import { getClientConfig } from '../config/client-config';

// Base light theme defaults; will be overridden by client branding where applicable
export const lightTheme = {
  // Background colors
  background: '#f8f9fa',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Primary colors
  primary: '#1a73e8',
  primaryLight: '#e8f0fe',
  
  // Accent colors
  accent: '#e74c3c',
  accentLight: '#fff5f5',
  
  // Success colors
  success: '#28a745',
  successLight: '#f0fff4',
  
  // Border colors
  border: '#e1e5e9',
  borderLight: '#f0f0f0',
  
  // Shadow colors
  shadow: '#000000',
  
  // Status colors
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
};

// Base dark theme defaults; will be overridden by client branding where applicable
export const darkTheme = {
  // Background colors
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2d2d2d',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  
  // Primary colors
  primary: '#4a9eff',
  primaryLight: '#1a3a5a',
  
  // Accent colors
  accent: '#ff6b6b',
  accentLight: '#3a1a1a',
  
  // Success colors
  success: '#4caf50',
  successLight: '#1a3a1a',
  
  // Border colors
  border: '#404040',
  borderLight: '#333333',
  
  // Shadow colors
  shadow: '#000000',
  
  // Status colors
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

export const getThemeColors = (isDark: boolean) => {
  // Pull client-brand colors (e.g., orange) from central client config
  let primaryFromClient = undefined as string | undefined;
  let secondaryFromClient = undefined as string | undefined;
  try {
    const client = getClientConfig();
    primaryFromClient = client?.branding?.primaryColor;
    secondaryFromClient = client?.branding?.secondaryColor;
  } catch (e) {
    // Fallback to defaults if anything goes wrong
  }

  const base = isDark ? darkTheme : lightTheme;

  // If client provides branding colors, override primary/accent while keeping other tokens
  const overridden = {
    ...base,
    ...(primaryFromClient
      ? {
          primary: primaryFromClient,
          // Use a very light tint bucket for backgrounds that reference primaryLight
          // Keep existing primaryLight if not provided; many components already work with it
        }
      : {}),
    ...(secondaryFromClient
      ? {
          accent: secondaryFromClient,
          // Keep accentLight as-is; callers typically don't rely on exact shade
        }
      : {}),
  } as typeof base;

  return overridden;
};