const Realm = require('realm');
import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

// Schema definitions
const credSchema = {
  name: 'Credentials',
  properties: {
    username: 'string',
    password: 'string',
    Authentication: 'string',
    lastLoginTime: 'int?', // timestamp
    isLoggedIn: 'bool?'
  }
};

const userSessionSchema = {
  name: 'UserSession',
  properties: {
    username: 'string',
    token: 'string',
    lastActivityTime: 'int?', // timestamp
    isActive: 'bool?'
  }
};

const clientConfigSchema = {
  name: 'ClientConfig',
  properties: {
    currentClient: 'string?',
    apiUrl: 'string?',
    clientName: 'string?'
  }
};

const appPreferencesSchema = {
  name: 'AppPreferences',
  properties: {
    language: 'string?',
    theme: 'string?',
    keepMeSignedIn: 'bool?'
  }
};

// Migration function
const migration = (oldRealm: any, newRealm: any) => {
  console.log('Realm migration running...');
  console.log('Old schema version:', oldRealm.schemaVersion);
  console.log('New schema version:', newRealm.schemaVersion);

  // Handle schema version 0 to 1 migration
  if (oldRealm.schemaVersion < 1) {
    console.log('Migrating from version 0 to 1');
    // Initial migration - no special handling needed
  }

  // Handle schema version 1 to 2 migration
  if (oldRealm.schemaVersion < 2) {
    console.log('Migrating from version 1 to 2');
    
    // Handle Credentials schema changes if any
    const oldCredentials = oldRealm.objects('Credentials');
    const newCredentials = newRealm.objects('Credentials');
    
    for (let i = 0; i < oldCredentials.length; i++) {
      const oldCred = oldCredentials[i] as any;
      const newCred = newCredentials[i] as any;
      
      // Ensure Authentication field is properly migrated
      if (oldCred.Authentication && !newCred.Authentication) {
        newCred.Authentication = oldCred.Authentication;
      }
      
      // Set default values for new fields
      if (newCred.lastLoginTime === undefined) {
        newCred.lastLoginTime = Date.now();
      }
      if (newCred.isLoggedIn === undefined) {
        newCred.isLoggedIn = true;
      }
    }
  }

  console.log('Migration completed successfully');
};

// Realm configuration
const realmConfig: any = {
  schema: [
    credSchema,
    userSessionSchema,
    clientConfigSchema,
    appPreferencesSchema
  ],
  schemaVersion: 2,
  onMigration: migration,
  deleteRealmIfMigrationNeeded: false
};

// Create Realm Context
const RealmContext = createContext<any>(null);

export const useRealm = () => {
  const realm = useContext(RealmContext);
  if (!realm) {
    throw new Error('useRealm must be used within a RealmProvider');
  }
  return realm;
};

export function useQuery(type: string) {
  const realm = useRealm();
  return realm.objects(type);
}

export const RealmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realm, setRealm] = useState<any>(null);

  useEffect(() => {
    const initRealm = async () => {
      try {
        const realmInstance = await Realm.open(realmConfig);
        setRealm(realmInstance);
        console.log('Realm initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Realm:', error);
      }
    };

    initRealm();

    return () => {
      if (realm) {
        realm.close();
      }
    };
  }, []);

  if (!realm) {
    return null; // or a loading component
  }

  return React.createElement(RealmContext.Provider, { value: realm }, children);
};

