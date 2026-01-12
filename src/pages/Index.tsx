import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
      <StarField />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-2xl text-center">
          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
              Your 2026 Cosmic Brief
            </h1>
            <p className="text-lg md:text-xl text-cream-muted max-w-lg mx-auto">
              Discover what the stars have planned for your year ahead with authentic Vedic astrology insights.
            </p>
          </div>

          {/* CTA Button */}
          <div 
            className="animate-fade-up"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            <Button 
              variant="hero" 
              size="lg" 
              className="group text-lg px-8 py-6"
              onClick={() => navigate('/vedic/input')}
            >
              Get My Brief
              <Sparkles className="w-5 h-5 ml-2 transition-transform group-hover:rotate-12" />
            </Button>
          </div>

          {/* Footer links */}
          <p 
            className="text-sm text-muted-foreground mt-12 animate-fade-up"
            style={{ animationDelay: '400ms', animationFillMode: 'both' }}
          >
            <a href="/#/vedic-astrology-explained" className="text-gold hover:underline">What is Vedic Astrology?</a>
            {' · '}
            <a href="/#/privacy" className="text-gold hover:underline">Privacy Policy</a>
            {' · '}
            <a href="/#/terms" className="text-gold hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};
      
export default Index;
