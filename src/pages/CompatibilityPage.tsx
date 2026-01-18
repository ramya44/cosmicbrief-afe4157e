import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { Heart } from 'lucide-react';

const CompatibilityPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center glow-gold">
              <Heart className="w-8 h-8 text-gold" />
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-6 text-cream">
            Compatibility
          </h1>

          <p className="font-sans text-lg text-cream-muted max-w-xl mx-auto mb-8 leading-relaxed">
            Discover your cosmic compatibility with partners, friends, and colleagues. 
            Our Vedic matching system analyzes birth charts to reveal relationship dynamics.
          </p>

          <div className="p-6 rounded-xl bg-midnight/50 border border-gold/20 mb-8">
            <p className="text-gold font-sans text-sm">
              ✨ Coming Soon ✨
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="font-[Inter]"
          >
            Back to 2026 Forecast
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityPage;
