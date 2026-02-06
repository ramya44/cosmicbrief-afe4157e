import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';
import { useForecastStore } from '@/store/forecastStore';
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
import { Loader2, User, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const signupSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  displayName: z.string().trim().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
  password: z.string().min(1, 'Password is required').max(100),
});

type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

interface SaveProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kundliId: string;
  defaultName?: string;
  defaultEmail?: string;
  onSuccess: () => void;
}

export const SaveProfileDialog = ({
  open,
  onOpenChange,
  kundliId,
  defaultName,
  defaultEmail,
  onSuccess,
}: SaveProfileDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: defaultEmail || '',
      password: '',
      displayName: defaultName || '',
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Update login form email when existingEmail is set (after signup fails for existing user)
  useEffect(() => {
    if (existingEmail && showLogin) {
      loginForm.setValue('email', existingEmail);
    }
  }, [existingEmail, showLogin, loginForm]);

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: data.displayName,
          },
        },
      });

      if (signUpError) {
        // Check if user already exists - handle various error message formats
        const errorMsg = signUpError.message.toLowerCase();
        if (errorMsg.includes('already registered') ||
            errorMsg.includes('already exists') ||
            errorMsg.includes('user already registered') ||
            errorMsg.includes('email already') ||
            errorMsg.includes('duplicate')) {
          setExistingEmail(data.email);
          loginForm.reset({ email: data.email, password: '' });
          setShowLogin(true);
          toast.info('This email is already registered. Please log in.');
          return;
        }
        throw signUpError;
      }

      // Supabase may return success but with empty identities if user exists
      // This happens when email confirmation is enabled and user already exists
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        setExistingEmail(data.email);
        loginForm.reset({ email: data.email, password: '' });
        setShowLogin(true);
        toast.info('This email is already registered. Please log in.');
        return;
      }

      if (authData.user) {
        // Link the kundli to the user via secure edge function
        const { data: updateResult, error: updateError } = await supabase.functions.invoke(
          'update-kundli-details',
          {
            body: {
              type: 'link_user',
              kundli_id: kundliId,
              user_id: authData.user.id,
              email: data.email,
              name: data.displayName,
              device_id: getDeviceId(),
            },
          }
        );

        if (updateError || updateResult?.error) {
          throw new Error('Failed to save profile. Please try again.');
        }

        // Update forecastStore to ensure it has the correct kundliId
        // This prevents race conditions with useAuth's SIGNED_IN handler
        useForecastStore.getState().setKundliId(kundliId);

        toast.success('Profile saved successfully!');
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (authData.user) {
        // Link the kundli to the user via secure edge function
        const { data: updateResult, error: updateError } = await supabase.functions.invoke(
          'update-kundli-details',
          {
            body: {
              type: 'link_user',
              kundli_id: kundliId,
              user_id: authData.user.id,
              email: data.email,
              device_id: getDeviceId(),
            },
          }
        );

        if (updateError || updateResult?.error) {
          throw new Error('Failed to save profile. Please try again.');
        }

        // Update forecastStore to ensure it has the correct kundliId
        // This prevents race conditions with useAuth's SIGNED_IN handler
        useForecastStore.getState().setKundliId(kundliId);

        toast.success('Profile saved successfully!');
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowLogin(false);
      setExistingEmail(null);
      signupForm.reset();
      loginForm.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-midnight border-gold/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold font-display text-xl">
            {showLogin ? 'Welcome Back' : 'Save Your Profile'}
          </DialogTitle>
          <DialogDescription className="text-cream/80">
            {showLogin 
              ? 'Log in to save this profile to your account.'
              : 'Create an account to save your cosmic profile and access it anytime.'}
          </DialogDescription>
        </DialogHeader>

        {showLogin ? (
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
                          id="login-email"
                          type="email"
                          autoComplete="off"
                          name="login-email"
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
                          id="login-password"
                          type="password"
                          autoComplete="current-password"
                          name="password"
                          placeholder="••••••••"
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
                    'Log In & Save Profile'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowLogin(false)}
                  className="text-cream-muted hover:text-cream"
                >
                  Create a new account instead
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <FormField
                control={signupForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cream font-medium">Your Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          {...field}
                          id="signup-name"
                          autoComplete="name"
                          name="displayName"
                          placeholder="Enter your name"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cream font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          {...field}
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          name="email"
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
                          id="signup-password"
                          type="password"
                          autoComplete="new-password"
                          name="password"
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
                    'Create Account & Save'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowLogin(true)}
                  className="text-cream-muted hover:text-cream"
                >
                  Already have an account? Log in
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
