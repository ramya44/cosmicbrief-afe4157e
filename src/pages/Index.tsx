import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { Sparkles, LogIn } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />
      
      {/* Login button in top right */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/vedic/input')}
          className="text-cream-muted hover:text-cream hover:bg-gold/10"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Log In
        </Button>
      </div>
      
      {/* Subtle gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl animate-pulse-slow" style={{
        animationDelay: '2s'
      }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          {/* Decorative element */}
          <div className="flex justify-center mb-8 animate-fade-in text-sm">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center glow-gold">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-6 animate-fade-up" style={{
          animationDelay: '100ms',
          animationFillMode: 'both'
        }}>
            <span className="text-cream">Your </span>
            <span className="text-gradient-gold">2026</span>
            <br />
            <span className="text-cream">Cosmic Brief</span>
          </h1>

          {/* Subheadline */}
          <p className="font-body text-lg md:text-xl text-cream-muted max-w-xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{
          animationDelay: '200ms',
          animationFillMode: 'both'
        }}>
            A personalized yearly outlook based on your birth moment, 
            using ancient systems of time and pattern.
          </p>

          {/* CTA Button */}
          <div className="animate-fade-up" style={{
          animationDelay: '300ms',
          animationFillMode: 'both'
        }}>
            <Button variant="hero" size="xl" onClick={() => navigate('/vedic/input')} className="group font-sans">
              Get My Brief
              <Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />
            </Button>
          </div>

          {/* Subtle footer text */}
          <p className="mt-16 text-base text-muted-foreground font-sans animate-fade-up" style={{
          animationDelay: '500ms',
          animationFillMode: 'both'
        }}>
            No zodiac signs. This forecast uses the position of the stars at your birth, based on ancient techniques refined over centuries.
          </p>
          
          {/* Footer links */}
          <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground font-sans animate-fade-up" style={{
          animationDelay: '600ms',
          animationFillMode: 'both'
        }}>
            <a href="/#/vedic-astrology-explained" className="text-gold hover:underline">What is Vedic Astrology</a>
            <a href="/#/privacy" className="text-gold hover:underline">Privacy Policy</a>
            <a href="/#/terms" className="text-gold hover:underline">Terms of Service</a>
            <a href="/#/contact" className="text-gold hover:underline">Contact</a>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-midnight to-transparent pointer-events-none" />
    </div>
  );
};

export default Index;