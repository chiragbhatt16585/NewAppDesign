import { apiService } from './api';
import { getClientConfig } from '../config/client-config';

export type MenuSettings = any;

class MenuService {
  private static instance: MenuService;
  private cache: { data: MenuSettings | null; ts: number } = { data: null, ts: 0 };
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private inFlight: Promise<MenuSettings> | null = null;

  static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  private isFresh(): boolean {
    return Date.now() - this.cache.ts < this.TTL_MS && !!this.cache.data;
  }

  async fetch(): Promise<MenuSettings> {
    const realm = getClientConfig().clientId;
    return apiService.menuSettings(realm);
  }

  async get(): Promise<MenuSettings> {
    if (this.isFresh() && this.cache.data) {
      return this.cache.data;
    }

    if (this.inFlight) return this.inFlight;

    this.inFlight = this.fetch()
      .then((data) => {
        this.cache = { data, ts: Date.now() };
        return data;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  async refresh(): Promise<MenuSettings> {
    const data = await this.fetch();
    this.cache = { data, ts: Date.now() };
    return data;
  }

  // Refresh only if data is stale (older than TTL or optional maxAgeMs)
  async refreshIfStale(maxAgeMs?: number): Promise<MenuSettings | null> {
    const age = Date.now() - this.cache.ts;
    const threshold = typeof maxAgeMs === 'number' ? maxAgeMs : this.TTL_MS;
    if (!this.cache.data || age > threshold) {
      return this.refresh();
    }
    return this.cache.data;
  }

  clearCache(): void {
    this.cache = { data: null, ts: 0 };
  }
}

export default MenuService.getInstance();

