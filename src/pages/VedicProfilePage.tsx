import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { ArrowLeft, Save, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getDeviceId } from '@/lib/deviceId';

interface KundliData {
  id: string;
  animal_sign: string | null;
  nakshatra: string | null;
  moon_sign: string | null;
  sun_sign: string | null;
  ascendant_sign: string | null;
  email: string | null;
  user_id: string | null;
  device_id: string | null;
}

interface AnimalData {
  phrase: string;
  image_url: string;
}

const VedicProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kundliId = searchParams.get('id');

  const [kundli, setKundli] = useState<KundliData | null>(null);
  const [animalData, setAnimalData] = useState<AnimalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Save profile state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!kundliId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch kundli data
        const { data: kundliData, error: kundliError } = await supabase
          .from('user_kundli_details')
          .select('id, animal_sign, nakshatra, moon_sign, sun_sign, ascendant_sign, email, user_id, device_id')
          .eq('id', kundliId)
          .maybeSingle();

        if (kundliError || !kundliData) {
          console.error('Failed to fetch kundli:', kundliError);
          setLoading(false);
          return;
        }

        setKundli(kundliData);

        // Check if current user is owner (by device_id)
        const deviceId = getDeviceId();
        const ownerCheck = kundliData.device_id === deviceId;
        setIsOwner(ownerCheck);

        // Check if already saved (has user_id)
        setIsSaved(!!kundliData.user_id);

        // Fetch animal data if animal_sign exists
        if (kundliData.animal_sign) {
          const { data: animal, error: animalError } = await supabase
            .from('nakshatra_animal_lookup')
            .select('phrase, image_url')
            .eq('nakshatra_animal', kundliData.animal_sign)
            .maybeSingle();

          if (!animalError && animal) {
            setAnimalData(animal);
          }
        }
      } catch (e) {
        console.error('Error fetching profile data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [kundliId]);

  const handleSaveProfile = async () => {
    if (!kundli?.email) {
      toast.error('No email found for this profile');
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

    setSaving(true);

    try {
      // Sign up the user with their email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: kundli.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
        } else {
          toast.error(authError.message);
        }
        setSaving(false);
        return;
      }

      if (authData.user) {
        // Update the kundli record with the new user_id
        const { error: updateError } = await supabase
          .from('user_kundli_details')
          .update({ user_id: authData.user.id })
          .eq('id', kundli.id);

        if (updateError) {
          console.error('Failed to link kundli to user:', updateError);
          toast.error('Account created but failed to link profile');
        } else {
          setIsSaved(true);
          toast.success('Profile saved! Your account has been created.');
        }
      }
    } catch (e) {
      console.error('Error saving profile:', e);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!kundli) {
    return (
      <div className="min-h-screen bg-midnight flex flex-col items-center justify-center text-cream">
        <p className="text-lg mb-4">Profile not found</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight relative overflow-hidden">
      <StarField />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-midnight/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-cream-muted hover:text-cream"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="font-display text-xl text-gold">Vedic Profile</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="bg-midnight/60 border border-gold/20 rounded-2xl p-8">
            {/* Animal and Details Layout */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Animal Image (Left) */}
              {animalData && (
                <div className="flex flex-col items-center md:items-start shrink-0">
                  <img
                    src={animalData.image_url}
                    alt={kundli.animal_sign || 'Animal'}
                    className="w-48 h-48 md:w-56 md:h-56 object-contain"
                  />
                  <p className="text-gold font-display text-lg italic text-center mt-3">
                    {animalData.phrase}
                  </p>
                </div>
              )}

              {/* Astrological Details (Right) */}
              <div className="flex-1 w-full">
                <h2 className="text-cream font-display text-2xl mb-6">Your Cosmic Blueprint</h2>
                <div className="space-y-4">
                  {kundli.nakshatra && (
                    <div className="flex justify-between items-center py-3 border-b border-border/20">
                      <span className="text-cream-muted">Nakshatra</span>
                      <span className="text-cream font-medium text-lg">{kundli.nakshatra}</span>
                    </div>
                  )}
                  {kundli.moon_sign && (
                    <div className="flex justify-between items-center py-3 border-b border-border/20">
                      <span className="text-cream-muted">Moon Sign</span>
                      <span className="text-cream font-medium text-lg">{kundli.moon_sign}</span>
                    </div>
                  )}
                  {kundli.sun_sign && (
                    <div className="flex justify-between items-center py-3 border-b border-border/20">
                      <span className="text-cream-muted">Sun Sign</span>
                      <span className="text-cream font-medium text-lg">{kundli.sun_sign}</span>
                    </div>
                  )}
                  {kundli.ascendant_sign && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-cream-muted">Ascendant</span>
                      <span className="text-cream font-medium text-lg">{kundli.ascendant_sign}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Profile Section - Only for owners who haven't saved */}
            {isOwner && !isSaved && kundli.email && (
              <div className="mt-10 pt-8 border-t border-gold/20">
                <h3 className="text-gold font-display text-xl mb-4">Save Your Profile</h3>
                <p className="text-cream-muted text-sm mb-6">
                  Create a password to save your profile and access it anytime from any device.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-cream-muted">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={kundli.email}
                      disabled
                      className="bg-midnight/40 border-border/30 text-cream mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-cream-muted">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="bg-midnight/40 border-border/30 text-cream mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="text-cream-muted">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="bg-midnight/40 border-border/30 text-cream mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving || !password || !confirmPassword}
                    className="w-full mt-4"
                    variant="hero"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Already Saved Indicator */}
            {isSaved && (
              <div className="mt-10 pt-8 border-t border-gold/20">
                <div className="flex items-center gap-3 text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Profile saved to your account</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VedicProfilePage;
