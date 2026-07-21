import { NativeModules, TurboModuleRegistry } from 'react-native';
import { getClientConfig } from '../config/client-config';

type CleverTapModule = {
  onUserLogin: (profile: Record<string, unknown>) => void;
  profileSet: (profile: Record<string, unknown>) => void;
  recordEvent: (eventName: string, props?: Record<string, unknown>) => void;
  getCleverTapID: (callback: (err: unknown, id: string) => void) => void;
};

let cleverTapModule: CleverTapModule | null | undefined;

const resolveCleverTapNativeModule = (): CleverTapModule | null => {
  try {
    // Do not require('clevertap-react-native') — its entry file calls
    // TurboModuleRegistry.getEnforcing and crashes when the native binary
    // was built without New Architecture.
    const turboModule = TurboModuleRegistry.get('CleverTapReact') as CleverTapModule | null;
    if (turboModule) {
      return turboModule;
    }

    const legacyModule = NativeModules.CleverTapReact as CleverTapModule | undefined;
    if (legacyModule) {
      return legacyModule;
    }
  } catch (error) {
    console.warn('[CleverTap] Native module lookup failed:', error);
  }

  return null;
};

const logCleverTapDebug = (action: string, details: Record<string, unknown>) => {
  if (!__DEV__) {
    return;
  }
  try {
    console.log(`[CleverTap] ${action}`, JSON.stringify(details, null, 2));
  } catch {
    console.log(`[CleverTap] ${action}`, details);
  }
};

const clean = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
    return undefined;
  }
  return text;
};

export const isCleverTapEnabled = (): boolean => {
  const config = getClientConfig();
  return config.clientId === 'microscan' && config.features?.cleverTap === true;
};

const getCleverTap = (): CleverTapModule | null => {
  if (!isCleverTapEnabled()) {
    return null;
  }

  if (cleverTapModule !== undefined) {
    return cleverTapModule;
  }

  cleverTapModule = resolveCleverTapNativeModule();
  if (__DEV__) {
    logCleverTapDebug('native module probe', {
      turboFound: !!TurboModuleRegistry.get('CleverTapReact'),
      nativeFound: !!NativeModules.CleverTapReact,
      resolved: !!cleverTapModule,
    });
  }
  if (!cleverTapModule && __DEV__) {
    console.warn(
      '[CleverTap] Native module not found. Stop Metro, rebuild the app (npx react-native run-android), then log in again.',
    );
  }

  return cleverTapModule;
};

const formatPhone = (phone?: string): string | undefined => {
  if (!phone) {
    return undefined;
  }
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return undefined;
  }
  if (phone.startsWith('+')) {
    return phone;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return `+${digits}`;
};

