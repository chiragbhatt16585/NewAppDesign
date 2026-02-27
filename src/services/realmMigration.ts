/**
 * One-time migration: copy auth/session data from the OLD Microscan app's Realm DB
 * (microscanEndUserApp-master-new) into AsyncStorage so existing users stay logged in
 * after updating to the new app.
 *
 * Old app: Realm ^12.14.0, Credentials (username, password, Authentication),
 * encryptionKey: new Int8Array(64). Default path is app's files dir (default.realm).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const REALM_MIGRATION_DONE_KEY = 'realm_migration_done';
const USER_SESSION_KEY = 'user_session';
const STORED_USERNAME_KEY = 'stored_username';
const STORED_PASSWORD_KEY = 'stored_password';

// Exact schema from old app: src/utils/db.js (microscanEndUserApp-master-new)
const credSchema = {
  name: 'Credentials',
  properties: {
    username: 'string',
    password: 'string',
    Authentication: 'string',
  },
};

const stringObjectSchema = {
  name: 'stringObject',
  properties: { value: 'string' },
};

const menuSchema = {
  name: 'Menu',
  properties: {
    menuItems: { type: 'list', objectType: 'stringObject' },
  },
};

const signedInPreferenceSchema = {
  name: 'signedInPreference',
  properties: { keepMeSignedIn: 'bool' },
};

const launguagePreferenceSchema = {
  name: 'launguageObject',
  properties: { launguage: 'string' },
};

const OLD_REALM_ENCRYPTION_KEY = new Int8Array(64);

const baseRealmConfig = {
  schema: [
    credSchema,
    stringObjectSchema,
    menuSchema,
    signedInPreferenceSchema,
    launguagePreferenceSchema,
  ],
  encryptionKey: OLD_REALM_ENCRYPTION_KEY,
};

/**
 * Open Realm at path (or default), read Credentials, migrate to AsyncStorage. Returns true if migrated.
 */
async function tryOpenRealmAndMigrate(Realm: any, path?: string): Promise<boolean> {
  const config = path ? { ...baseRealmConfig, path } as any : (baseRealmConfig as any);
  const realm = await Realm.open(config);
  try {
    const openedPath = typeof realm.path === 'string' ? realm.path : path || '(default)';
    const credentials = realm.objects('Credentials');
    const count = credentials.length;
    if (__DEV__) {
      console.log('[RealmMigration] Opened Realm at:', openedPath, '| Credentials count:', count);
    }
    const cred = count > 0 ? (credentials[0] as any) : null;
    const username = cred?.username ?? null;
    const token = cred?.Authentication ?? null;
    const password = cred?.password ?? null;
    if (!username || !token) {
      return false;
    }
    const now = Date.now();
    const newSession = {
      isLoggedIn: true,
      username,
      token,
      lastLoginTime: now,
      lastActivityTime: now,
      clientName: undefined,
    };
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(newSession));
    await AsyncStorage.setItem(STORED_USERNAME_KEY, username);
    if (password) {
      await AsyncStorage.setItem(STORED_PASSWORD_KEY, password);
    }
    if (__DEV__) {
      console.log('[RealmMigration] Migrated session for user:', username.substring(0, 3) + '***');
    }
    return true;
  } finally {
    realm.close();
  }
}

export async function migrateRealmToAsyncStorage(): Promise<void> {
  try {
    const alreadyDone = await AsyncStorage.getItem(REALM_MIGRATION_DONE_KEY);
    if (alreadyDone === 'true') {
      if (__DEV__) console.log('[RealmMigration] Already migrated, skipping');
      return;
    }

    const existingSession = await AsyncStorage.getItem(USER_SESSION_KEY);
    if (existingSession) {
      if (__DEV__) console.log('[RealmMigration] AsyncStorage already has session');
      await AsyncStorage.setItem(REALM_MIGRATION_DONE_KEY, 'true');
      return;
    }

    // Realm native binary not used in this app (avoids "Could not find the realm binary"). Skip migration.
    await AsyncStorage.setItem(REALM_MIGRATION_DONE_KEY, 'true');
    return;

    // --- Realm migration disabled; code below never runs ---
    if (__DEV__) {
      console.log('[RealmMigration] Looking for old Realm credentials...');
    }
    let Realm: any;
    try {
      Realm = require('realm');
    } catch (loadErr) {
      const msg = (loadErr as Error)?.message ?? String(loadErr);
      if (__DEV__) {
        console.warn('[RealmMigration] Realm not available:', msg);
      }
      await AsyncStorage.setItem(REALM_MIGRATION_DONE_KEY, 'true');
      return;
    }
    let migrated = false;

    // 1) Try app documents dir first (Android getFilesDir() = DocumentDir; old app default.realm lives here)
    try {
      const RNFetchBlob = require('rn-fetch-blob').default;
      const docDir = RNFetchBlob.fs.dirs?.DocumentDir;
      if (docDir) {
        const defaultPath = `${docDir}/default.realm`;
        const exists = await RNFetchBlob.fs.exists(defaultPath);
        if (__DEV__) console.log('[RealmMigration] DocumentDir/default.realm exists?', exists, 'path:', defaultPath);
        if (exists) {
          migrated = await tryOpenRealmAndMigrate(Realm, defaultPath);
        }
        // Also list dir and try any .realm file (in case of different name)
        if (!migrated) {
          const list = await (RNFetchBlob.fs as any).ls(docDir).catch(() => [] as string[]);
          const realmFiles = Array.isArray(list) ? list.filter((f: string) => f && (f === 'default.realm' || f.endsWith('.realm'))) : [];
          for (const name of realmFiles) {
            if (name === 'default.realm') continue; // already tried
            const fullPath = `${docDir}/${name}`;
            try {
              migrated = await tryOpenRealmAndMigrate(Realm, fullPath);
              if (migrated) break;
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      if (__DEV__) console.log('[RealmMigration] DocumentDir attempt failed:', (e as Error)?.message);
    }

    // 2) Try default path (no path = Realm's built-in default, same app so same dir after update)
    if (!migrated) {
      try {
        if (__DEV__) console.log('[RealmMigration] Trying default Realm path...');
        migrated = await tryOpenRealmAndMigrate(Realm);
      } catch (e) {
        if (__DEV__) console.log('[RealmMigration] Default path failed:', (e as Error)?.message);
      }
    }

    // 3) Try CacheDir (some setups use this)
    if (!migrated) {
      try {
        const RNFetchBlob = require('rn-fetch-blob').default;
        const cacheDir = RNFetchBlob.fs.dirs?.CacheDir;
        if (cacheDir) {
          const p = `${cacheDir}/default.realm`;
          if (await RNFetchBlob.fs.exists(p)) {
            migrated = await tryOpenRealmAndMigrate(Realm, p);
          }
        }
      } catch (_) {}
    }

    if (migrated) {
      await AsyncStorage.setItem(REALM_MIGRATION_DONE_KEY, 'true');
      return;
    }

    // Do NOT set migration_done when no credentials found – retry next launch (e.g. Realm version or path difference)
    if (__DEV__) {
      console.log('[RealmMigration] No credentials found in any Realm path. Will retry next launch. Check that old app used Realm and you were logged in.');
    }
  } catch (error) {
    const msg = (error as Error)?.message ?? String(error);
    if (__DEV__) {
      console.warn('[RealmMigration] Migration error:', msg);
    }
    // If Realm native binary is missing, don't retry every launch
    if (msg.toLowerCase().includes('realm binary') || msg.toLowerCase().includes('could not find')) {
      await AsyncStorage.setItem(REALM_MIGRATION_DONE_KEY, 'true').catch(() => {});
    }
  }
}
