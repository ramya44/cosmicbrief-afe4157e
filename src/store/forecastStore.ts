import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BirthData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  name?: string;
  email?: string;
}

export interface MonthEntry {
  month: string;
  why: string;
}

export interface FreeForecast {
  forecast: string;
}

export interface PaidForecast {
  // Reserved for future paid features in free tier
  // Currently unused since strategic forecast is the premium offering
}

// Strategic Year Map types
export interface LifeAreaPriority {
  area: string;
  priority: number;
  explanation: string;
}

export interface QuarterMap {
  focus: string;
  push: string;
  protect: string;
  avoid: string;
}

export interface Tradeoff {
  tension: string;
  explanation: string;
}

export interface CounterfactualPath {
  path: string;
  description: string;
}

export interface OperatingPrinciple {
  principle: string;
  meaning: string;
}

export interface StrategicForecast {
  year: string;
  strategic_character: string;
  comparison_to_prior_year: string;
  life_area_prioritization: LifeAreaPriority[];
  quarterly_map: {
    Q1: QuarterMap;
    Q2: QuarterMap;
    Q3: QuarterMap;
    Q4: QuarterMap;
  };
  key_tradeoffs: Tradeoff[];
  counterfactual_paths: CounterfactualPath[];
  operating_principles: OperatingPrinciple[];
  deeper_arc: string;
}

export interface ForecastState {
  birthData: BirthData | null;
  freeForecast: FreeForecast | null;
  paidForecast: PaidForecast | null;
  strategicForecast: StrategicForecast | null;
  isPaid: boolean;
  isLoading: boolean;
  isStrategicLoading: boolean;
  setBirthData: (data: BirthData) => void;
  setFreeForecast: (forecast: FreeForecast) => void;
  setForecast: (free: FreeForecast, paid: PaidForecast) => void;
  setStrategicForecast: (forecast: StrategicForecast) => void;
  setIsPaid: (paid: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStrategicLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useForecastStore = create<ForecastState>()(
  persist(
    (set) => ({
      birthData: null,
      freeForecast: null,
      paidForecast: null,
      strategicForecast: null,
      isPaid: false,
      isLoading: false,
      isStrategicLoading: false,
      setBirthData: (data) => set({ birthData: data }),
      setFreeForecast: (forecast) => set({ freeForecast: forecast }),
      setForecast: (free, paid) => set({ freeForecast: free, paidForecast: paid }),
      setStrategicForecast: (forecast) => set({ strategicForecast: forecast }),
      setIsPaid: (paid) => set({ isPaid: paid }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsStrategicLoading: (loading) => set({ isStrategicLoading: loading }),
      reset: () => set({ 
        birthData: null, 
        freeForecast: null, 
        paidForecast: null, 
        strategicForecast: null,
        isPaid: false, 
        isLoading: false,
        isStrategicLoading: false 
      }),
    }),
    {
      name: 'forecast-storage',
      partialize: (state) => ({ 
        birthData: state.birthData,
        freeForecast: state.freeForecast,
        isPaid: state.isPaid,
        strategicForecast: state.strategicForecast,
      }),
    }
  )
);
