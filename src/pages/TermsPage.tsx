import { StarField } from '@/components/StarField';

const TermsPage = () => {
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-20">
        <div className="w-full max-w-2xl">
          <article className="prose prose-invert prose-gold max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-2">
              Terms of Service
            </h1>
            <p className="text-cream-muted mb-10">
              <strong>Effective Date:</strong> January 1, 2026
            </p>

            <p className="text-cream/90 leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of the services provided by Cosmic Brief ("we," "us," or "our"), including the website, applications, and any related content (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">1. Nature of the Service</h2>
            <p className="text-cream/90 leading-relaxed">
              The Service provides personalized, reflective annual forecasts and related content generated from user-provided information. The Service is offered for <strong>informational and reflective purposes only</strong>.
            </p>
            <p className="text-cream/90 leading-relaxed">The content:</p>
            <ul className="text-cream/90 space-y-1">
              <li>Is interpretive and subjective in nature</li>
              <li>Is not a prediction of specific events or outcomes</li>
              <li>Is not professional advice of any kind</li>
            </ul>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">2. No Professional Advice</h2>
            <p className="text-cream/90 leading-relaxed">
              The Service does <strong>not</strong> provide medical, legal, financial, psychological, or therapeutic advice.
            </p>
            <p className="text-cream/90 leading-relaxed">You agree that:</p>
            <ul className="text-cream/90 space-y-1">
              <li>You are solely responsible for your decisions and actions</li>
              <li>You will not rely on the Service as a substitute for professional advice</li>
            </ul>
            <p className="text-cream/90 leading-relaxed">
              If you require professional assistance, you should seek a qualified professional.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">3. User Eligibility</h2>
            <p className="text-cream/90 leading-relaxed">
              You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this requirement.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">4. User Inputs and Accuracy</h2>
            <p className="text-cream/90 leading-relaxed">
              You are responsible for the accuracy of the information you provide, including birth date, time, and location. The quality and relevance of the content depend on the accuracy of this information.
            </p>
            <p className="text-cream/90 leading-relaxed">
              We are not responsible for inaccuracies resulting from incorrect or incomplete user input.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">5. Accounts and Access</h2>
            <p className="text-cream/90 leading-relaxed">
              You may access portions of the Service without creating an account. If you choose to create an account:
            </p>
            <ul className="text-cream/90 space-y-1">
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You are responsible for all activity under your account</li>
            </ul>
            <p className="text-cream/90 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">6. Payments and Refunds</h2>
            <p className="text-cream/90 leading-relaxed">
              Certain features of the Service require payment.
            </p>
            <p className="text-cream/90 leading-relaxed">
              All purchases are final unless otherwise stated. We may, at our discretion, offer limited refunds on a case-by-case basis if contacted within a reasonable timeframe after purchase.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-cream/90 leading-relaxed">
              All content provided through the Service, including text, design, and underlying systems, is owned by us or our licensors and is protected by intellectual property laws.
            </p>
            <p className="text-cream/90 leading-relaxed">
              You may not copy, reproduce, distribute, or create derivative works from the Service without our express permission.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">8. Acceptable Use</h2>
            <p className="text-cream/90 leading-relaxed">You agree not to:</p>
            <ul className="text-cream/90 space-y-1">
              <li>Use the Service for unlawful purposes</li>
              <li>Attempt to reverse engineer or misuse the Service</li>
              <li>Interfere with the operation or security of the Service</li>
            </ul>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">9. Limitation of Liability</h2>
            <p className="text-cream/90 leading-relaxed">To the fullest extent permitted by law:</p>
            <ul className="text-cream/90 space-y-1">
              <li>The Service is provided "as is" and "as available"</li>
              <li>We make no warranties regarding accuracy, completeness, or usefulness</li>
              <li>We are not liable for any indirect, incidental, consequential, or special damages arising from your use of the Service</li>
            </ul>
            <p className="text-cream/90 leading-relaxed">
              Our total liability shall not exceed the amount you paid for the Service.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">10. Changes to the Service or Terms</h2>
            <p className="text-cream/90 leading-relaxed">
              We may modify or discontinue the Service at any time. We may also update these Terms. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">11. Governing Law</h2>
            <p className="text-cream/90 leading-relaxed">
              These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
            </p>

            <h2 className="font-display text-xl text-cream mt-8 mb-4">12. Contact</h2>
            <p className="text-cream/90 leading-relaxed">
              For questions about these Terms, contact us at:
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

export default TermsPage;
