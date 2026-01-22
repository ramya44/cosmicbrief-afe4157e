import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarField } from '@/components/StarField';
import { BirthDetailsForm, BirthFormData } from '@/components/BirthDetailsForm';
import { useVedicChart, getBirthDateTimeUtc } from '@/hooks/useVedicChart';
import { getDeviceId } from '@/lib/deviceId';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

const FORM_STORAGE_KEY = 'birth_chart_form_data';

const BirthChartInputPage = () => {
  const navigate = useNavigate();
  const { calculate, isCalculating } = useVedicChart();
  const { isAuthenticated, hasKundli, kundli, isLoading: authLoading } = useAuth();

  // Redirect logged-in users with existing kundli to their birth chart
  useEffect(() => {
    if (!authLoading && isAuthenticated && hasKundli && kundli?.id) {
      navigate(`/birth-chart?id=${kundli.id}`, { replace: true });
    }
  }, [authLoading, isAuthenticated, hasKundli, kundli, navigate]);

  const handleSubmit = async (data: BirthFormData) => {
    try {
      // Get UTC datetime
      const birthDateTimeUtc = await getBirthDateTimeUtc({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Calculate kundli data
      const kundliData = await calculate({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Save birth chart to database (lightweight, no dasha periods in DB)
      let kundliId: string | undefined;
      try {
        const { data: saveResult, error: saveError } = await supabase.functions.invoke(
          'save-birth-chart',
          {
            body: {
              birth_date: data.birthDate,
              birth_time: data.birthTime,
              birth_place: data.birthPlace,
              birth_time_utc: birthDateTimeUtc || undefined,
              latitude: data.latitude,
              longitude: data.longitude,
              email: data.email,
              name: data.name || undefined,
              device_id: getDeviceId(),
              kundli_data: kundliData,
            },
          }
        );

        if (!saveError && saveResult?.id) {
          kundliId = saveResult.id;
        }
        // Continue even if save fails - DB save is optional for viewing chart
      } catch {
        // Continue anyway - saving to DB is optional for viewing the chart
      }

      // Store data for birth chart page
      const chartData = {
        name: data.name || undefined,
        email: data.email,
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        birthPlace: data.birthPlace,
        lat: data.latitude,
        lon: data.longitude,
        birthDateTimeUtc,
        kundliId,
        kundliData,
      };

      // Store in session storage for the results page
      sessionStorage.setItem('birth_chart_data', JSON.stringify(chartData));

      // Clear form storage
      localStorage.removeItem(FORM_STORAGE_KEY);

      // Navigate to birth chart page
      navigate('/birth-chart');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate birth chart. Please try again.');
    }
  };

  // Show loading while checking auth for logged-in users
  if (authLoading || (isAuthenticated && hasKundli)) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-cream-muted">Loading your birth chart...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Get Your Free Vedic Birth Chart | Cosmic Brief</title>
        <meta name="description" content="Generate your free Vedic birth chart (Kundali). See your planetary positions, houses, and astrological profile based on ancient Jyotish calculations." />
        <link rel="canonical" href="https://cosmicbrief.app/#/get-birth-chart" />
      </Helmet>

      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-up">
              <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">
                Your Birth Chart
              </h1>
              <p className="text-cream-muted">
                Enter your birth details to generate your Vedic birth chart
              </p>
            </div>

            {/* Form */}
            <BirthDetailsForm
              showName
              showEmail
              requireAge18={false}
              storageKey={isAuthenticated ? undefined : FORM_STORAGE_KEY}
              onSubmit={handleSubmit}
              isSubmitting={isCalculating}
              submitButtonText="Generate my Vedic Birth Chart"
              submitButtonIcon={<Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />}
            />

            <p
              className="text-center text-xs text-muted-foreground mt-8 animate-fade-up"
              style={{ animationDelay: '400ms', animationFillMode: 'both' }}
            >
              Your information is used only to generate your birth chart.
            </p>
            <p
              className="text-center text-xs text-muted-foreground mt-3 animate-fade-up"
              style={{ animationDelay: '450ms', animationFillMode: 'both' }}
            >
              <a href="/#/vedic-astrology-explained" className="text-gold hover:underline">What is Vedic Astrology?</a>
              {' · '}
              <a href="/#/privacy" className="text-gold hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BirthChartInputPage;
