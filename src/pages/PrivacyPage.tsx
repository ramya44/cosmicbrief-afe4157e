import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="text-cream-muted hover:text-cream"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-20">
        <div className="w-full max-w-2xl">
          <article className="prose prose-invert prose-gold max-w-none">
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-2 text-center">
              Privacy Policy
            </h1>
            <p className="text-cream-muted text-center mb-10">
              <strong>Effective Date:</strong> January 1, 2026
            </p>

            <p className="text-cream/90 leading-relaxed">
              This Privacy Policy explains how Cosmic Brief ("we," "us," or "our") collects, uses, and protects personal information when you use our Service. This policy is governed by the laws of California.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-cream/90 leading-relaxed">We collect the following types of information:</p>
            
            <h3 className="font-display text-lg text-cream mt-6 mb-3">a. Information You Provide</h3>
            <ul className="text-cream/90 space-y-1">
              <li>Birth date, birth time, and birth location</li>
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Account credentials, if you create an account</li>
            </ul>

            <h3 className="font-display text-lg text-cream mt-6 mb-3">b. Automatically Collected Information</h3>
            <ul className="text-cream/90 space-y-1">
              <li>Device and browser information</li>
              <li>Usage data related to interactions with the Service</li>
            </ul>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">2. How We Use Information</h2>
            <p className="text-cream/90 leading-relaxed">We use your information to:</p>
            <ul className="text-cream/90 space-y-1">
              <li>Generate personalized forecasts</li>
              <li>Provide and maintain the Service</li>
              <li>Process payments</li>
              <li>Communicate with you about your forecasts or account</li>
              <li>Improve the quality and reliability of the Service</li>
            </ul>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">3. Forecast Data</h2>
            <p className="text-cream/90 leading-relaxed">
              Forecast outputs are generated uniquely for you and are treated as private content. We do not share or sell individual forecasts.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">4. Data Sharing</h2>
            <p className="text-cream/90 leading-relaxed">
              We do <strong>not</strong> sell your personal information.
            </p>
            <p className="text-cream/90 leading-relaxed">We may share information with:</p>
            <ul className="text-cream/90 space-y-1">
              <li>Service providers who help operate the Service (e.g., payment processing, infrastructure)</li>
              <li>Authorities if required by law</li>
            </ul>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">5. Data Retention</h2>
            <p className="text-cream/90 leading-relaxed">
              We retain personal data only as long as necessary to provide the Service or as required by law. You may request deletion of your data at any time.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">6. Data Security</h2>
            <p className="text-cream/90 leading-relaxed">
              We take reasonable measures to protect your information, including technical and organizational safeguards. However, no system is completely secure.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">7. Your Rights</h2>
            <p className="text-cream/90 leading-relaxed">Depending on your location, you may have the right to:</p>
            <ul className="text-cream/90 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction or deletion</li>
              <li>Withdraw consent</li>
            </ul>
            <p className="text-cream/90 leading-relaxed">
              To exercise these rights, contact us at the email below.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">8. Cookies and Analytics</h2>
            <p className="text-cream/90 leading-relaxed">
              We may use cookies or similar technologies to understand usage patterns and improve the Service. You can manage cookie preferences through your browser settings.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-cream/90 leading-relaxed">
              The Service is not intended for children under 18. We do not knowingly collect data from children.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">10. Changes to This Policy</h2>
            <p className="text-cream/90 leading-relaxed">
              We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised effective date.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">11. Contact Us</h2>
            <p className="text-cream/90 leading-relaxed">
              If you have questions or requests regarding this Privacy Policy, contact us at:
            </p>
            <p className="text-cream/90 leading-relaxed">
              <strong>Email:</strong> contact@cosmicbrief.com
            </p>
          </article>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
