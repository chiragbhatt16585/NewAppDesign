import { useEffect, useState, useCallback } from 'react';
import menuService, { MenuSettings } from '../services/menuService';

export const useMenuSettings = () => {
  const [menu, setMenu] = useState<MenuSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
  }, []);

  // Refresh only if stale
  const refresh = useCallback(async () => {
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
  }, []);

  // Force refresh from server
  const forceRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.refresh();
      setMenu(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { menu, loading, error, refresh, forceRefresh };
};

export default useMenuSettings;