// Database API Functions
export const realmApi = {
  // Credentials management
  saveCredentials(realm: any, username: string, password: string, Authentication: string) {
    try {
      realm.write(() => {
        const existing = realm.objects('Credentials');
        realm.delete(existing); // Clear existing data
        realm.create('Credentials', { 
          username, 
          password, 
          Authentication,
          lastLoginTime: Date.now(),
          isLoggedIn: true
        });
      });
      console.log('Credentials saved successfully to Realm');
    } catch (error) {
      console.error('Error saving credentials to Realm:', error);
    }
  },

  getCredentials(realm: any) {
    try {
      const credentials = realm.objects('Credentials');
      return credentials.length > 0 ? credentials[0] : null;
    } catch (error) {
      console.error('Error getting credentials from Realm:', error);
      return null;
    }
  },

  deleteCredentials(realm: any) {
    try {
      realm.write(() => {
        realm.delete(realm.objects('Credentials'));
      });
      console.log('Credentials deleted successfully from Realm');
    } catch (error) {
      console.error('Error deleting credentials from Realm:', error);
    }
  },

  // User session management
  saveUserSession(realm: any, username: string, token: string) {
    try {
      realm.write(() => {
        const existing = realm.objects('UserSession');
        realm.delete(existing); // Clear existing sessions
        realm.create('UserSession', {
          username,
          token,
          lastActivityTime: Date.now(),
          isActive: true
        });
      });
      console.log('User session saved successfully to Realm');
    } catch (error) {
      console.error('Error saving user session to Realm:', error);
    }
  },

  getUserSession(realm: any) {
    try {
      const sessions = realm.objects('UserSession');
      return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      console.error('Error getting user session from Realm:', error);
      return null;
    }
  },

  deleteUserSession(realm: any) {
    try {
      realm.write(() => {
        realm.delete(realm.objects('UserSession'));
      });
      console.log('User session deleted successfully from Realm');
    } catch (error) {
      console.error('Error deleting user session from Realm:', error);
    }
  },

  updateSessionActivity(realm: any) {
    try {
      const session = this.getUserSession(realm);
      if (session) {
        realm.write(() => {
          (session as any).lastActivityTime = Date.now();
        });
        console.log('Session activity updated in Realm');
      }
    } catch (error) {
      console.error('Error updating session activity in Realm:', error);
    }
  },

  // Client configuration management
  saveClientConfig(realm: any, currentClient: string, apiUrl: string, clientName: string) {
    try {
      realm.write(() => {
        const existing = realm.objects('ClientConfig');
        realm.delete(existing); // Clear existing config
        realm.create('ClientConfig', {
          currentClient,
          apiUrl,
          clientName
        });
      });
      console.log('Client config saved successfully to Realm');
    } catch (error) {
      console.error('Error saving client config to Realm:', error);
    }
  },

  getClientConfig(realm: any) {
    try {
      const configs = realm.objects('ClientConfig');
      return configs.length > 0 ? configs[0] : null;
    } catch (error) {
      console.error('Error getting client config from Realm:', error);
      return null;
    }
  },

  // App preferences management
  saveAppPreferences(realm: any, language?: string, theme?: string, keepMeSignedIn?: boolean) {
    try {
      realm.write(() => {
        const existing = realm.objects('AppPreferences');
        realm.delete(existing); // Clear existing preferences
        realm.create('AppPreferences', {
          language: language || 'en',
          theme: theme || 'light',
          keepMeSignedIn: keepMeSignedIn !== undefined ? keepMeSignedIn : true
        });
      });
      console.log('App preferences saved successfully to Realm');
    } catch (error) {
      console.error('Error saving app preferences to Realm:', error);
    }
  },

  getAppPreferences(realm: any) {
    try {
      const preferences = realm.objects('AppPreferences');
      return preferences.length > 0 ? preferences[0] : null;
    } catch (error) {
      console.error('Error getting app preferences from Realm:', error);
      return null;
    }
  },

  // Utility functions
  clearAllData(realm: any) {
    try {
      realm.write(() => {
        realm.delete(realm.objects('Credentials'));
        realm.delete(realm.objects('UserSession'));
        realm.delete(realm.objects('ClientConfig'));
        realm.delete(realm.objects('AppPreferences'));
      });
      console.log('All data cleared from Realm');
    } catch (error) {
      console.error('Error clearing all data from Realm:', error);
    }
  },

  isUserLoggedIn(realm: any): boolean {
    try {
      const credentials = realm.objects('Credentials');
      const sessions = realm.objects('UserSession');
      
      const hasCredentials = credentials.length > 0;
      const hasActiveSession = sessions.length > 0;
      
      if (hasCredentials && hasActiveSession) {
        const cred = credentials[0] as any;
        const session = sessions[0] as any;
        
        // Check if session is recent (within last 24 hours)
        const lastActivity = session.lastActivityTime || 0;
        const isRecent = (Date.now() - lastActivity) < (24 * 60 * 60 * 1000);
        
        return cred.isLoggedIn && session.isActive && isRecent;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  },

  getCurrentUser(realm: any) {
    try {
      const credentials = realm.objects('Credentials');
      const sessions = realm.objects('UserSession');
      
      if (credentials.length > 0 && sessions.length > 0) {
        const cred = credentials[0] as any;
        const session = sessions[0] as any;
        
        return {
          username: cred.username,
          token: session.token,
          lastActivityTime: session.lastActivityTime
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Debug function to print all data
  printAllData(realm: any) {
    try {
      console.log('=== REALM DATA DUMP ===');
      
      const credentials = realm.objects('Credentials');
      console.log('Credentials:', credentials.length);
      credentials.forEach((cred: any, index: number) => {
        console.log(`  ${index + 1}. Username: ${cred.username}, LoggedIn: ${cred.isLoggedIn}`);
      });
      
      const sessions = realm.objects('UserSession');
      console.log('Sessions:', sessions.length);
      sessions.forEach((session: any, index: number) => {
        console.log(`  ${index + 1}. Username: ${session.username}, Active: ${session.isActive}`);
      });
      
      const configs = realm.objects('ClientConfig');
      console.log('Client Configs:', configs.length);
      configs.forEach((config: any, index: number) => {
        console.log(`  ${index + 1}. Client: ${config.currentClient}, API: ${config.apiUrl}`);
      });
      
      const preferences = realm.objects('AppPreferences');
      console.log('App Preferences:', preferences.length);
      preferences.forEach((pref: any, index: number) => {
        console.log(`  ${index + 1}. Language: ${pref.language}, Theme: ${pref.theme}`);
      });
      
      console.log('=== END REALM DATA DUMP ===');
    } catch (error) {
      console.error('Error printing Realm data:', error);
    }
  }
}; 