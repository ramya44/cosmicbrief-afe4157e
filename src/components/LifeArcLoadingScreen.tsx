import { useState, useEffect } from 'react';
import { StarField } from '@/components/StarField';
import { Compass } from 'lucide-react';

const MYSTICAL_PHRASES = [
  "Calculating your dasha periods...",
  "Mapping planetary rulerships...",
  "Analyzing life house activations...",
  "Detecting past milestones...",
  "Scanning for Sade Sati periods...",
  "Identifying future windows...",
  "Weaving your life arc narrative...",
];

export const LifeArcLoadingScreen = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [progressDots, setProgressDots] = useState(0);

  useEffect(() => {
    // Rotate phrases every 3 seconds (slightly faster since Life Arc may take longer)
    const phraseInterval = setInterval(() => {
      setCurrentPhraseIndex((prev) => {
        if (prev < MYSTICAL_PHRASES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    // Advance progress dots with phrase changes
    const dotsInterval = setInterval(() => {
      setProgressDots((prev) => Math.min(prev + 1, MYSTICAL_PHRASES.length - 1));
    }, 3000);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-celestial flex items-center justify-center">
      <StarField />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Spinning Compass Icon */}
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-gold/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin"></div>
          <div className="absolute inset-2 flex items-center justify-center">
            <Compass className="w-10 h-10 text-gold animate-pulse" />
          </div>
        </div>

        {/* Header */}
        <h2 className="font-display text-2xl md:text-3xl text-cream mb-3">
          Mapping Your Life Arc
        </h2>
        <p className="text-cream/50 text-sm mb-8">
          This may take up to 30 seconds
        </p>

        {/* Rotating phrase */}
        <p className="text-cream italic text-lg mb-8 h-8 transition-opacity duration-500">
          {MYSTICAL_PHRASES[currentPhraseIndex]}
        </p>

        {/* Progress dots */}
        <div className="flex gap-2">
          {MYSTICAL_PHRASES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                index <= progressDots
                  ? 'bg-gold'
                  : 'bg-gold/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
