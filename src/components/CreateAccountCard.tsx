import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Lock, Check, Loader2 } from 'lucide-react';

interface CreateAccountCardProps {
  email: string;
  displayName?: string;
  stripeSessionId: string;
  onAccountCreated: () => void;
}

export const CreateAccountCard = ({ 
  email, 
  displayName, 
  stripeSessionId,
  onAccountCreated 
}: CreateAccountCardProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName || null,
          },
        },
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes('already registered')) {
          toast.error('An account with this email already exists. Please log in instead.');
        } else {
          throw authError;
        }
        return;
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Link the forecast to the user
      const { error: linkError } = await supabase.functions.invoke('link-forecast-to-user', {
        body: {
          stripeSessionId,
          userId: authData.user.id,
        },
      });

      if (linkError) {
        console.error('Failed to link forecast:', linkError);
        // Don't fail the account creation if linking fails
        toast.warning('Account created, but we had trouble linking your forecast. Contact support if needed.');
      }

      setIsCreated(true);
      toast.success('Account created! Your forecast is now saved.');
      onAccountCreated();
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCreated) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="font-display text-xl text-cream mb-2">Account Created!</h3>
        <p className="text-cream-muted text-sm">
          Your forecast has been saved to your account. You can access it anytime by logging in.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-midnight/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <User className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-display text-xl text-cream">Save Your Forecast</h3>
          <p className="text-cream-muted text-sm">Create a password to access your forecast anytime</p>
        </div>
      </div>

      <form onSubmit={handleCreateAccount} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-cream-muted text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="bg-midnight/50 border-border/50 text-cream-muted"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-cream-muted text-sm">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cream-muted" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="pl-10 bg-midnight/50 border-border/50 text-cream placeholder:text-cream-muted/50"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-cream-muted text-sm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cream-muted" />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="pl-10 bg-midnight/50 border-border/50 text-cream placeholder:text-cream-muted/50"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          variant="hero" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <User className="w-4 h-4 mr-2" />
              Create Account & Save Forecast
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
