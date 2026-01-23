import { useMemo, useCallback } from 'react';
import { useForecastStore, BirthData, KundliData } from '@/store/forecastStore';
import { useAuth } from '@/hooks/useAuth';

export interface BirthFormDefaults {
  name?: string;
  email?: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
}

export interface UseSessionKundliResult {
  // State
  hasKundli: boolean;
  kundliId: string | null;
  kundliData: KundliData | null;
  birthData: BirthData | null;

  // Actions
  saveKundli: (id: string, data: KundliData, birthData: BirthData) => void;
  clearKundli: () => void;

  // For forms - pre-fill data if available
  getFormDefaults: () => BirthFormDefaults | null;
}

/**
 * Hook that provides unified access to session kundli data.
 * Combines Zustand store data (for anonymous users) and useAuth data (for authenticated users).
 *
 * Priority:
 * 1. Authenticated user's kundli from database (via useAuth)
 * 2. Session kundli from Zustand store (persisted to localStorage)
 */
export function useSessionKundli(): UseSessionKundliResult {
  const { isAuthenticated, hasKundli: authHasKundli, kundli: authKundli } = useAuth();
  const {
    kundliId: storeKundliId,
    kundliData: storeKundliData,
    birthData: storeBirthData,
    setKundliId,
    setKundliData,
    setBirthData,
    clearSession,
  } = useForecastStore();

  // Determine the effective kundli source
  // Priority: authenticated user's kundli > session store kundli
  const hasKundli = useMemo(() => {
    if (isAuthenticated && authHasKundli) {
      return true;
    }
    return !!(storeKundliId && storeBirthData);
  }, [isAuthenticated, authHasKundli, storeKundliId, storeBirthData]);

  const kundliId = useMemo(() => {
    if (isAuthenticated && authHasKundli && authKundli?.id) {
      return authKundli.id;
    }
    return storeKundliId;
  }, [isAuthenticated, authHasKundli, authKundli, storeKundliId]);

  const kundliData = useMemo(() => {
    // For authenticated users, we don't have the full KundliData in useAuth
    // so we fall back to store data if available
    return storeKundliData;
  }, [storeKundliData]);

  const birthData = useMemo((): BirthData | null => {
    if (isAuthenticated && authHasKundli && authKundli) {
      // Convert auth kundli to BirthData format
      return {
        birthDate: authKundli.birth_date,
        birthTime: authKundli.birth_time,
        birthPlace: authKundli.birth_place,
        name: authKundli.name || undefined,
        email: authKundli.email || undefined,
        lat: authKundli.latitude,
        lon: authKundli.longitude,
      };
    }
    return storeBirthData;
  }, [isAuthenticated, authHasKundli, authKundli, storeBirthData]);

  // Save kundli data to the store
  const saveKundli = useCallback(
    (id: string, data: KundliData, birth: BirthData) => {
      setKundliId(id);
      setKundliData(data);
      setBirthData(birth);
    },
    [setKundliId, setKundliData, setBirthData]
  );

  // Clear kundli data from the store
  const clearKundli = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Get form defaults for pre-filling birth details forms
  const getFormDefaults = useCallback((): BirthFormDefaults | null => {
    if (!hasKundli || !birthData) {
      return null;
    }

    // Ensure we have the required fields
    if (!birthData.birthDate || !birthData.birthTime || !birthData.birthPlace) {
      return null;
    }

    // Need lat/lon for the form
    if (birthData.lat === undefined || birthData.lon === undefined) {
      return null;
    }

    return {
      name: birthData.name,
      email: birthData.email,
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthPlace: birthData.birthPlace,
      latitude: birthData.lat,
      longitude: birthData.lon,
    };
  }, [hasKundli, birthData]);

  return {
    hasKundli,
    kundliId,
    kundliData,
    birthData,
    saveKundli,
    clearKundli,
    getFormDefaults,
  };
}
