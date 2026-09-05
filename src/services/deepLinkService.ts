import { AppState, Linking, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClientConfig, isMicroscanClient } from '../config/client-config';
import sessionManager from './sessionManager';
import { navigate } from '../navigation/RootNavigation';

const PENDING_DEEP_LINK_KEY = 'pending_deep_link_route';

export type DeepLinkTarget = {
  screen: string;
  params?: Record<string, unknown>;
};

const REFER_FRIEND_HOSTS = new Set([
  'refer-friend',
  'referfriend',
  'refer-a-friend',
  'referafriend',
]);

const REFER_FRIEND_PATHS = new Set([
  '/refer-friend',
  '/referfriend',
  '/refer-a-friend',
  '/download-app', // SMS campaign URL opens Refer Friend when app is installed
]);

let listenerAttached = false;
let lastHandledUrl: string | null = null;
let lastHandledAt = 0;

const isMicroscan = (): boolean => isMicroscanClient();

const normalizePath = (path: string): string => {
  if (!path) {
    return '/';
  }
  const withoutQuery = path.split('?')[0].split('#')[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || '/';
};

/** Parse supported Microscan URLs into an in-app screen target. */
export const parseDeepLinkUrl = (url?: string | null): DeepLinkTarget | null => {
  if (!url || !isMicroscan()) {
    return null;
  }

  const raw = String(url).trim();

  // Fast path for custom scheme (most reliable for adb / warm start)
  if (/^microscan:\/\/(refer-friend|referfriend|refer-a-friend|referafriend)\/?/i.test(raw)) {
    return { screen: 'ReferFriend' };
  }

  try {
    const parsed = new URL(raw);
    const scheme = parsed.protocol.replace(':', '').toLowerCase();
    const host = (parsed.hostname || parsed.host || '').toLowerCase();
    const path = normalizePath(parsed.pathname || '');

    // Custom scheme: microscan://refer-friend
    if (scheme === 'microscan') {
      const hostOrPath = host || path.replace(/^\//, '');
      if (REFER_FRIEND_HOSTS.has(hostOrPath) || REFER_FRIEND_PATHS.has(`/${hostOrPath}`)) {
        return { screen: 'ReferFriend' };
      }
      if (REFER_FRIEND_PATHS.has(path)) {
        return { screen: 'ReferFriend' };
      }
    }

    // HTTPS (App / Universal Links)
    if (scheme === 'https' || scheme === 'http') {
      const isMicroscanHost =
        host === 'www.microscaninternet.com' || host === 'microscaninternet.com';
      if (isMicroscanHost && REFER_FRIEND_PATHS.has(path)) {
        return { screen: 'ReferFriend' };
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[DeepLink] Failed to parse URL:', url, error);
    }
  }

  return null;
};

const persistPendingTarget = async (target: DeepLinkTarget): Promise<void> => {
  try {
    await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, JSON.stringify(target));
    if (__DEV__) {
      console.log('[DeepLink] Saved pending route until login:', target);
    }
  } catch (error) {
    console.warn('[DeepLink] Failed to save pending route:', error);
  }
};

const readPendingTarget = async (): Promise<DeepLinkTarget | null> => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as DeepLinkTarget;
  } catch {
    return null;
  }
};

const clearPendingTarget = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
  } catch {
    // ignore
  }
};

const openTarget = (target: DeepLinkTarget): void => {
  if (__DEV__) {
    console.log('[DeepLink] Navigating to:', target);
  }
  // Prefer replace-like feel for already-open stacks
  navigate(target.screen, target.params);
};

/**
 * Handle a deep link URL.
 * - Logged in → navigate immediately
 * - Logged out → store pending route, open Login
 */
export const handleDeepLinkUrl = async (url?: string | null): Promise<boolean> => {
  if (!url) {
    return false;
  }

  // Prevent double-handling the same intent within 2s (AppState + Linking both fire)
  const now = Date.now();
  if (url === lastHandledUrl && now - lastHandledAt < 2000) {
    return true;
  }

  const target = parseDeepLinkUrl(url);
  if (!target) {
    if (__DEV__) {
      console.log('[DeepLink] URL ignored (no match / not microscan):', url);
    }
    return false;
  }

  lastHandledUrl = url;
  lastHandledAt = now;

  if (__DEV__) {
    console.log('[DeepLink] Matched URL:', url, '→', target);
  }

  const loggedIn = await sessionManager.isLoggedIn();
  if (loggedIn) {
    await clearPendingTarget();
    // Delay so navigation is ready when app was already open (warm start)
    setTimeout(() => openTarget(target), 150);
    return true;
  }

  await persistPendingTarget(target);
  navigate('Login');
  return true;
};

/** After successful login / session restore, open any pending deep-link screen. */
export const consumePendingDeepLink = async (): Promise<boolean> => {
  if (!isMicroscan()) {
    return false;
  }

  const target = await readPendingTarget();
  if (!target?.screen) {
    return false;
  }

  const loggedIn = await sessionManager.isLoggedIn();
  if (!loggedIn) {
    return false;
  }

  await clearPendingTarget();

  // Small delay so Home stack is mounted after login navigation
  setTimeout(() => {
    openTarget(target);
  }, 500);

  return true;
};

const checkCurrentIntentUrl = async (): Promise<void> => {
  try {
    const url = await Linking.getInitialURL();
    if (url) {
      await handleDeepLinkUrl(url);
    }
  } catch (error) {
    console.warn('[DeepLink] checkCurrentIntentUrl failed:', error);
  }
};

/** Call once on app start (NavigationContainer ready). */
export const initializeDeepLinking = (): (() => void) => {
  if (!isMicroscan()) {
    return () => {};
  }

  if (listenerAttached) {
    return () => {};
  }
  listenerAttached = true;

  void checkCurrentIntentUrl();

  const urlSubscription = Linking.addEventListener('url', ({ url }) => {
    void handleDeepLinkUrl(url);
  });

  // Android warm start: intent is often delivered via onNewIntent without a Linking "url" event.
  // Re-check getInitialURL() whenever app becomes active.
  const onAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      void checkCurrentIntentUrl();
      void consumePendingDeepLink();
    }
  };
  const appStateSubscription: NativeEventSubscription = AppState.addEventListener(
    'change',
    onAppStateChange,
  );

  if (__DEV__) {
    console.log('[DeepLink] Listener attached for Microscan');
  }

  return () => {
    listenerAttached = false;
    urlSubscription.remove();
    appStateSubscription.remove();
  };
};
