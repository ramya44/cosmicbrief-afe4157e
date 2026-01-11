import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnimalBadgeProps {
  animalSign: string;
}

interface AnimalData {
  phrase: string;
  image_url: string;
}

export const AnimalBadge = ({ animalSign }: AnimalBadgeProps) => {
  const [animalData, setAnimalData] = useState<AnimalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimalData = async () => {
      try {
        const { data, error } = await supabase
          .from('nakshatra_animal_lookup')
          .select('phrase, image_url')
          .eq('nakshatra_animal', animalSign)
          .maybeSingle();

        if (!error && data) {
          setAnimalData(data);
        }
      } catch (e) {
        console.error('Failed to fetch animal data:', e);
      } finally {
        setLoading(false);
      }
    };

    if (animalSign) {
      fetchAnimalData();
    } else {
      setLoading(false);
    }
  }, [animalSign]);

  if (loading || !animalData) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-card/50 backdrop-blur-sm p-6 md:p-8 animate-fade-up overflow-hidden">
      {/* Mobile: stacked layout */}
      <div className="md:hidden flex flex-col items-center text-center">
        <img
          src={animalData.image_url}
          alt={animalSign}
          className="w-24 h-24 object-contain mb-4"
        />
        <p className="text-gold font-display text-lg italic">
          "{animalData.phrase}"
        </p>
      </div>

      {/* Desktop: image left with text wrap */}
      <div className="hidden md:block">
        <img
          src={animalData.image_url}
          alt={animalSign}
          className="float-left w-28 h-28 object-contain mr-6 mb-2"
        />
        <p className="text-gold font-display text-xl italic leading-relaxed pt-8">
          "{animalData.phrase}"
        </p>
        <div className="clear-both" />
      </div>
    </div>
  );
};
