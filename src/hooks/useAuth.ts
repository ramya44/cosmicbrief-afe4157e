import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface KundliDetails {
  id: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude: number;
  longitude: number;
  moon_sign: string | null;
  sun_sign: string | null;
  nakshatra: string | null;
  ascendant_sign: string | null;
  ascendant_sign_id: number | null;
  planetary_positions: any[] | null;
  free_vedic_forecast: string | null;
  paid_vedic_forecast: string | null;
  name: string | null;
  email: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  kundli: KundliDetails | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasKundli: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    kundli: null,
    isLoading: true,
    isAuthenticated: false,
    hasKundli: false,
  });

  // Fetch user's kundli data with timeout
  const fetchUserKundli = useCallback(async (userId: string): Promise<KundliDetails | null> => {
    try {
      // Add timeout to prevent hanging forever
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Kundli fetch timeout')), 5000);
      });

      const fetchPromise = supabase
        .from('user_kundli_details')
        .select('id, birth_date, birth_time, birth_place, latitude, longitude, moon_sign, sun_sign, nakshatra, ascendant_sign, ascendant_sign_id, planetary_positions, free_vedic_forecast, paid_vedic_forecast, name, email')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise.then(() => ({ data: null, error: null }))]) as { data: KundliDetails | null; error: any };

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.error('Error fetching kundli:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching kundli:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth error:', error);
          if (mounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        if (session?.user && mounted) {
          // Fetch user's kundli
          const kundli = await fetchUserKundli(session.user.id);

          setState({
            user: session.user,
            session,
            kundli,
            isLoading: false,
            isAuthenticated: true,
            hasKundli: !!kundli,
          });
        } else if (mounted) {
          setState({
            user: null,
            session: null,
            kundli: null,
            isLoading: false,
            isAuthenticated: false,
            hasKundli: false,
          });
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const kundli = await fetchUserKundli(session.user.id);
        setState({
          user: session.user,
          session,
          kundli,
          isLoading: false,
          isAuthenticated: true,
          hasKundli: !!kundli,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          session: null,
          kundli: null,
          isLoading: false,
          isAuthenticated: false,
          hasKundli: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserKundli]);

  // Refresh kundli data
  const refreshKundli = useCallback(async () => {
    if (!state.user) return;
    const kundli = await fetchUserKundli(state.user.id);
    setState(prev => ({
      ...prev,
      kundli,
      hasKundli: !!kundli,
    }));
  }, [state.user, fetchUserKundli]);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    ...state,
    refreshKundli,
    signOut,
  };
}

export type { KundliDetails, AuthState };
