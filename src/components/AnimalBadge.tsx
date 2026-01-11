import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnimalBadgeProps {
  animalSign: string;
  inline?: boolean; // When true, renders inline for text wrap layout
}

interface AnimalData {
  phrase: string;
  image_url: string;
}

export const AnimalBadge = ({ animalSign, inline = false }: AnimalBadgeProps) => {
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

  // Inline mode: float left for text wrap on desktop
  if (inline) {
    return (
      <>
        {/* Mobile: centered above text */}
        <div className="md:hidden flex flex-col items-center text-center mb-4">
          <img
            src={animalData.image_url}
            alt={animalSign}
            className="w-40 h-40 object-contain mb-2"
          />
          <p className="text-gold font-display text-lg italic">
            "{animalData.phrase}"
          </p>
        </div>

        {/* Desktop: float left for text wrap */}
        <div className="hidden md:block float-left mr-6 mb-2">
          <img
            src={animalData.image_url}
            alt={animalSign}
            className="w-48 h-48 object-contain"
          />
          <p className="text-gold font-display text-base italic text-center mt-2">
            "{animalData.phrase}"
          </p>
        </div>
      </>
    );
  }

  // Standalone mode (original)
  return (
    <div className="mt-6 pt-6 border-t border-border/30 overflow-hidden">
      {/* Mobile: stacked centered */}
      <div className="md:hidden flex flex-col items-center text-center">
        <img
          src={animalData.image_url}
          alt={animalSign}
          className="w-48 h-48 object-contain mb-4"
        />
        <p className="text-gold font-display text-xl italic">
          "{animalData.phrase}"
        </p>
      </div>

      {/* Desktop: image left with text wrap */}
      <div className="hidden md:block">
        <img
          src={animalData.image_url}
          alt={animalSign}
          className="float-left w-48 h-48 object-contain mr-6"
        />
        <p className="text-gold font-display text-xl italic text-right pt-16">
          "{animalData.phrase}"
        </p>
        <div className="clear-both" />
      </div>
    </div>
  );
};
