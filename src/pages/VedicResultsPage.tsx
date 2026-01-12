import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ArrowLeft } from 'lucide-react';

const VedicResultsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-celestial">
      <StarField />

      {/* Header */}
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

      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Empty page placeholder */}
      </main>
    </div>
  );
};

export default VedicResultsPage;
