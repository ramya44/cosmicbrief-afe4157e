import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { ArrowLeft, Loader2, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
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
      } else {
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
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
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
            {isLogin ? (
              <LogIn className="w-8 h-8 text-gold" />
            ) : (
              <UserPlus className="w-8 h-8 text-gold" />
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl text-cream text-center mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-cream-muted text-center mb-8">
            {isLogin ? 'Sign in to access your saved profiles' : 'Create an account to save your cosmic data'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-cream-muted text-center mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gold hover:text-gold-light underline underline-offset-2"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
