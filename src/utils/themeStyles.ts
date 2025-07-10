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
  return isDark ? darkTheme : lightTheme;
}; 