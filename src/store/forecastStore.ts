import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BirthData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  name?: string;
  email?: string;
  // Location coordinates from geocoding
  lat?: number;
  lon?: number;
  // UTC-converted birth datetime (ISO string)
  birthDateTimeUtc?: string;
}

export interface MonthEntry {
  month: string;
  why: string;
}

export interface FreeForecastSections {
  who_you_are_right_now: string;
  whats_happening_in_your_life: string;
  pivotal_life_theme: string;
  what_is_becoming_tighter_or_less_forgiving: string;
  upgrade_hook?: string;
}

export interface FreeForecast {
  forecast: string;
  sections?: FreeForecastSections;
  pivotalTheme?: string;
  id?: string; // Database ID for linking email later
  animalSign?: string; // Nakshatra animal from Prokerala
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

export interface SeasonMap {
  what_matters: string;
  lean_into: string;
  protect: string;
  watch_for: string;
}

export interface OperatingPrinciple {
  principle: string;
  meaning: string;
}

export interface StrategicForecast {
  year: string;
  strategic_character: string;
  comparison_to_prior_year: string;
  why_this_year_affects_you_differently?: string;
  life_area_prioritization: LifeAreaPriority[];
  deeper_arc: string;
  seasonal_map: SeasonMap[];
  crossroads_moment?: string;
  operating_principles: OperatingPrinciple[];
}

export interface ForecastState {
  birthData: BirthData | null;
  freeForecast: FreeForecast | null;
  paidForecast: PaidForecast | null;
  strategicForecast: StrategicForecast | null;
  isPaid: boolean;
  isLoading: boolean;
  isStrategicLoading: boolean;
  stripeSessionId: string | null;
  customerEmail: string | null;
  // Guest tokens for secure forecast retrieval
  freeGuestToken: string | null;
  paidGuestToken: string | null;
  paidForecastId: string | null;
  setBirthData: (data: BirthData) => void;
  setFreeForecast: (forecast: FreeForecast) => void;
  setForecast: (free: FreeForecast, paid: PaidForecast) => void;
  setStrategicForecast: (forecast: StrategicForecast | null) => void;
  setIsPaid: (paid: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStrategicLoading: (loading: boolean) => void;
  setStripeSessionId: (sessionId: string | null) => void;
  setCustomerEmail: (email: string | null) => void;
  setFreeGuestToken: (token: string | null) => void;
  setPaidGuestToken: (token: string | null) => void;
  setPaidForecastId: (id: string | null) => void;
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
      stripeSessionId: null,
      customerEmail: null,
      freeGuestToken: null,
      paidGuestToken: null,
      paidForecastId: null,
      setBirthData: (data) => set({ birthData: data }),
      setFreeForecast: (forecast) => set({ freeForecast: forecast }),
      setForecast: (free, paid) => set({ freeForecast: free, paidForecast: paid }),
      setStrategicForecast: (forecast) => set({ strategicForecast: forecast }),
      setIsPaid: (paid) => set({ isPaid: paid }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsStrategicLoading: (loading) => set({ isStrategicLoading: loading }),
      setStripeSessionId: (sessionId) => set({ stripeSessionId: sessionId }),
      setCustomerEmail: (email) => set({ customerEmail: email }),
      setFreeGuestToken: (token) => set({ freeGuestToken: token }),
      setPaidGuestToken: (token) => set({ paidGuestToken: token }),
      setPaidForecastId: (id) => set({ paidForecastId: id }),
      reset: () => set({ 
        birthData: null, 
        freeForecast: null, 
        paidForecast: null, 
        strategicForecast: null,
        isPaid: false, 
        isLoading: false,
        isStrategicLoading: false,
        stripeSessionId: null,
        customerEmail: null,
        freeGuestToken: null,
        paidGuestToken: null,
        paidForecastId: null,
      }),
    }),
    {
      name: 'forecast-storage',
      partialize: (state) => ({ 
        birthData: state.birthData,
        freeForecast: state.freeForecast,
        isPaid: state.isPaid,
        strategicForecast: state.strategicForecast,
        stripeSessionId: state.stripeSessionId,
        customerEmail: state.customerEmail,
        freeGuestToken: state.freeGuestToken,
        paidGuestToken: state.paidGuestToken,
        paidForecastId: state.paidForecastId,
      }),
    }
  )
);
