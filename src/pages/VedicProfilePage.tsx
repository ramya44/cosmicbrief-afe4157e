import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface KundliData {
  id: string;
  animal_sign: string | null;
  nakshatra: string | null;
  moon_sign: string | null;
  sun_sign: string | null;
  ascendant_sign: string | null;
  name: string | null;
}

interface AnimalData {
  phrase: string;
  image_url: string;
}

interface ZodiacLookup {
  [key: string]: string;
}

const VedicProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kundliId = searchParams.get('id');

  const [kundli, setKundli] = useState<KundliData | null>(null);
  const [animalData, setAnimalData] = useState<AnimalData | null>(null);
  const [zodiacLookup, setZodiacLookup] = useState<ZodiacLookup>({});
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

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
          .select('id, animal_sign, nakshatra, moon_sign, sun_sign, ascendant_sign, name')
          .eq('id', kundliId)
          .maybeSingle();

        if (kundliError || !kundliData) {
          console.error('Failed to fetch kundli:', kundliError);
          setLoading(false);
          return;
        }

        setKundli(kundliData);

        // Fetch zodiac lookup for Western names
        const { data: zodiacData } = await supabase
          .from('vedic_zodiac_signs')
          .select('sanskrit_name, western_name');

        if (zodiacData) {
          const lookup: ZodiacLookup = {};
          zodiacData.forEach((z) => {
            lookup[z.sanskrit_name] = z.western_name;
          });
          setZodiacLookup(lookup);
        }

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

  const formatWithTranslation = (sanskritName: string | null) => {
    if (!sanskritName) return null;
    const western = zodiacLookup[sanskritName];
    return western ? `${sanskritName} (${western})` : sanskritName;
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
          <h1 className="font-display text-xl text-gold">{kundli.name ? `${kundli.name}'s Profile` : 'Vedic Profile'}</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto flex flex-col items-center">
          {/* Flip Card */}
          <div 
            className="w-80 h-96 cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1000px' }}
          >
            <div 
              className="relative w-full h-full transition-transform duration-700"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front of Card - Animal Image */}
              <div 
                className="absolute inset-0 rounded-2xl overflow-hidden border border-gold/40"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {animalData && (
                  <img
                    src={animalData.image_url}
                    alt={kundli.animal_sign || 'Animal'}
                    className="w-full h-full object-cover"
                  />
                )}
                <p className="absolute bottom-4 left-0 right-0 text-cream-muted text-sm text-center animate-pulse">Tap to reveal</p>
              </div>

              {/* Back of Card - Astrological Details */}
              <div 
                className="absolute inset-0 bg-midnight/90 border border-gold/40 rounded-2xl p-6 flex flex-col justify-center"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <h2 className="text-gold font-display text-xl mb-6 text-center">Your Cosmic Blueprint</h2>
                <div className="space-y-4">
                  {kundli.animal_sign && (
                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                      <span className="text-cream-muted text-sm">Animal</span>
                      <span className="text-cream font-medium">{kundli.animal_sign}</span>
                    </div>
                  )}
                  {kundli.nakshatra && (
                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                      <span className="text-cream-muted text-sm">Nakshatra</span>
                      <span className="text-cream font-medium">{kundli.nakshatra}</span>
                    </div>
                  )}
                  {kundli.moon_sign && (
                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                      <span className="text-cream-muted text-sm">Moon</span>
                      <span className="text-cream font-medium">{formatWithTranslation(kundli.moon_sign)}</span>
                    </div>
                  )}
                  {kundli.sun_sign && (
                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                      <span className="text-cream-muted text-sm">Sun</span>
                      <span className="text-cream font-medium">{formatWithTranslation(kundli.sun_sign)}</span>
                    </div>
                  )}
                  {kundli.ascendant_sign && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-cream-muted text-sm">Ascendant</span>
                      <span className="text-cream font-medium">{formatWithTranslation(kundli.ascendant_sign)}</span>
                    </div>
                  )}
                </div>
                <p className="text-cream-muted text-sm mt-6 text-center animate-pulse">Tap to flip back</p>
              </div>
            </div>
          </div>

          {/* Phrase below the card */}
          {animalData && (
            <p className="text-gold font-display text-xl italic text-center mt-8 max-w-sm">
              {animalData.phrase}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default VedicProfilePage;
