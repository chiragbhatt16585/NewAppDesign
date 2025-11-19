import { useEffect, useState, useCallback } from 'react';
import menuService, { MenuSettings } from '../services/menuService';
import { useAuth } from '../utils/AuthContext';

export const useMenuSettings = () => {
  const { isAuthenticated } = useAuth();
  const [menu, setMenu] = useState<MenuSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear menu state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[useMenuSettings] User logged out - clearing menu state');
      setMenu(null);
      setError(null);
      setLoading(false);
      // Clear the service cache as well
      menuService.clearCache();
    }
  }, [isAuthenticated]);

  const load = useCallback(async () => {
    // Don't load if not authenticated
    if (!isAuthenticated) {
      console.log('[useMenuSettings] Skipping load - not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.get();
      setMenu(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh only if stale
  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[useMenuSettings] Skipping refresh - not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.refreshIfStale();
      setMenu(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh menu');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Force refresh from server
  const forceRefresh = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[useMenuSettings] Skipping forceRefresh - not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // Clear cache first to ensure fresh data
      menuService.clearCache();
      const data = await menuService.refresh();
      setMenu(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh menu');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  return { menu, loading, error, refresh, forceRefresh };
};

export default useMenuSettings;

