import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthDataContextType {
  authData: any | null;
  setAuthData: (data: any | null) => void;
}

const AuthDataContext = createContext<AuthDataContextType | undefined>(undefined);

export const AuthDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authData, setAuthData] = useState<any | null>(null);

  return (
    <AuthDataContext.Provider value={{ authData, setAuthData }}>
      {children}
    </AuthDataContext.Provider>
  );
};

export const useAuthData = () => {
  const context = useContext(AuthDataContext);
  if (context === undefined) {
    throw new Error('useAuthData must be used within an AuthDataProvider');
  }
  return context;
};

