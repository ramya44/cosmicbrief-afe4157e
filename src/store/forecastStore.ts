import { create } from 'zustand';

export interface BirthData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

export interface FreeForecast {
  overallTheme: string;
  bestMonths: string[];
  watchfulMonths: string[];
  focusAreas: {
    career: string;
    relationships: string;
    energy: string;
  };
}

export interface PaidForecast {
  quarterlyGuidance: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };
  timingWindows: string[];
  energyManagement: string;
  patternWarnings: string[];
  closingGuidance: string;
}

export interface ForecastState {
  birthData: BirthData | null;
  freeForecast: FreeForecast | null;
  paidForecast: PaidForecast | null;
  isPaid: boolean;
  isLoading: boolean;
  setBirthData: (data: BirthData) => void;
  setForecast: (free: FreeForecast, paid: PaidForecast) => void;
  setIsPaid: (paid: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useForecastStore = create<ForecastState>((set) => ({
  birthData: null,
  freeForecast: null,
  paidForecast: null,
  isPaid: false,
  isLoading: false,
  setBirthData: (data) => set({ birthData: data }),
  setForecast: (free, paid) => set({ freeForecast: free, paidForecast: paid }),
  setIsPaid: (paid) => set({ isPaid: paid }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ birthData: null, freeForecast: null, paidForecast: null, isPaid: false, isLoading: false }),
}));
