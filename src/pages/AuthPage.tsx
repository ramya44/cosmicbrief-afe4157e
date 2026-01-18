import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { ArrowLeft, Loader2, Mail, Lock, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      } else if (event === 'SIGNED_IN' && mode !== 'reset') {
        navigate('/');
      }
    });

    // Check if already logged in (but not in reset mode)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mode !== 'reset') {
        // Check if this is a recovery session
        const hashParams = new URLSearchParams(window.location.hash.split('#')[2] || '');
        const type = hashParams.get('type');
        if (type === 'recovery') {
          setMode('reset');
        } else {
          navigate('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'reset') {
      if (!password) {
        toast.error('Please enter your new password');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password updated successfully!');
          await supabase.auth.signOut();
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (mode !== 'forgot' && !password) {
      toast.error('Please enter your password');
      return;
    }

    if (mode !== 'forgot' && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#/auth`,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password reset email sent! Check your inbox.');
          setMode('login');
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
        }
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try logging in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! You can now log in.');
          setMode('login');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'login':
        return <LogIn className="w-8 h-8 text-gold" />;
      case 'signup':
        return <UserPlus className="w-8 h-8 text-gold" />;
      case 'forgot':
      case 'reset':
        return <KeyRound className="w-8 h-8 text-gold" />;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Reset Password';
      case 'reset':
        return 'Set New Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to access your saved profiles';
      case 'signup':
        return 'Create an account to save your cosmic data';
      case 'forgot':
        return "Enter your email and we'll send you a reset link";
      case 'reset':
        return 'Enter your new password below';
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      switch (mode) {
        case 'login':
          return 'Signing in...';
        case 'signup':
          return 'Creating account...';
        case 'forgot':
          return 'Sending...';
        case 'reset':
          return 'Updating...';
      }
    }
    switch (mode) {
      case 'login':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Send Reset Link';
      case 'reset':
        return 'Update Password';
    }
  };

  return (
    <div className="min-h-screen bg-celestial relative overflow-hidden">
      <StarField />

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-midnight/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-cream-muted hover:text-cream"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
            {getIcon()}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl text-cream text-center mb-2">
            {getTitle()}
          </h1>
          <p className="text-cream-muted text-center mb-8">
            {getSubtitle()}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cream flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gold" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-cream flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gold" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                />
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-cream flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gold" />
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-cream flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gold" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {getButtonText()}
            </Button>

            {mode === 'login' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-cream-muted hover:text-gold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>

          {/* Toggle */}
          <p className="text-cream-muted text-center mt-6">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-gold hover:text-gold-light underline underline-offset-2"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-gold hover:text-gold-light underline underline-offset-2"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-gold hover:text-gold-light underline underline-offset-2"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'reset' && (
              <>
                Changed your mind?{' '}
                <button
                  type="button"
                  onClick={() => {
                    supabase.auth.signOut();
                    setMode('login');
                  }}
                  className="text-gold hover:text-gold-light underline underline-offset-2"
                >
                  Back to sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
