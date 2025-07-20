import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedData {
  timestamp: number;
  data: any;
}

interface UserData {
  authData: any;
  plansData: any[];
  taxInfo: any;
  payDues: number;
  lastUpdated: number;
}

class DataCacheService {
  private static instance: DataCacheService;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds

  static getInstance(): DataCacheService {
    if (!DataCacheService.instance) {
      DataCacheService.instance = new DataCacheService();
    }
    return DataCacheService.instance;
  }

  async setUserData(userData: UserData): Promise<void> {
    try {
      const cacheData: CachedData = {
        timestamp: Date.now(),
        data: userData
      };
      await AsyncStorage.setItem('userData', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching user data:', error);
    }
  }

  async getUserData(): Promise<UserData | null> {
    try {
      const cached = await AsyncStorage.getItem('userData');
      if (!cached) return null;

      const cacheData: CachedData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - cacheData.timestamp < this.cacheExpiry) {
        return cacheData.data;
      }

      // Cache expired, remove it
      await this.clearUserData();
      return null;
    } catch (error) {
      console.error('Error getting cached user data:', error);
      return null;
    }
  }

  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  async setPlansData(plansData: any[]): Promise<void> {
    try {
      const cacheData: CachedData = {
        timestamp: Date.now(),
        data: plansData
      };
      await AsyncStorage.setItem('plansData', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching plans data:', error);
    }
  }

  async getPlansData(): Promise<any[] | null> {
    try {
      const cached = await AsyncStorage.getItem('plansData');
      if (!cached) return null;

      const cacheData: CachedData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid (plans can be cached longer)
      if (now - cacheData.timestamp < this.cacheExpiry * 2) {
        return cacheData.data;
      }

      // Cache expired, remove it
      await this.clearPlansData();
      return null;
    } catch (error) {
      console.error('Error getting cached plans data:', error);
      return null;
    }
  }

  async clearPlansData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('plansData');
    } catch (error) {
      console.error('Error clearing plans data:', error);
    }
  }

  async setAuthData(authData: any): Promise<void> {
    try {
      const cacheData: CachedData = {
        timestamp: Date.now(),
        data: authData
      };
      await AsyncStorage.setItem('authData', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching auth data:', error);
    }
  }

  async getAuthData(): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem('authData');
      if (!cached) return null;

      const cacheData: CachedData = JSON.parse(cached);
      const now = Date.now();

      // Auth data expires faster (2 minutes)
      if (now - cacheData.timestamp < 2 * 60 * 1000) {
        return cacheData.data;
      }

      // Cache expired, remove it
      await this.clearAuthData();
      return null;
    } catch (error) {
      console.error('Error getting cached auth data:', error);
      return null;
    }
  }

  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authData');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      await this.clearUserData();
      await this.clearPlansData();
      await this.clearAuthData();
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp < this.cacheExpiry;
  }
}

export default DataCacheService.getInstance(); 