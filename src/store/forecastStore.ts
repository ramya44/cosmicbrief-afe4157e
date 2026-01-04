import { create } from 'zustand';

export interface BirthData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  name?: string;
}

export interface MonthEntry {
  month: string;
  why: string;
}

export interface FreeForecast {
  year: string;
  summary: string;
  comparisonToPriorYear: string;
  sections: {
    careerAndContribution: string;
    moneyAndResources: string;
    relationshipsAndBoundaries: string;
    energyAndWellbeing: string;
  };
}

export interface PaidForecast {
  strongMonths: MonthEntry[];
  measuredAttentionMonths: MonthEntry[];
  closingArc: string;
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
