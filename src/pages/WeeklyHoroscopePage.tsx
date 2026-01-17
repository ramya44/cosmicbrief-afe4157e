import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { Calendar, ArrowLeft } from 'lucide-react';

const WeeklyHoroscopePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center glow-gold">
              <Calendar className="w-8 h-8 text-gold" />
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-6 text-cream">
            Weekly Horoscope
          </h1>

          <p className="font-sans text-lg text-cream-muted max-w-xl mx-auto mb-8 leading-relaxed">
            Your personalized weekly cosmic guidance is coming soon. 
            We're crafting detailed weekly forecasts based on planetary transits and your birth chart.
          </p>

          <div className="p-6 rounded-xl bg-midnight/50 border border-gold/20 mb-8">
            <p className="text-gold font-sans text-sm">
              ✨ Coming Soon ✨
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="font-sans"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to 2026 Forecast
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHoroscopePage;
