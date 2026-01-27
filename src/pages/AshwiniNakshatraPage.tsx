import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const AshwiniNakshatraPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Ashwini Nakshatra: The Divine Healers",
    "description": "Discover Ashwini nakshatra, the first lunar mansion in Vedic astrology. Learn about its healing powers, swift energy, and how it shapes personality and destiny.",
    "datePublished": "2025-01-26",
    "dateModified": "2025-01-26",
    "author": {
      "@type": "Person",
      "name": "Maya G."
    },
    "publisher": {
      "@type": "Organization",
      "name": "Cosmic Brief"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://cosmicbrief.com/blog/ashwini-nakshatra"
    },
    "keywords": ["Ashwini nakshatra", "Vedic astrology", "nakshatras", "Ashwini Kumaras", "lunar mansions", "birth stars", "healers"]
  };

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>Ashwini Nakshatra: The Divine Healers | Cosmic Brief</title>
        <meta name="description" content="Discover Ashwini nakshatra, the first lunar mansion in Vedic astrology. Learn about its healing powers, swift energy, and how it shapes personality and destiny." />
        <link rel="canonical" href="https://cosmicbrief.com/blog/ashwini-nakshatra" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <StarField />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link to="/blog" className="text-cream/50 hover:text-cream text-sm">
            Journal
          </Link>
          <span className="text-cream/30 mx-2">/</span>
          <Link to="/blog/category/nakshatras" className="text-cream/50 hover:text-cream text-sm">
            Nakshatras
          </Link>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream mb-4 leading-tight">
          Ashwini Nakshatra: The Divine Healers
        </h1>

        {/* Category & Read Time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 text-xs bg-gold/10 text-gold rounded">
            Nakshatras
          </span>
          <span className="text-cream/40 text-sm">6 min read</span>
        </div>

        {/* Author and Date */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/maya.png" alt="Maya G." className="w-8 h-8 rounded-full" />
          <p className="text-cream/50 text-sm">
            By Maya G. · January 26, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6 text-cream/80 leading-relaxed">

          {/* Quick Facts */}
          <div className="my-8 p-6 bg-cream/5 rounded-lg border border-cream/10">
            <h2 className="font-display text-xl text-cream mb-4">Quick Facts About Ashwini</h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <p><span className="text-gold">Position:</span> 0°00' to 13°20' Aries</p>
              <p><span className="text-gold">Ruling Planet:</span> Ketu (South Node)</p>
              <p><span className="text-gold">Deity:</span> Ashwini Kumaras</p>
              <p><span className="text-gold">Symbol:</span> Horse's head</p>
              <p><span className="text-gold">Element:</span> Earth</p>
              <p><span className="text-gold">Quality:</span> Light, swift</p>
              <p><span className="text-gold">Caste:</span> Merchant</p>
            </div>
          </div>

          {/* The Meaning of Ashwini */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The Meaning of Ashwini
          </h2>

          <p className="text-lg">
            Ashwini is the first of the 27 nakshatras in Vedic astrology, marking the beginning of the zodiac at 0° Aries. The name "Ashwini" comes from the Sanskrit word for "horse woman" or "born of a horse," reflecting the nakshatra's association with speed, vitality, and power.
          </p>

          <p>
            This nakshatra is governed by the Ashwini Kumaras, the celestial twin physicians who ride golden chariots across the sky. These divine healers represent the power of rejuvenation, transformation, and miraculous cures. Their energy infuses Ashwini with themes of healing, beginnings, and swift action.
          </p>

          {/* Personality Traits */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Ashwini Personality Traits
          </h2>

          <h3 className="font-display text-xl text-cream mt-8 mb-3">Strengths</h3>

          <p>People born under Ashwini nakshatra are natural pioneers with an innate drive to initiate and explore. They possess remarkable healing abilities — whether physical, emotional, or spiritual. Their energy is characterized by:</p>

          <ul className="space-y-2 my-4">
            <li>Swift decision-making and quick action</li>
            <li>Natural healing and helping instincts</li>
            <li>Pioneering spirit and love of new beginnings</li>
            <li>Youthful appearance and vibrant energy</li>
            <li>Courage and fearlessness in facing challenges</li>
            <li>Strong intuition and spiritual connection</li>
          </ul>

          <h3 className="font-display text-xl text-cream mt-8 mb-3">Challenges</h3>

          <p>The same speed that gives Ashwini natives their edge can also create obstacles:</p>

          <ul className="space-y-2 my-4">
            <li>Impulsiveness leading to hasty decisions</li>
            <li>Restlessness and difficulty with patience</li>
            <li>Tendency to start projects without finishing them</li>
            <li>Bluntness in communication that may hurt others</li>
            <li>Difficulty in accepting help or advice</li>
          </ul>

          {/* Career Paths */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Career Paths for Ashwini Nakshatra
          </h2>

          <p>Ashwini's healing energy and pioneering nature make natives excel in careers that involve helping, healing, and innovation:</p>

          <ul className="space-y-2 my-4">
            <li><span className="text-cream font-medium">Healthcare:</span> Doctors, nurses, alternative healers, veterinarians, therapists</li>
            <li><span className="text-cream font-medium">Emergency Services:</span> Paramedics, firefighters, first responders</li>
            <li><span className="text-cream font-medium">Transportation:</span> Pilots, drivers, athletes, racers</li>
            <li><span className="text-cream font-medium">Entrepreneurship:</span> Startup founders, innovators, risk-takers</li>
            <li><span className="text-cream font-medium">Holistic Fields:</span> Yoga instructors, Ayurvedic practitioners, energy healers</li>
          </ul>

          {/* Relationships */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Ashwini in Relationships
          </h2>

          <p>
            In relationships, Ashwini natives bring passion, energy, and a protective nature. They fall in love quickly and pursue their romantic interests with characteristic speed and determination. However, they need partners who can match their pace and give them space for independence.
          </p>

          <p>
            Best compatibility is often found with nakshatras that can either keep up with Ashwini's energy (like Bharani or Krittika) or provide grounding stability (like Rohini or Uttara Phalguni).
          </p>

          {/* Spiritual Significance */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Spiritual Significance of Ashwini
          </h2>

          <p>
            Ashwini represents the soul's first journey into manifestation. It carries the energy of pure potential and new beginnings, making it an auspicious nakshatra for starting any venture. The Ashwini Kumaras teach us about the power of healing through divine intervention and the importance of serving others.
          </p>

          <p>
            Those born under this nakshatra often have past-life connections to healing arts and may feel called to help others transform their lives. Their spiritual path involves learning patience while maintaining their natural gift for swift, intuitive action.
          </p>

          {/* Living with Ashwini Energy */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Living with Ashwini Energy
          </h2>

          <p>To harness the positive qualities of Ashwini nakshatra:</p>

          <ul className="space-y-2 my-4">
            <li>Channel your energy into healing and helping professions</li>
            <li>Practice patience and follow-through on commitments</li>
            <li>Use your pioneering spirit to create positive change</li>
            <li>Maintain physical activity to balance your restless energy</li>
            <li>Develop meditation practices to calm your racing mind</li>
            <li>Trust your intuition while learning to seek wise counsel</li>
          </ul>

          {/* CTA */}
          <div className="my-12 p-6 bg-gold/5 rounded-lg border border-gold/20">
            <h3 className="font-display text-xl text-cream mb-3">Is Ashwini Your Nakshatra?</h3>
            <p className="text-cream/70 mb-4">
              Discover your Moon nakshatra and see how Ashwini's healing energy influences your chart.
            </p>
            <Link to="/get-birth-chart">
              <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-6 py-5">
                Get your free Vedic birth chart
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Conclusion */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Conclusion
          </h2>

          <p>
            Ashwini nakshatra embodies the pure energy of beginnings, healing, and swift transformation. Whether you were born under this nakshatra or are experiencing its influence through planetary transits, understanding Ashwini helps you harness the power of divine healing and courageous initiative in your life journey.
          </p>

        </div>

        {/* Related Posts */}
        <div className="mt-16 pt-12 border-t border-cream/10">
          <h2 className="font-display text-xl text-cream mb-6">Related Posts</h2>
          <div className="space-y-3">
            <Link to="/blog/bharani-nakshatra" className="block text-gold hover:underline">
              Bharani Nakshatra: The Cosmic Womb of Transformation →
            </Link>
            <Link to="/blog/what-is-nakshatra" className="block text-gold hover:underline">
              Nakshatra: Your True Cosmic DNA →
            </Link>
          </div>
        </div>

        {/* Go Deeper CTA */}
        <div className="mt-12 p-6 bg-gold/5 rounded-lg border border-gold/20">
          <h3 className="font-display text-lg text-cream mb-4">Go Deeper</h3>
          <div className="space-y-3 text-sm">
            <p className="text-cream/70">
              <Link to="/get-birth-chart" className="text-gold hover:underline font-medium">Get Your Birth Chart</Link>
              {" "}— See your Moon nakshatra, planetary positions, and houses.
            </p>
            <p className="text-cream/70">
              <Link to="/vedic/input" className="text-gold hover:underline font-medium">2026 Cosmic Brief</Link>
              {" "}— Your personalized year ahead, based on your dasha and transits.
            </p>
          </div>
        </div>

        {/* Footer tagline */}
        <p className="text-cream/40 text-sm text-center mt-12 italic">
          Cosmic Brief is Vedic astrology for the modern seeker. No guilt. No fate. Just ancient wisdom, translated.
        </p>
      </div>
    </div>
  );
};

export default AshwiniNakshatraPage;
