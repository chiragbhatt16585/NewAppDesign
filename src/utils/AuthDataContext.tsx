import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import sessionManager from '../services/sessionManager';

interface AuthDataContextType {
  authData: any | null;
  setAuthData: (data: any | null) => void;
}

const AuthDataContext = createContext<AuthDataContextType | undefined>(undefined);

export const AuthDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authData, setAuthData] = useState<any | null>(null);
  const { isAuthenticated } = useAuth();
  const lastUsernameRef = useRef<string | null>(null);

  // CRITICAL: Clear authData when user logs out OR when authentication changes
  // This ensures no old user data persists in global context
  useEffect(() => {
    const handleAuthChange = async () => {
      if (!isAuthenticated) {
        console.log('[AuthDataContext] 🚨 User logged out - clearing global authData');
        setAuthData(null);
        lastUsernameRef.current = null;
      } else {
        // When user logs in, ALWAYS clear old data first
        console.log('[AuthDataContext] 🚨 User logged in - clearing old global authData first');
        setAuthData(null);
        
        // Then check if username changed
        const session = await sessionManager.getCurrentSession();
        const currentUsername = session?.username || null;
        
        // If username changed, we already cleared it above
        if (currentUsername && lastUsernameRef.current !== null && lastUsernameRef.current !== currentUsername) {
          console.log('[AuthDataContext] 🚨🚨🚨 USERNAME CHANGED ON LOGIN! 🚨🚨🚨');
          console.log('[AuthDataContext] Previous:', lastUsernameRef.current, 'New:', currentUsername);
          // Data already cleared above, just update ref
        }
        
        // Update username ref
        if (currentUsername) {
          lastUsernameRef.current = currentUsername;
        } else {
          lastUsernameRef.current = null;
        }
      }
    };
    
    handleAuthChange();
  }, [isAuthenticated]);

  return (
    <AuthDataContext.Provider value={{ authData, setAuthData }}>
      {children}
    </AuthDataContext.Provider>
  );
};

export const useAuthData = () => {
  const context = useContext(AuthDataContext);
  if (context === undefined) {
    // Avoid hard-crashing the tree (e.g. ErrorBoundary fallback without provider).
    if (__DEV__) {
      console.error('useAuthData must be used within an AuthDataProvider');
    }
    return {
      authData: null,
      setAuthData: () => {},
    };
  }
  return context;
};

