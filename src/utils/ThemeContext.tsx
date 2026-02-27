import React, {createContext, useContext, useState} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // In production, return a default theme instead of throwing
    if (__DEV__) {
      throw new Error('useTheme must be used within a ThemeProvider');
    }
    // Fallback theme for production
    return {
      theme: 'light' as const,
      themeMode: 'system' as const,
      setThemeMode: () => {},
      isDark: false,
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const [themeMode] = useState<ThemeMode>('light');
  const theme: 'light' | 'dark' = 'light';
  const isDark = false;

  // Dark mode is intentionally disabled globally.
  const handleSetThemeMode = (mode: ThemeMode) => {
    if (__DEV__ && mode !== 'light') {
      console.log('Theme override ignored: app is locked to light mode');
    }
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode: handleSetThemeMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 