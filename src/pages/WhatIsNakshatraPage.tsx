import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import NakshatraWheel from "@/components/NakshatraWheel";

const WhatIsNakshatraPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Nakshatra: Your True Cosmic DNA",
    "description": "Discover the 27 lunar mansions of Vedic astrology. Learn why your Moon nakshatra reveals more about you than your zodiac sign ever could.",
    "datePublished": "2025-01-01",
    "dateModified": "2025-01-18",
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
      "@id": "https://cosmicbrief.com/blog/what-is-nakshatra"
    },
    "keywords": ["nakshatra", "lunar mansions", "vedic astrology", "moon nakshatra", "27 nakshatras", "jyotish", "vedic birth chart"]
  };

  const nakshatraList = [
    {
      sign: "Aries (Mesha)",
      nakshatras: [
        "Ashwini — The Healers",
        "Bharani — The Bearer",
        "Krittika (1st quarter) — The Cutter"
      ]
    },
    {
      sign: "Taurus (Vrishabha)",
      nakshatras: [
        "Krittika (2nd-4th quarters)",
        "Rohini — The Red One",
        "Mrigashira (1st-2nd quarters) — The Searching"
      ]
    },
    {
      sign: "Gemini (Mithuna)",
      nakshatras: [
        "Mrigashira (3rd-4th quarters)",
        "Ardra — The Storm",
        "Punarvasu (1st-3rd quarters) — The Return of Light"
      ]
    },
    {
      sign: "Cancer (Karka)",
      nakshatras: [
        "Punarvasu (4th quarter)",
        "Pushya — The Nourisher",
        "Ashlesha — The Embrace"
      ]
    },
    {
      sign: "Leo (Simha)",
      nakshatras: [
        "Magha — The Throne",
        "Purva Phalguni — The Fruit of the Tree",
        "Uttara Phalguni (1st quarter) — The Later Fruit"
      ]
    },
    {
      sign: "Virgo (Kanya)",
      nakshatras: [
        "Uttara Phalguni (2nd-4th quarters)",
        "Hasta — The Hand",
        "Chitra (1st-2nd quarters) — The Jewel"
      ]
    },
    {
      sign: "Libra (Tula)",
      nakshatras: [
        "Chitra (3rd-4th quarters)",
        "Swati — The Sword",
        "Vishakha (1st-3rd quarters) — The Forked Branch"
      ]
    },
    {
      sign: "Scorpio (Vrishchika)",
      nakshatras: [
        "Vishakha (4th quarter)",
        "Anuradha — The Disciple",
        "Jyeshtha — The Elder"
      ]
    },
    {
      sign: "Sagittarius (Dhanu)",
      nakshatras: [
        "Mula — The Root",
        "Purva Ashadha — The Invincible",
        "Uttara Ashadha (1st quarter) — The Later Victory"
      ]
    },
    {
      sign: "Capricorn (Makara)",
      nakshatras: [
        "Uttara Ashadha (2nd-4th quarters)",
        "Shravana — The Listener",
        "Dhanishta (1st-2nd quarters) — The Drum"
      ]
    },
    {
      sign: "Aquarius (Kumbha)",
      nakshatras: [
        "Dhanishta (3rd-4th quarters)",
        "Shatabhisha — The Hundred Healers",
        "Purva Bhadrapada (1st-3rd quarters) — The Burning Pair"
      ]
    },
    {
      sign: "Pisces (Meena)",
      nakshatras: [
        "Purva Bhadrapada (4th quarter)",
        "Uttara Bhadrapada — The Warrior of the Deep",
        "Revati — The Wealthy"
      ]
    }
  ];

  const dashaRulers = [
    { planet: "Ketu", nakshatras: "Ashwini, Magha, Mula" },
    { planet: "Venus", nakshatras: "Bharani, Purva Phalguni, Purva Ashadha" },
    { planet: "Sun", nakshatras: "Krittika, Uttara Phalguni, Uttara Ashadha" },
    { planet: "Moon", nakshatras: "Rohini, Hasta, Shravana" },
    { planet: "Mars", nakshatras: "Mrigashira, Chitra, Dhanishta" },
    { planet: "Rahu", nakshatras: "Ardra, Swati, Shatabhisha" },
    { planet: "Jupiter", nakshatras: "Punarvasu, Vishakha, Purva Bhadrapada" },
    { planet: "Saturn", nakshatras: "Pushya, Anuradha, Uttara Bhadrapada" },
    { planet: "Mercury", nakshatras: "Ashlesha, Jyeshtha, Revati" },
  ];

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>Nakshatra: Your True Cosmic DNA | Cosmic Brief</title>
        <meta name="description" content="Discover the 27 lunar mansions of Vedic astrology. Learn why your Moon nakshatra reveals more about you than your zodiac sign ever could." />
        <link rel="canonical" href="https://cosmicbrief.com/blog/what-is-nakshatra" />
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
          <Link to="/blog/category/learn" className="text-cream/50 hover:text-cream text-sm">
            Learn Vedic Astrology
          </Link>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream mb-4 leading-tight">
          Nakshatra: Your True Cosmic DNA
        </h1>

        {/* Category & Read Time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 text-xs bg-gold/10 text-gold rounded">
            Learn Vedic Astrology
          </span>
          <span className="text-cream/40 text-sm">7 min read</span>
        </div>

        {/* Author and Date */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/maya.png" alt="Maya G." className="w-8 h-8 rounded-full" />
          <p className="text-cream/50 text-sm">
            By Maya G. · January 18, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6 text-cream/80 leading-relaxed">
          <p className="text-lg">
            You probably know your zodiac sign. Maybe you know your rising sign too. But if you've never heard of your nakshatra, you're missing the most revealing piece of your astrological profile.
          </p>

          <p>
            Nakshatras are the 27 lunar mansions of Vedic astrology — constellations the Moon passes through each month. While your zodiac sign paints in broad strokes, your nakshatra adds the fine details. It's the difference between knowing someone is "creative" and understanding exactly how their creativity moves through the world.
          </p>

          <p className="text-cream font-medium">
            This is where Vedic astrology gets specific. This is where it gets personal.
          </p>

          {/* What is a Nakshatra */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            What is a Nakshatra?
          </h2>

          <p>
            The zodiac has 12 signs, each spanning 30 degrees. Nakshatras divide the same sky into 27 segments of 13°20' each. They're smaller, more precise — and in Vedic astrology, they're considered more telling than the signs themselves.
          </p>

          <p className="text-cream">Each nakshatra has:</p>

          <p>
            <strong className="text-cream">A ruling planet</strong> that colors its energy — Mars, Venus, Jupiter, Saturn, Mercury, Moon, Sun, Rahu, or Ketu.
          </p>

          <p>
            <strong className="text-cream">A symbol</strong> that captures its essence — a bed, a drum, a sword, a tear drop, roots of a tree.
          </p>

          <p>
            <strong className="text-cream">A deity</strong> from the Vedic tradition that embodies its deeper meaning.
          </p>

          <p>
            <strong className="text-cream">A shakti</strong> — a unique power or capacity that the nakshatra carries.
          </p>

          <p>
            When someone asks "what's your sign?" in Western astrology, they're asking about your Sun. In Vedic astrology, practitioners often care more about your Moon's nakshatra — because the Moon represents your mind, your emotions, your inner experience of being alive.
          </p>

          {/* Interactive Nakshatra Wheel */}
          <div className="my-12 p-6 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream text-center mb-6">
              The Nakshatra Wheel
            </h3>
            <NakshatraWheel />
          </div>

          {/* The 27 Nakshatras */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The 27 Nakshatras
          </h2>

          <p>Here's a quick map of all 27, grouped by the zodiac signs they fall within:</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8">
            {nakshatraList.map((group, index) => (
              <div key={index} className="border-l-2 border-gold/30 pl-4 py-2">
                <h3 className="text-gold font-medium mb-2 text-sm">{group.sign}</h3>
                <ul className="space-y-0.5">
                  {group.nakshatras.map((nakshatra, i) => (
                    <li key={i} className="text-cream/70 text-xs">• {nakshatra}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p>
            Each nakshatra carries a distinct energy. Rohini is sensual and magnetic. Ardra is intense and transformative. Revati is gentle and boundaryless. Knowing yours adds dimension that sun signs can't touch.
          </p>

          {/* Nakshatra Deep Dives */}
          <div className="my-12 p-6 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-4">Nakshatra Deep Dives</h3>
            <p className="text-cream/70 text-sm mb-4">Explore individual nakshatras in detail:</p>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <Link to="/blog/ashwini-nakshatra" className="text-gold hover:underline">Ashwini — The Swift Healers →</Link>
              <Link to="/blog/bharani-nakshatra" className="text-gold hover:underline">Bharani — The Bearer of Life →</Link>
              <Link to="/blog/krittika-nakshatra" className="text-gold hover:underline">Krittika — The Cosmic Cutter →</Link>
              <Link to="/blog/rohini-nakshatra" className="text-gold hover:underline">Rohini — The Red Star of Desire →</Link>
              <Link to="/blog/mrigashira-nakshatra" className="text-gold hover:underline">Mrigashira — The Searching Star →</Link>
              <Link to="/blog/ardra-nakshatra" className="text-gold hover:underline">Ardra — The Storm Star →</Link>
              <Link to="/blog/punarvasu-nakshatra" className="text-gold hover:underline">Punarvasu — Return of the Light →</Link>
              <Link to="/blog/pushya-nakshatra" className="text-gold hover:underline">Pushya — The Nourishing Star →</Link>
              <Link to="/blog/ashlesha-nakshatra" className="text-gold hover:underline">Ashlesha — The Coiled Serpent →</Link>
              <Link to="/blog/magha-nakshatra" className="text-gold hover:underline">Magha — The Throne of Power →</Link>
              <Link to="/blog/purva-phalguni-nakshatra" className="text-gold hover:underline">Purva Phalguni — The Bed of Pleasure →</Link>
              <Link to="/blog/uttara-phalguni-nakshatra" className="text-gold hover:underline">Uttara Phalguni — Noble Service →</Link>
              <Link to="/blog/hasta-nakshatra" className="text-gold hover:underline">Hasta — The Divine Hand →</Link>
              <Link to="/blog/purva-bhadrapada-nakshatra" className="text-gold hover:underline">Purva Bhadrapada — The Burning Pair →</Link>
            </div>
          </div>

          {/* Why Your Moon Nakshatra Matters Most */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Why Your Moon Nakshatra Matters Most
          </h2>

          <p>
            In Western astrology, the Sun gets top billing. It represents your ego, your identity, your conscious self.
          </p>

          <p>
            Vedic astrology flips the hierarchy. The Moon — your mind, your emotional nature, your felt experience — takes center stage. And the nakshatra your Moon occupied at your birth becomes one of the most important factors in your entire chart.
          </p>

          <p className="text-cream">Your Moon nakshatra reveals:</p>

          <p>
            <strong className="text-cream">How you process emotions.</strong> A Moon in Ashlesha (the serpent) processes very differently than a Moon in Pushya (the nurturer).
          </p>

          <p>
            <strong className="text-cream">What environments you need.</strong> Some nakshatras thrive in solitude; others wither without community.
          </p>

          <p>
            <strong className="text-cream">Your instinctive patterns.</strong> The reactions that happen before thinking kicks in.
          </p>

          <p>
            <strong className="text-cream">What genuinely fulfills you.</strong> Not what you think should fulfill you — what actually does.
          </p>

          <p>
            This is why two people with the same Moon sign can feel so different. A Cancer Moon in Pushya and a Cancer Moon in Ashlesha share watery emotional depth, but express it through completely different filters.
          </p>

          {/* Your Nakshatra and Your Dasha */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Your Nakshatra and Your Dasha
          </h2>

          <p>Here's where nakshatras become predictive.</p>

          <p>
            Vedic astrology uses a timing system called Vimshottari Dasha — planetary periods that unfold in a specific sequence based on your Moon's nakshatra at birth.
          </p>

          <p className="text-cream">Each nakshatra is ruled by a planet:</p>

          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-cream/20">
                  <th className="text-left py-2 px-3 text-gold font-medium">Planet</th>
                  <th className="text-left py-2 px-3 text-gold font-medium">Rules</th>
                </tr>
              </thead>
              <tbody className="text-cream/70">
                {dashaRulers.map((item, index) => (
                  <tr key={index} className="border-b border-cream/10">
                    <td className="py-2 px-3 text-cream">{item.planet}</td>
                    <td className="py-2 px-3">{item.nakshatras}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            If you were born with Moon in Punarvasu, your dasha sequence begins with Jupiter. If your Moon was in Rohini, it begins with Moon. This starting point ripples through your entire life — determining which planetary periods you'll experience and when.
          </p>

          <p>
            Your dasha periods are the backbone of Vedic timing. They explain why certain years feel expansive and others feel contracting. Why some phases bring relationships and others bring solitude. Why opportunities cluster at certain times.
          </p>

          <p>
            Your 2026 is shaped by your current dasha.{" "}
            <Link to="/vedic/input" className="text-gold hover:underline">
              See what's active in your chart →
            </Link>
          </p>

          {/* Finding Your Nakshatra */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Finding Your Nakshatra
          </h2>

          <p>
            To know your Moon nakshatra, you need your exact birth time and location. The Moon moves through a nakshatra roughly every day, so precision matters.
          </p>

          <p>
            Your birth chart will show not just your Moon nakshatra, but the nakshatra placement of every planet — each adding another layer of meaning.
          </p>

          <div className="my-8">
            <Link to="/get-birth-chart">
              <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-6 py-5">
                Get your free Vedic birth chart
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p>
            Once you have it, start with your Moon nakshatra. Read about its symbol, deity, and ruling planet. Notice what resonates. This is the beginning of understanding your chart as more than a collection of traits — as a map of how your consciousness moves through time.
          </p>

          {/* Going Deeper */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Going Deeper
          </h2>

          <p>
            Nakshatras are a lifetime study. Each of the 27 has four padas (quarters), further subdivided by the signs of the zodiac. There are nakshatra compatibility systems (for relationships), nakshatra-based muhurta (for timing decisions), and endless layers of interpretation.
          </p>

          <p>But start simple. Start with your Moon.</p>

          <p>
            When you know your nakshatra — really know it, beyond the surface keywords — you start to recognize yourself in ancient patterns. Not as limitation, but as illumination. The stars aren't telling you who to be. They're reflecting who you already are.
          </p>

          <div className="my-8">
            <Link to="/get-birth-chart">
              <Button variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-medium px-6 py-5">
                Discover your nakshatra
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-16 pt-12 border-t border-cream/10">
          <h2 className="font-display text-xl text-cream mb-6">Related Posts</h2>
          <div className="space-y-3">
            <Link to="/vedic-astrology-explained" className="block text-gold hover:underline">
              What is Vedic Astrology? A Modern Guide →
            </Link>
            <Link to="/vedic-vs-western-astrology" className="block text-gold hover:underline">
              Vedic vs Western Astrology: 5 Key Differences →
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
            <p className="text-cream/70">
              <Link to="/compatibility" className="text-gold hover:underline font-medium">Compatibility Check</Link>
              {" "}— See how your nakshatras align with someone else's.
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

export default WhatIsNakshatraPage;
