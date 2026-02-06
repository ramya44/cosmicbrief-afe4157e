import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useForecastStore } from '@/store/forecastStore';
import { useAuthContext } from '@/context/AuthContext';
import { getDeviceId } from '@/lib/deviceId';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { KundliConflictDialog } from './KundliConflictDialog';
import type { UserKundli } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
  password: z.string().min(1, 'Password is required').max(100),
});

const signupSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type ModalMode = 'login' | 'signup' | 'forgot-password';

export const LoginModal = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    loginModalOptions,
    kundli: savedKundli,
    hasKundli: hasSavedKundli,
    isKundliLoading,
    refreshKundli,
    isAuthenticated,
    user,
  } = useAuthContext();

  const [mode, setMode] = useState<ModalMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingSavedKundli, setPendingSavedKundli] = useState<UserKundli | null>(null);

  const {
    kundliId: sessionKundliId,
    birthData: sessionBirthData,
    setKundliId,
    setBirthData,
    setKundliData,
    setFreeForecast,
    clearSession,
  } = useForecastStore();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Reset forms when modal closes
  useEffect(() => {
    if (!isLoginModalOpen) {
      setMode('login');
      loginForm.reset();
      signupForm.reset();
      forgotPasswordForm.reset();
    }
  }, [isLoginModalOpen, loginForm, signupForm, forgotPasswordForm]);

  // Handle post-login kundli logic
  useEffect(() => {
    if (!isAuthenticated || isKundliLoading || !isLoginModalOpen) return;

    const handlePostLoginKundli = async () => {
      const hasSessionKundli = !!(sessionKundliId && sessionBirthData);

      console.log('handlePostLoginKundli called:', {
        hasSavedKundli,
        hasSessionKundli,
        sessionKundliId,
        hasSessionBirthData: !!sessionBirthData,
        userId: user?.id,
        savedKundliId: savedKundli?.id,
      });

      if (!hasSavedKundli && hasSessionKundli && user) {
        // No saved kundli, but has session kundli -> auto-link to account
        console.log('Auto-linking session kundli to user account:', {
          kundliId: sessionKundliId,
          userId: user.id,
          email: user.email,
        });
        try {
          const { data, error } = await supabase.functions.invoke('update-kundli-details', {
            body: {
              type: 'link_user',
              kundli_id: sessionKundliId,
              user_id: user.id,
              email: user.email,
              device_id: getDeviceId(),
            },
          });

          console.log('Auto-link result:', { data, error });
          if (!error) {
            toast.success('Birth details saved to your account');
            await refreshKundli();
          } else {
            console.error('Error from link_user:', error);
          }
        } catch (err) {
          console.error('Error auto-linking kundli:', err);
        }

        closeLoginModal();
        loginModalOptions?.onSuccess?.();
      } else if (hasSavedKundli && !hasSessionKundli) {
        // Has saved kundli, no session kundli -> load saved into store
        if (savedKundli) {
          setBirthData({
            birthDate: savedKundli.birth_date,
            birthTime: savedKundli.birth_time,
            birthPlace: savedKundli.birth_place,
            name: savedKundli.name || undefined,
            email: savedKundli.email || undefined,
            lat: savedKundli.latitude ?? undefined,
            lon: savedKundli.longitude ?? undefined,
          });
          setKundliId(savedKundli.id);

          // Also load the forecast if it exists
          if (savedKundli.free_vedic_forecast) {
            setFreeForecast({
              forecast: savedKundli.free_vedic_forecast,
              id: savedKundli.id,
              animalSign: savedKundli.animal_sign || undefined,
            });
          }
        }

        closeLoginModal();
        loginModalOptions?.onSuccess?.();
      } else if (hasSavedKundli && hasSessionKundli && savedKundli) {
        // Both exist - check if they're the same
        if (savedKundli.id === sessionKundliId) {
          // Same kundli, no action needed
          closeLoginModal();
          loginModalOptions?.onSuccess?.();
        } else {
          // Different kundli - show conflict dialog
          setPendingSavedKundli(savedKundli);
          setShowConflictDialog(true);
        }
      } else {
        // No saved and no session kundli - just close
        closeLoginModal();
        loginModalOptions?.onSuccess?.();
      }
    };

    handlePostLoginKundli();
  }, [
    isAuthenticated,
    isKundliLoading,
    isLoginModalOpen,
    hasSavedKundli,
    savedKundli,
    sessionKundliId,
    sessionBirthData,
    user,
    closeLoginModal,
    loginModalOptions,
    refreshKundli,
    setBirthData,
    setKundliId,
    setFreeForecast,
  ]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      // Post-login kundli handling happens in useEffect above
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        // Check if user already exists
        const errorMsg = error.message.toLowerCase();
        if (
          errorMsg.includes('already registered') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('user already registered') ||
          errorMsg.includes('email already') ||
          errorMsg.includes('duplicate')
        ) {
          loginForm.setValue('email', data.email);
          setMode('login');
          toast.info('This email is already registered. Please log in.');
          return;
        }
        throw error;
      }

      // Handle case where user already exists (empty identities)
      if (authData.user?.identities?.length === 0) {
        loginForm.setValue('email', data.email);
        setMode('login');
        toast.info('This email is already registered. Please log in.');
        return;
      }

      // Post-login kundli handling happens in useEffect above
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/#/auth?mode=reset`,
      });

      if (error) {
        throw error;
      }

      toast.success('Check your email for the password reset link');
      setMode('login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConflictResolved = (choice: 'keep-saved' | 'use-current') => {
    if (choice === 'keep-saved' && pendingSavedKundli) {
      // Clear session and load saved kundli
      clearSession();
      setBirthData({
        birthDate: pendingSavedKundli.birth_date,
        birthTime: pendingSavedKundli.birth_time,
        birthPlace: pendingSavedKundli.birth_place,
        name: pendingSavedKundli.name || undefined,
        email: pendingSavedKundli.email || undefined,
        lat: pendingSavedKundli.latitude ?? undefined,
        lon: pendingSavedKundli.longitude ?? undefined,
      });
      setKundliId(pendingSavedKundli.id);
      toast.success('Using your saved birth details');
    } else if (choice === 'use-current' && user && sessionKundliId) {
      // Overwrite saved kundli with session kundli
      supabase.functions
        .invoke('update-kundli-details', {
          body: {
            type: 'link_user',
            kundli_id: sessionKundliId,
            user_id: user.id,
            email: user.email,
            device_id: getDeviceId(),
          },
        })
        .then(({ error }) => {
          if (!error) {
            refreshKundli();
            toast.success('Birth details updated in your account');
          }
        });
    }

    setShowConflictDialog(false);
    setPendingSavedKundli(null);
    closeLoginModal();
    loginModalOptions?.onSuccess?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeLoginModal();
    }
  };

  // Don't render if conflict dialog is showing
  if (showConflictDialog && pendingSavedKundli) {
    return (
      <KundliConflictDialog
        open={showConflictDialog}
        savedKundli={pendingSavedKundli}
        sessionBirthData={sessionBirthData}
        onResolve={handleConflictResolved}
        onClose={() => {
          // Default to keeping saved if user cancels
          handleConflictResolved('keep-saved');
        }}
      />
    );
  }

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-midnight border-gold/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold font-display text-xl">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot-password' && 'Reset Password'}
          </DialogTitle>
          <DialogDescription className="text-cream/80">
            {mode === 'login' && 'Log in to access your saved birth chart and forecasts.'}
            {mode === 'signup' && 'Create an account to save your cosmic profile.'}
            {mode === 'forgot-password' && "Enter your email and we'll send you a reset link."}
          </DialogDescription>
        </DialogHeader>

        {mode === 'login' && (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cream font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="pl-10 bg-white border-gold/30 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cream font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          {...field}
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          className="pl-10 bg-white border-gold/30 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gold hover:bg-gold-light text-midnight font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Log In'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-cream-muted hover:text-cream transition-colors"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-gold hover:text-gold-light transition-colors"
                  >
                    Create account
                  </button>
                </div>
              </div>
            </form>
          </Form>
        )}

        {mode === 'signup' && (
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cream font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="pl-10 bg-white border-gold/30 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cream font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 6 characters"
                          className="pl-10 bg-white border-gold/30 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gold hover:bg-gold-light text-midnight font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-cream-muted hover:text-cream transition-colors"
                >
                  Already have an account? Log in
                </button>
              </div>
            </form>
          </Form>
        )}

        {mode === 'forgot-password' && (
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cream font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="pl-10 bg-white border-gold/30 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gold hover:bg-gold-light text-midnight font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-cream-muted hover:text-cream transition-colors"
                >
                  Back to login
                </button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
