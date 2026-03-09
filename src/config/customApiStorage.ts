/**
 * For log2space-common: store and retrieve user-entered API domain (protocol + domain).
 * Used when API URL is not fixed; in-memory cache is synced from AsyncStorage at app init.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PROTOCOL = 'log2space_custom_api_protocol';
const STORAGE_KEY_DOMAIN = 'log2space_custom_api_domain';

let inMemoryProtocol: string | null = null;
let inMemoryDomain: string | null = null;

export type CustomApi = { protocol: 'https://' | 'http://'; domain: string };

export function getCustomApi(): CustomApi | null {
  if (inMemoryDomain && inMemoryDomain.trim().length > 0) {
    const protocol = (inMemoryProtocol === 'http://' ? 'http://' : 'https://') as 'https://' | 'http://';
    return { protocol, domain: inMemoryDomain.trim() };
  }
  return null;
}

export function setCustomApi(protocol: 'https://' | 'http://', domain: string): void {
  const d = domain.trim();
  inMemoryProtocol = protocol;
  inMemoryDomain = d || null;
  AsyncStorage.setItem(STORAGE_KEY_PROTOCOL, protocol).catch(() => {});
  AsyncStorage.setItem(STORAGE_KEY_DOMAIN, d).catch(() => {});
}

export async function loadFromStorage(): Promise<void> {
  try {
    const [p, d] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_PROTOCOL),
      AsyncStorage.getItem(STORAGE_KEY_DOMAIN),
    ]);
    inMemoryProtocol = p || 'https://';
    inMemoryDomain = d && d.trim().length > 0 ? d.trim() : null;
  } catch {
    inMemoryProtocol = 'https://';
    inMemoryDomain = null;
  }
}

export function clearCustomApi(): void {
  inMemoryProtocol = null;
  inMemoryDomain = null;
  AsyncStorage.removeItem(STORAGE_KEY_PROTOCOL).catch(() => {});
  AsyncStorage.removeItem(STORAGE_KEY_DOMAIN).catch(() => {});
}
