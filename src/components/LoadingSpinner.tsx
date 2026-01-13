import { StarField } from '@/components/StarField';

export const LoadingSpinner = () => {
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="relative w-20 h-20 mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-gold/20"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin"></div>
          {/* Inner glow */}
          <div className="absolute inset-4 rounded-full bg-gold/10 animate-pulse"></div>
        </div>
        
        <h2 className="font-display text-2xl md:text-3xl text-cream mb-3 text-center">
          Reading Your Patterns
        </h2>
        <p className="text-cream-muted text-center max-w-md">
          Analyzing the sky at your birth moment to craft your personalized 2026 Cosmic Brief...
        </p>
      </div>
    </div>
  );
};
