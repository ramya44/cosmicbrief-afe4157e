import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type UserKundli = Tables<'user_kundli_details'>;

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  kundli: UserKundli | null;
  hasKundli: boolean;
  isKundliLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    kundli: null,
    hasKundli: false,
    isKundliLoading: false,
  });

  // Fetch user's kundli from database with timeout
  const fetchKundli = useCallback(async (userId: string): Promise<UserKundli | null> => {
    console.log('fetchKundli called for user:', userId);
    try {
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => {
          console.warn('fetchKundli timed out after 5s');
          resolve(null);
        }, 5000)
      );

      const fetchPromise = supabase
        .from('user_kundli_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data, error }) => {
          console.log('fetchKundli result:', { data: data ? 'found' : 'null', error });
          if (error) {
            console.error('Error fetching kundli:', error);
            return null;
          }
          return data;
        });

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('fetchKundli final result:', result ? 'kundli found' : 'no kundli');
      return result;
    } catch (err) {
      console.error('Exception fetching kundli:', err);
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
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            isLoading: false,
            isAuthenticated: true,
            isKundliLoading: true,
          }));

          // Fetch kundli for authenticated user
          const kundli = await fetchKundli(session.user.id);
          if (mounted) {
            setState(prev => ({
              ...prev,
              kundli,
              hasKundli: kundli !== null,
              isKundliLoading: false,
            }));
          }
        } else if (mounted) {
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            kundli: null,
            hasKundli: false,
            isKundliLoading: false,
          });
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false, isKundliLoading: false }));
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
          isKundliLoading: event === 'SIGNED_IN',
        }));

        // Fetch kundli on sign in
        if (event === 'SIGNED_IN') {
          const kundli = await fetchKundli(session.user.id);
          if (mounted) {
            setState(prev => ({
              ...prev,
              kundli,
              hasKundli: kundli !== null,
              isKundliLoading: false,
            }));
          }
        }
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          kundli: null,
          hasKundli: false,
          isKundliLoading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchKundli]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (err) {
      console.error('Sign out exception:', err);
    }
  }, []);

  // Refresh kundli data (useful after saving/updating kundli)
  const refreshKundli = useCallback(async () => {
    if (!state.user) return;

    setState(prev => ({ ...prev, isKundliLoading: true }));
    const kundli = await fetchKundli(state.user.id);
    setState(prev => ({
      ...prev,
      kundli,
      hasKundli: kundli !== null,
      isKundliLoading: false,
    }));
  }, [state.user, fetchKundli]);

  return {
    ...state,
    signOut,
    refreshKundli,
  };
}

export type { AuthState };
