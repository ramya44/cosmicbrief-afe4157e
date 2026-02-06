import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth, UserKundli } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';
import { useForecastStore } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';

interface LoginModalOptions {
  onSuccess?: () => void;
  redirectAfterLogin?: string;
}

interface AuthContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  kundli: UserKundli | null;
  hasKundli: boolean;
  isKundliLoading: boolean;

  // Auth actions
  signOut: () => Promise<void>;
  refreshKundli: () => Promise<void>;

  // Modal control
  isLoginModalOpen: boolean;
  loginModalOptions: LoginModalOptions | null;
  openLoginModal: (options?: LoginModalOptions) => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalOptions, setLoginModalOptions] = useState<LoginModalOptions | null>(null);
  const resetStore = useForecastStore((state) => state.reset);

  const openLoginModal = useCallback((options?: LoginModalOptions) => {
    setLoginModalOptions(options || null);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setLoginModalOptions(null);
  }, []);

  // Sign out and clear the forecast store
  const handleSignOut = useCallback(async () => {
    resetStore();
    await supabase.auth.signOut();
  }, [resetStore]);

  const value: AuthContextType = {
    // Spread auth state
    user: auth.user,
    session: auth.session,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    kundli: auth.kundli,
    hasKundli: auth.hasKundli,
    isKundliLoading: auth.isKundliLoading,

    // Auth actions
    signOut: handleSignOut,
    refreshKundli: auth.refreshKundli,

    // Modal control
    isLoginModalOpen,
    loginModalOptions,
    openLoginModal,
    closeLoginModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
