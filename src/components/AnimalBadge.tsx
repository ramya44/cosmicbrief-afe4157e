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
    <div className="mt-6 pt-6 border-t border-border/30 flex flex-col items-center text-center">
      <img
        src={animalData.image_url}
        alt={animalSign}
        className="w-48 h-48 object-contain mb-4"
      />
      <p className="text-gold font-display text-xl italic">
        "{animalData.phrase}"
      </p>
    </div>
  );
};
