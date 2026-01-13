import { StarField } from '@/components/StarField';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
      <StarField />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="text-cream-muted hover:text-cream"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Header */}
          <div className="mb-10 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/30 mb-6">
              <Mail className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-4">
              Contact Us
            </h1>
            <p className="text-cream-muted text-lg">
              We'd love to hear from you
            </p>
          </div>

          {/* Contact Info */}
          <div 
            className="p-8 rounded-2xl border border-border/50 bg-secondary/30 backdrop-blur-sm animate-fade-up"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            <p className="text-cream-muted mb-4">
              Have questions, feedback, or need support? Reach out to us at:
            </p>
            <a 
              href="mailto:support@cosmicbrief.com"
              className="inline-flex items-center gap-2 text-xl text-gold hover:text-gold-light transition-colors font-medium"
            >
              <Mail className="w-5 h-5" />
              support@cosmicbrief.com
            </a>
            <p className="text-cream-muted text-sm mt-6">
              We typically respond within 24-48 hours.
            </p>
          </div>

          {/* Footer Links */}
          <p 
            className="text-center text-sm text-muted-foreground mt-10 animate-fade-up"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            <a href="/#/privacy" className="text-gold hover:underline">Privacy Policy</a>
            {' · '}
            <a href="/#/terms" className="text-gold hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