const pickAuthField = (
  authData: Record<string, unknown> | null | undefined,
  keys: string[],
): string | undefined => {
  if (!authData) {
    return undefined;
  }

  for (const key of keys) {
    const value = clean(authData[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
};

const normalizeAuthUserData = (
  authData: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined => {
  if (!authData) {
    return authData;
  }

  const nested = authData.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    // Merge so top-level fields (e.g. renew_date) are not lost when nested data exists
    return {
      ...authData,
      ...(nested as Record<string, unknown>),
    };
  }

  return authData;
};

const getUsageDetail = (
  authData: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null => {
  const usage = authData?.usage_details;
  if (Array.isArray(usage) && usage.length > 0 && usage[0] && typeof usage[0] === 'object') {
    return usage[0] as Record<string, unknown>;
  }
  return null;
};

const getPlanName = (
  authData: Record<string, unknown> | null | undefined,
): string | undefined => {
  const usage = getUsageDetail(authData);
  return (
    pickAuthField(authData, [
      'current_plan',
      'current_plan1',
      'currentPlan',
      'plan_name',
      'planName',
    ]) ||
    pickAuthField(usage, ['plan_name', 'current_plan', 'planname', 'name'])
  );
};

const getPlanValidity = (
  authData: Record<string, unknown> | null | undefined,
): string | undefined => {
  const usage = getUsageDetail(authData);
  const days =
    pickAuthField(authData, [
      'plan_days',
      'plan_validity',
      'planValidity',
      'planDuration',
      'validity',
    ]) || pickAuthField(usage, ['plan_days', 'days', 'validity', 'total_days']);

  if (!days) {
    return undefined;
  }

  // Keep "Unlimited" etc. as-is; otherwise normalize to "X Days"
  if (/^\d+$/.test(days)) {
    return `${days} Days`;
  }
  return days;
};

/**
 * Convert API date strings to Unix epoch seconds for CleverTap date properties.
 * CleverTap date format: `$D_<epochSeconds>` (e.g. `$D_1711497600`).
 *
 * Microscan authUser often returns dates like `15-Mar-2025` / `15-03-2025`.
 * Hermes `new Date('15-Mar-2025')` can be Invalid — parse month names explicitly.
 */
const MONTH_NAME_TO_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const toEpochSeconds = (value: unknown): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  // Already a unix timestamp (seconds or milliseconds)
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) {
      return undefined;
    }
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }

  const raw = String(value).trim();
  if (!raw) {
    return undefined;
  }

  const invalids = new Set([
    'N/A',
    'NA',
    '-',
    'NULL',
    'UNDEFINED',
    '0',
    '0000-00-00',
    '0000-00-00 00:00:00',
  ]);
  if (invalids.has(raw.toUpperCase())) {
    return undefined;
  }

  // Numeric string epoch
  if (/^\d{9,13}$/.test(raw)) {
    const num = Number(raw);
    return num > 1e12 ? Math.floor(num / 1000) : Math.floor(num);
  }

  const buildEpoch = (
    year: number,
    monthIndex: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
  ): number | undefined => {
    if (year < 1970 || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
      return undefined;
    }
    const parsed = new Date(year, monthIndex, day, hour, minute, second);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    // Guard against JS date overflow (e.g. day 32 → next month)
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== monthIndex ||
      parsed.getDate() !== day
    ) {
      return undefined;
    }
    return Math.floor(parsed.getTime() / 1000);
  };

  /** Expand 2-digit year: 00–69 → 2000–2069, 70–99 → 1970–1999 */
  const expandYear = (yearToken: string): number => {
    const n = Number(yearToken);
    if (yearToken.length <= 2) {
      return n < 70 ? 2000 + n : 1900 + n;
    }
    return n;
  };

  // Microscan format: "26-Nov,25 13:00" / "19-Feb,27 13:00"
  // Also: "15-Mar-2025", "01 Jul 2026", "15-Mar,2025 13:00:00"
  const dMonY = raw.match(
    /^(\d{1,2})[\/\-\s]+([A-Za-z]{3,9}),?[\/\-\s]*(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (dMonY) {
    const monthIndex = MONTH_NAME_TO_INDEX[dMonY[2].toLowerCase()];
    if (monthIndex !== undefined) {
      const epoch = buildEpoch(
        expandYear(dMonY[3]),
        monthIndex,
        Number(dMonY[1]),
        dMonY[4] ? Number(dMonY[4]) : 0,
        dMonY[5] ? Number(dMonY[5]) : 0,
        dMonY[6] ? Number(dMonY[6]) : 0,
      );
      if (epoch !== undefined) {
        return epoch;
      }
    }
  }

  // dd-mm-yyyy or dd/mm/yyyy (common in ISP APIs)
  const dmy = raw.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (dmy) {
    const epoch = buildEpoch(
      Number(dmy[3]),
      Number(dmy[2]) - 1,
      Number(dmy[1]),
      dmy[4] ? Number(dmy[4]) : 0,
      dmy[5] ? Number(dmy[5]) : 0,
      dmy[6] ? Number(dmy[6]) : 0,
    );
    if (epoch !== undefined) {
      return epoch;
    }
  }

  // yyyy-mm-dd / yyyy-mm-dd HH:mm:ss
  const ymd = raw.match(
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (ymd) {
    const epoch = buildEpoch(
      Number(ymd[1]),
      Number(ymd[2]) - 1,
      Number(ymd[3]),
      ymd[4] ? Number(ymd[4]) : 0,
      ymd[5] ? Number(ymd[5]) : 0,
      ymd[6] ? Number(ymd[6]) : 0,
    );
    if (epoch !== undefined) {
      return epoch;
    }
  }

  // Last resort: native Date parse (ISO etc.)
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return Math.floor(parsed.getTime() / 1000);
  }

  return undefined;
};

/** CleverTap date property value: `$D_<epochSeconds>` */
const toCleverTapEpochDate = (value: unknown): string | undefined => {
  const epoch = toEpochSeconds(value);
  if (epoch === undefined) {
    return undefined;
  }
  return `$D_${epoch}`;
};

const getDateFieldRaw = (
  authData: Record<string, unknown> | null | undefined,
  keys: string[],
): unknown => {
  if (!authData) {
    return undefined;
  }

  for (const key of keys) {
    const value = authData[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  const usage = getUsageDetail(authData);
  if (usage) {
    for (const key of keys) {
      const value = usage[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }
  }

  return undefined;
};

const setIfPresent = (
  profile: Record<string, unknown>,
  key: string,
  value: string | boolean | number | undefined,
): void => {
  if (value === undefined || value === null || value === '') {
    return;
  }
  profile[key] = value;
};

const buildProfileFromAuthData = (
  authData: Record<string, unknown> | null | undefined,
  username: string,
): Record<string, unknown> => {
  const normalizedAuthData = normalizeAuthUserData(authData);
  const identity =
    pickAuthField(normalizedAuthData, ['username', 'Username']) || clean(username);
  if (!identity) {
    return {};
  }

  const name =
    pickAuthField(normalizedAuthData, ['full_name', 'Name', 'name']) ||
    `${pickAuthField(normalizedAuthData, ['first_name']) || ''} ${pickAuthField(normalizedAuthData, ['last_name']) || ''}`.trim() ||
    identity;

  const email = pickAuthField(normalizedAuthData, ['primary_email', 'Email', 'email']);
  const phone = formatPhone(
    pickAuthField(normalizedAuthData, [
      'primary_mobile',
      'Phone',
      'phone',
      'mobile',
      'mobile_no',
    ]),
  );
  const accountStatus = pickAuthField(normalizedAuthData, [
    'user_status',
    'Account Status',
    'account_status',
    'status',
  ]);
  const city = pickAuthField(normalizedAuthData, [
    'city_name',
    'City',
    'city',
  ]);
  const renewDateRaw = getDateFieldRaw(normalizedAuthData, [
    'renew_date',
    'Renew Date',
    'renewal_date',
    'renewDate',
  ]);
  const expiryDateRaw = getDateFieldRaw(normalizedAuthData, [
    'exp_date',
    'Expiry Date',
    'expiry_date',
    'expiryDate',
    'plan_expiry',
    'plan_exp_date',
  ]);
  const renewDate = toCleverTapEpochDate(renewDateRaw);
  const expiryDate = toCleverTapEpochDate(expiryDateRaw);

  if (__DEV__) {
    logCleverTapDebug('date conversion', {
      renew_date_raw: renewDateRaw ?? null,
      renew_date_epoch: renewDate ?? null,
      exp_date_raw: expiryDateRaw ?? null,
      exp_date_epoch: expiryDate ?? null,
    });
  }
  const franchisee = pickAuthField(normalizedAuthData, [
    'franchiseename',
    'franchisee_name',
    'franchise_name',
    'Franchisee',
    'admin_login_id',
  ]);
  const planName = getPlanName(normalizedAuthData);
  const planValidity = getPlanValidity(normalizedAuthData);

  // Exact CleverTap property names requested by Microscan
  const profile: Record<string, unknown> = {
    Identity: identity,
    Name: name,
    'MSG-whatsapp': Boolean(phone),
  };

  setIfPresent(profile, 'Email', email);
  setIfPresent(profile, 'Phone', phone);
  setIfPresent(profile, 'Account Status', accountStatus);
  setIfPresent(profile, 'City', city);
  setIfPresent(profile, 'Renew Date', renewDate);
  setIfPresent(profile, 'Expiry Date', expiryDate);
  setIfPresent(profile, 'Franchisee', franchisee);
  // Payment Link intentionally not sent to CleverTap for now
  setIfPresent(profile, 'Plan Name', planName);
  setIfPresent(profile, 'Plan Validity', planValidity);

  return profile;
};

const applyCleverTapProfileSet = (
  cleverTap: CleverTapModule,
  authData: Record<string, unknown> | null | undefined,
  username: string,
  source: string,
): void => {
  logAuthFieldsUsed(source, authData, username);

  const profile = buildProfileFromAuthData(authData, username);
  if (!profile.Identity) {
    logCleverTapDebug(`${source} skipped`, {
      reason: 'Missing Identity/username',
      username,
    });
    return;
  }

  const { Identity: _identity, ...profilePayload } = profile;

  logCleverTapDebug(`${source} => sending profile`, profilePayload);
  cleverTap.profileSet(profilePayload);
  logCleverTapId(cleverTap, source);
};

const logCleverTapId = (cleverTap: CleverTapModule, source: string) => {
  if (!__DEV__ || typeof cleverTap.getCleverTapID !== 'function') {
    return;
  }

  cleverTap.getCleverTapID((err, id) => {
    logCleverTapDebug(`${source} => getCleverTapID response`, {
      success: !err,
      error: err ? String(err) : null,
      cleverTapId: id || null,
    });
  });
};

const logAuthFieldsUsed = (
  source: string,
  authData: Record<string, unknown> | null | undefined,
  username: string,
) => {
  if (!__DEV__) {
    return;
  }

  const normalizedAuthData = normalizeAuthUserData(authData);
  const phone = formatPhone(
    pickAuthField(normalizedAuthData, [
      'primary_mobile',
      'Phone',
      'phone',
      'mobile',
      'mobile_no',
    ]),
  );

  logCleverTapDebug(`${source} => authUser/login fields used for mapping`, {
    username,
    Identity: pickAuthField(normalizedAuthData, ['username', 'Username']) || clean(username),
    'Account Status':
      pickAuthField(normalizedAuthData, ['user_status', 'Account Status', 'account_status']) ||
      null,
    City: pickAuthField(normalizedAuthData, ['city_name', 'City', 'city']) || null,
    Email: pickAuthField(normalizedAuthData, ['primary_email', 'Email', 'email']) || null,
    'Renew Date':
      toCleverTapEpochDate(
        getDateFieldRaw(normalizedAuthData, ['renew_date', 'Renew Date', 'renewal_date', 'renewDate']),
      ) || null,
    'Expiry Date':
      toCleverTapEpochDate(
        getDateFieldRaw(normalizedAuthData, [
          'exp_date',
          'Expiry Date',
          'expiry_date',
          'expiryDate',
          'plan_expiry',
          'plan_exp_date',
        ]),
      ) || null,
    Franchisee:
      pickAuthField(normalizedAuthData, [
        'franchiseename',
        'franchisee_name',
        'franchise_name',
        'Franchisee',
        'admin_login_id',
      ]) || null,
    'MSG-whatsapp': Boolean(phone),
    Name:
      pickAuthField(normalizedAuthData, ['full_name', 'Name', 'name']) ||
      `${pickAuthField(normalizedAuthData, ['first_name']) || ''} ${pickAuthField(normalizedAuthData, ['last_name']) || ''}`.trim() ||
      null,
    Phone: phone || null,
    'Plan Name': getPlanName(normalizedAuthData) || null,
    'Plan Validity': getPlanValidity(normalizedAuthData) || null,
    authDataKeys: normalizedAuthData ? Object.keys(normalizedAuthData) : [],
  });
};

/** Register CleverTap user identity immediately after login. */
export const registerCleverTapUserOnLogin = (username: string): void => {
  if (!isCleverTapEnabled()) {
    logCleverTapDebug('onUserLogin skipped', {
      reason: 'CleverTap disabled (not microscan build)',
    });
    return;
  }

  const cleverTap = getCleverTap();
  if (!cleverTap) {
    logCleverTapDebug('onUserLogin skipped', {
      reason: 'CleverTap SDK not available',
    });
    return;
  }

  try {
    const identity = clean(username);
    if (!identity) {
      return;
    }

    const profile = { Identity: identity };
    logCleverTapDebug('onUserLogin => sending identity only (authUser sync follows)', profile);
    cleverTap.onUserLogin(profile);
    logCleverTapId(cleverTap, 'onUserLogin');
  } catch (error) {
    logCleverTapDebug('onUserLogin failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.warn('[CleverTap] onUserLogin failed:', error);
  }
};

/** Sync full profile from authUser API response. */
export const syncCleverTapWithAuthUser = (
  username: string,
  authData: Record<string, unknown> | null | undefined,
): void => {
  if (!isCleverTapEnabled()) {
    logCleverTapDebug('authUser sync skipped', {
      reason: 'CleverTap disabled (not microscan build)',
    });
    return;
  }

  const cleverTap = getCleverTap();
  if (!cleverTap || !authData) {
    logCleverTapDebug('authUser sync skipped', {
      reason: !cleverTap ? 'CleverTap SDK not available' : 'authUser response missing',
    });
    return;
  }

  try {
    const profile = buildProfileFromAuthData(authData, username);
    if (!profile.Identity) {
      logCleverTapDebug('authUser sync skipped', {
        reason: 'Missing Identity/username',
        username,
      });
      return;
    }

    logCleverTapDebug('authUser sync => onUserLogin with full profile', profile);
    cleverTap.onUserLogin(profile);
    logCleverTapId(cleverTap, 'authUser sync onUserLogin');
    applyCleverTapProfileSet(cleverTap, authData, username, 'authUser sync profileSet');
  } catch (error) {
    logCleverTapDebug('authUser sync failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.warn('[CleverTap] authUser sync failed:', error);
  }
};

/** Enrich profile after authUser returns account details. */
export const updateCleverTapUserProfile = (
  authData: Record<string, unknown> | null | undefined,
  fallbackUsername: string,
): void => {
  if (!isCleverTapEnabled()) {
    logCleverTapDebug('profileSet skipped', {
      reason: 'CleverTap disabled (not microscan build)',
    });
    return;
  }

  const cleverTap = getCleverTap();
  if (!cleverTap || !authData) {
    logCleverTapDebug('profileSet skipped', {
      reason: !cleverTap ? 'CleverTap SDK not available' : 'authUser response missing',
    });
    return;
  }

  try {
    applyCleverTapProfileSet(cleverTap, authData, fallbackUsername, 'profileSet');
  } catch (error) {
    logCleverTapDebug('profileSet failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.warn('[CleverTap] profileSet failed:', error);
  }
};

export const logCleverTapEvent = (
  eventName: string,
  props?: Record<string, unknown>,
): void => {
  const cleverTap = getCleverTap();
  if (!cleverTap) {
    return;
  }

  try {
    cleverTap.recordEvent(eventName, props || {});
  } catch (error) {
    console.warn('[CleverTap] recordEvent failed:', error);
  }
};
