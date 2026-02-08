import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const BharaniNakshatraPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Bharani Nakshatra: The Cosmic Womb of Transformation",
    "description": "Discover Bharani nakshatra, the second lunar mansion in Vedic astrology. Learn about its transformative power, connection to life and death, and how it shapes destiny.",
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
      "@id": "https://cosmicbrief.com/blog/bharani-nakshatra"
    },
    "keywords": ["Bharani nakshatra", "Vedic astrology", "nakshatras", "Yama", "Venus", "lunar mansions", "birth stars", "transformation"]
  };

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>Bharani Nakshatra: The Cosmic Womb of Transformation | Cosmic Brief</title>
        <meta name="description" content="Discover Bharani nakshatra, the second lunar mansion in Vedic astrology. Learn about its transformative power, connection to life and death, and how it shapes destiny." />
        <link rel="canonical" href="https://cosmicbrief.com/blog/bharani-nakshatra" />
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
          Bharani Nakshatra: The Cosmic Womb of Transformation
        </h1>

        {/* Category & Read Time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 text-xs bg-gold/10 text-gold rounded">
            Nakshatras
          </span>
          <span className="text-cream/40 text-sm">7 min read</span>
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
            <h2 className="font-display text-xl text-cream mb-4">Quick Facts About Bharani</h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <p><span className="text-gold">Position:</span> 13°20' to 26°40' Aries</p>
              <p><span className="text-gold">Ruling Planet:</span> Venus (Shukra)</p>
              <p><span className="text-gold">Deity:</span> Yama (Lord of Death)</p>
              <p><span className="text-gold">Symbol:</span> Yoni (female organ)</p>
              <p><span className="text-gold">Element:</span> Earth</p>
              <p><span className="text-gold">Quality:</span> Fierce, severe</p>
            </div>
          </div>

          {/* The Meaning of Bharani */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The Meaning of Bharani
          </h2>

          <p className="text-lg">
            Bharani is the second of the 27 nakshatras in Vedic astrology, spanning from 13°20' to 26°40' Aries. The name "Bharani" comes from the Sanskrit root "bharana," meaning "to bear" or "to carry." This nakshatra embodies the capacity to endure, sustain, and transform — carrying the weight of both creation and dissolution.
          </p>

          <p>
            Ruled by Venus and governed by Yama, the god of death and dharma, Bharani represents one of the most profound paradoxes in Vedic astrology: the union of pleasure and restraint, desire and duty, birth and death. It is the cosmic womb where souls enter the physical realm and where transformation takes root.
          </p>

          <p>
            The symbol of the yoni represents the gateway between worlds — the portal through which all life emerges. This isn't merely about physical birth; Bharani governs all forms of emergence, transformation, and the bearing of consequences.
          </p>

          {/* Personality Traits */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Bharani Personality Traits
          </h2>

          <h3 className="font-display text-xl text-cream mt-8 mb-3">Strengths</h3>

          <p>People born under Bharani nakshatra possess an intense, magnetic presence with a deep capacity for transformation. Their energy is characterized by:</p>

          <ul className="space-y-2 my-4">
            <li>Tremendous endurance and ability to bear difficulties</li>
            <li>Deep sense of duty and responsibility</li>
            <li>Intense passion and creative power</li>
            <li>Ability to navigate life-and-death situations</li>
            <li>Strong moral compass and sense of justice</li>
            <li>Natural understanding of life's deeper mysteries</li>
            <li>Protective instincts toward loved ones</li>
            <li>Capacity for profound transformation and rebirth</li>
          </ul>

          <h3 className="font-display text-xl text-cream mt-8 mb-3">Challenges</h3>

          <p>The intense nature of Bharani can create certain struggles:</p>

          <ul className="space-y-2 my-4">
            <li>Tendency toward extremes in behavior and emotion</li>
            <li>Struggles with impulse control and desire</li>
            <li>Jealousy and possessiveness in relationships</li>
            <li>Difficulty accepting criticism or restraint</li>
            <li>Carrying too much responsibility for others</li>
            <li>Periods of intense struggle before breakthrough</li>
            <li>May attract or experience crisis situations</li>
          </ul>

          {/* Career Paths */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Career Paths for Bharani Nakshatra
          </h2>

          <p>Bharani's transformative energy and connection to life's extremes make natives excel in fields involving birth, death, and profound change:</p>

          <ul className="space-y-2 my-4">
            <li><span className="text-cream font-medium">Healthcare:</span> Midwives, obstetricians, surgeons, hospice workers</li>
            <li><span className="text-cream font-medium">Law & Justice:</span> Judges, lawyers, criminal investigators</li>
            <li><span className="text-cream font-medium">Arts & Entertainment:</span> Musicians, actors, dancers (Venus influence)</li>
            <li><span className="text-cream font-medium">Crisis Management:</span> Emergency responders, therapists, social workers</li>
            <li><span className="text-cream font-medium">Financial:</span> Wealth management, insurance, estate planning</li>
            <li><span className="text-cream font-medium">Transformation Work:</span> Psychologists, life coaches, spiritual guides</li>
            <li><span className="text-cream font-medium">Agriculture:</span> Farming, fertility specialists, botanists</li>
          </ul>

          {/* Relationships */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Bharani in Relationships
          </h2>

          <p>
            In relationships, Bharani natives love deeply and intensely. The Venus rulership brings a strong desire for romance, beauty, and sensual connection. However, Yama's influence means they take commitments seriously — love for them is never casual.
          </p>

          <p>
            They can be fiercely loyal and protective, willing to bear great burdens for those they love. However, their intensity can sometimes manifest as possessiveness or jealousy. They need partners who understand their depth and can match their emotional intensity without being overwhelmed.
          </p>

          <p>
            Best compatibility is often found with nakshatras that can handle their intensity (like Ashwini or Krittika) or provide grounding balance (like Rohini or Pushya).
          </p>

          {/* Spiritual Significance */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Spiritual Significance of Bharani
          </h2>

          <p>
            Bharani teaches the profound lesson that death and birth are not opposites but part of the same cycle. Yama, though known as the god of death, is also Dharmaraja — the king of righteousness who ensures souls are judged fairly and directed to their next destination.
          </p>

          <p>
            Those born under this nakshatra often have past-life connections to themes of karma, consequences, and transformation. Their spiritual path involves:
          </p>

          <ul className="space-y-2 my-4">
            <li>Learning to embrace transformation rather than resist it</li>
            <li>Understanding that bearing burdens can be a path to liberation</li>
            <li>Balancing Venus's desire for pleasure with Yama's demand for duty</li>
            <li>Recognizing that every ending contains the seed of a new beginning</li>
            <li>Using their intensity for spiritual breakthrough rather than worldly attachment</li>
          </ul>

          {/* Living with Bharani Energy */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Living with Bharani Energy
          </h2>

          <p>To harness the positive qualities of Bharani nakshatra:</p>

          <ul className="space-y-2 my-4">
            <li>Channel your intensity into creative and transformative work</li>
            <li>Practice healthy boundaries around what you choose to "bear"</li>
            <li>Use artistic expression as an outlet for intense emotions</li>
            <li>Develop patience — transformation takes time</li>
            <li>Honor both your desires and your duties without extremes</li>
            <li>Cultivate practices that help you process and release intensity</li>
            <li>Remember that your capacity for endurance is a gift, not a burden</li>
          </ul>

          {/* CTA */}
          <div className="my-12 p-6 bg-gold/5 rounded-lg border border-gold/20">
            <h3 className="font-display text-xl text-cream mb-3">Is Bharani Your Nakshatra?</h3>
            <p className="text-cream/70 mb-4">
              Discover your Moon nakshatra and see how Bharani's transformative energy influences your chart.
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
            Bharani nakshatra embodies the sacred mysteries of transformation — the cosmic womb where endings become beginnings and burdens become wisdom. Whether you were born under this nakshatra or are experiencing its influence through planetary transits, understanding Bharani helps you navigate life's profound transformations with grace and purpose.
          </p>

        </div>

        {/* Related Posts */}
        <div className="mt-16 pt-12 border-t border-cream/10">
          <h2 className="font-display text-xl text-cream mb-6">Related Posts</h2>
          <div className="space-y-3">
            <Link to="/blog/ashwini-nakshatra" className="block text-gold hover:underline">
              Ashwini Nakshatra: The Divine Healers →
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

export default BharaniNakshatraPage;
