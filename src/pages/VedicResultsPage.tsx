import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';

interface KundliDetails {
  id: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  moon_sign: string | null;
  sun_sign: string | null;
  nakshatra: string | null;
  free_vedic_forecast: string | null;
  forecast_generated_at: string | null;
}

const VedicResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kundliId = searchParams.get('id');

  const [kundli, setKundli] = useState<KundliDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKundli = async () => {
      if (!kundliId) {
        setError('No kundli ID provided');
        setLoading(false);
        return;
      }

      const deviceId = getDeviceId();

      const { data, error: fnError } = await supabase.functions.invoke('get-vedic-kundli-details', {
        body: { kundli_id: kundliId, device_id: deviceId },
      });

      if (fnError) {
        setError('Failed to load your forecast');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Forecast not found');
        setLoading(false);
        return;
      }

      setKundli(data);
      setLoading(false);
    };

    fetchKundli();
  }, [kundliId]);

  const renderForecast = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (const line of lines) {
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-xl font-semibold text-cream mt-8 mb-4">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-2xl font-bold text-gold mt-10 mb-4">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <p key={key++} className="font-semibold text-cream-muted my-2">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={key++} className="text-cream-muted ml-4 my-1">
            {line.replace('- ', '')}
          </li>
        );
      } else if (line.startsWith('---')) {
        elements.push(<hr key={key++} className="border-border/30 my-8" />);
      } else if (line.trim()) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        elements.push(
          <p key={key++} className="text-cream-muted leading-relaxed my-3">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="text-cream">
                    {part.replace(/\*\*/g, '')}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      }
    }

    return elements;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !kundli) {
    return (
      <div className="relative min-h-screen bg-celestial">
        <StarField />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center">
          <p className="text-cream-muted mb-4">{error || 'Something went wrong'}</p>
          <Button onClick={() => navigate('/vedic/input')}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-celestial">
      <StarField />

      <header className="relative z-20 border-b border-border/30 bg-midnight/80 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vedic/input')}
            className="text-cream-muted hover:text-cream"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-medium">Your 2026 Vedic Forecast</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-cream-muted">
            {kundli.moon_sign && (
              <span className="px-3 py-1 bg-midnight/50 rounded-full border border-border/30">
                Moon: {kundli.moon_sign}
              </span>
            )}
            {kundli.sun_sign && (
              <span className="px-3 py-1 bg-midnight/50 rounded-full border border-border/30">
                Sun: {kundli.sun_sign}
              </span>
            )}
            {kundli.nakshatra && (
              <span className="px-3 py-1 bg-midnight/50 rounded-full border border-border/30">
                Nakshatra: {kundli.nakshatra}
              </span>
            )}
          </div>
        </div>

        {kundli.free_vedic_forecast ? (
          <div className="bg-midnight/40 border border-border/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm">
            <div className="prose prose-invert max-w-none">{renderForecast(kundli.free_vedic_forecast)}</div>
          </div>
        ) : (
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="text-cream-muted mt-4">Generating your forecast...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VedicResultsPage;
