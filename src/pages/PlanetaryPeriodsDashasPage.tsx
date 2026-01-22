import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const PlanetaryPeriodsDashasPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Planetary Periods (Dasha System) Explained: Your Life's Timeline",
    "description": "Understand the Vedic dasha system - how planetary periods shape your life in cycles of 6-20 years. Learn which period you're in and what it means.",
    "datePublished": "2025-01-21",
    "dateModified": "2025-01-21",
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
      "@id": "https://cosmicbrief.com/blog/planetary-periods-dashas"
    },
    "keywords": ["dasha system", "planetary periods", "vedic astrology", "mahadasha", "antardasha", "vimshottari dasha", "jyotish timing"]
  };

  const periodLengths = [
    { planet: "Ketu", years: 7 },
    { planet: "Venus", years: 20 },
    { planet: "Sun", years: 6 },
    { planet: "Moon", years: 10 },
    { planet: "Mars", years: 7 },
    { planet: "Rahu", years: 18 },
    { planet: "Jupiter", years: 16 },
    { planet: "Saturn", years: 19 },
    { planet: "Mercury", years: 17 },
  ];

  const venusSubPeriods = [
    { combo: "Venus-Venus", duration: "3 years 4 months" },
    { combo: "Venus-Sun", duration: "1 year" },
    { combo: "Venus-Moon", duration: "1 year 8 months" },
    { combo: "Venus-Mars", duration: "1 year 2 months" },
    { combo: "Venus-Rahu", duration: "3 years" },
    { combo: "Venus-Jupiter", duration: "2 years 8 months" },
    { combo: "Venus-Saturn", duration: "3 years 2 months" },
    { combo: "Venus-Mercury", duration: "2 years 10 months" },
    { combo: "Venus-Ketu", duration: "1 year 2 months" },
  ];

  const nakshatraRulers = [
    { planet: "Ketu", nakshatras: "Ashwini, Magha, Moola" },
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
        <title>Planetary Periods (Dasha System) Explained | Cosmic Brief</title>
        <meta name="description" content="Understand the Vedic dasha system - how planetary periods shape your life in cycles of 6-20 years. Learn which period you're in and what it means." />
        <link rel="canonical" href="https://cosmicbrief.com/blog/planetary-periods-dashas" />
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
          Planetary Periods Explained: The Vedic Timing System
        </h1>

        {/* Category & Read Time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 text-xs bg-gold/10 text-gold rounded">
            Learn Vedic Astrology
          </span>
          <span className="text-cream/40 text-sm">15 min read</span>
        </div>

        {/* Author and Date */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/maya.png" alt="Maya G." className="w-8 h-8 rounded-full" />
          <p className="text-cream/50 text-sm">
            By Maya G. · January 21, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6 text-cream/80 leading-relaxed">

          {/* Quick Answer Box */}
          <div className="p-6 bg-gold/5 rounded-lg border border-gold/20 my-8">
            <h3 className="font-display text-lg text-cream mb-4">Quick Answer</h3>
            <p className="mb-4">
              In Vedic astrology, you're always living through a <strong className="text-cream">planetary period</strong> (called a dasha) - a cycle where one planet becomes the dominant influence in your life. These periods last 6-20 years each, creating distinct "life chapters" with different themes, opportunities, and challenges.
            </p>
            <p className="mb-4">
              <strong className="text-cream">Why this matters:</strong> While Western astrology focuses on transits (where planets are NOW), Vedic astrology says the planet <em>whose period you're in</em> matters more. Two people can experience the same transit completely differently based on which planetary period they're living through.
            </p>
            <p className="text-cream font-medium">The system at a glance:</p>
            <ul className="mt-2 space-y-1 text-cream/70">
              <li>• <strong className="text-cream">Mahadasha (Major Period):</strong> 6-20 years - your current life chapter</li>
              <li>• <strong className="text-cream">Antardasha (Sub-Period):</strong> Months to years within the major period</li>
              <li>• <strong className="text-cream">Pratyantardasha (Micro-Period):</strong> Weeks to months - fine-tuned timing</li>
            </ul>
          </div>

          <p>
            Think of it like seasons within seasons: You're in a 20-year "summer" (Venus period), currently experiencing a 3-year "June" (Mars sub-period), in a 2-month "first week of June" (Mercury micro-period).
          </p>

          {/* Why Planetary Periods Are Vedic's Superpower */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Why Planetary Periods Are Vedic Astrology's Superpower
          </h2>

          <p>This is what makes Vedic astrology fundamentally different from Western astrology.</p>

          <p>
            <strong className="text-cream">Western approach:</strong> "Saturn is transiting your 10th house, so career is affected this year."
            <br />
            <span className="text-cream/60 italic">Problem: Everyone born within ~2 years of you has this same transit.</span>
          </p>

          <p>
            <strong className="text-cream">Vedic approach:</strong> "You're in a Sun major period, and Sun rules your 10th house, so career is your dominant theme for the next 6 years. Saturn's transit adds pressure to what you're already focused on."
            <br />
            <span className="text-cream/60 italic">Advantage: Personalized to YOUR chart and YOUR timeline.</span>
          </p>

          <p className="text-cream">The planetary period system answers questions like:</p>
          <ul className="space-y-2 text-cream/70">
            <li>• Why did my life feel so different in my 20s vs my 30s?</li>
            <li>• Why did that opportunity come when it did?</li>
            <li>• When will things shift for me?</li>
            <li>• Why is my sibling (same family, similar upbringing) having such a different experience right now?</li>
          </ul>

          <p className="text-cream font-medium">The answer is usually: Different planetary periods.</p>

          {/* How the System Works */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            How the System Works
          </h2>

          <h3 className="font-display text-xl text-cream mt-8 mb-3">
            Your Starting Point: Moon's Nakshatra
          </h3>

          <p>
            Your planetary period sequence is determined by <strong className="text-cream">where your Moon was at birth</strong> - specifically, which of the 27 nakshatras (lunar mansions) it occupied.
          </p>

          <p>
            Each nakshatra is ruled by a planet, and that planet's period is where your life begins. From there, you cycle through all 9 planetary periods in a fixed order.
          </p>

          <p className="text-cream font-medium">The cycle order (always the same):</p>

          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-cream/20">
                  <th className="text-left py-2 px-3 text-gold font-medium">#</th>
                  <th className="text-left py-2 px-3 text-gold font-medium">Planet</th>
                  <th className="text-left py-2 px-3 text-gold font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="text-cream/70">
                {periodLengths.map((item, index) => (
                  <tr key={index} className="border-b border-cream/10">
                    <td className="py-2 px-3 text-cream/50">{index + 1}</td>
                    <td className="py-2 px-3 text-cream">{item.planet}</td>
                    <td className="py-2 px-3">{item.years} years</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-cream/20">
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-cream font-medium">Total cycle</td>
                  <td className="py-2 px-3 text-gold font-medium">120 years</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p>
            You start somewhere in this cycle based on your Moon's nakshatra and progress from there. Most people experience 4-6 major periods in their lifetime.
          </p>

          {/* Three Levels of Timing */}
          <h3 className="font-display text-xl text-cream mt-12 mb-3">
            The Three Levels of Timing
          </h3>

          <div className="space-y-6">
            <div className="p-4 bg-cream/5 rounded-lg border-l-2 border-gold">
              <h4 className="text-cream font-medium mb-2">Level 1: Mahadasha (Major Period) - 6 to 20 years</h4>
              <p className="text-cream/70">
                This is your <strong className="text-cream">life chapter</strong>. The planet ruling this period becomes the CEO of your life - its themes dominate everything.
              </p>
              <p className="text-cream/60 text-sm mt-2 italic">
                Example: In a Venus mahadasha (20 years), relationship themes, creativity, beauty, values, and finances take center stage - regardless of what transits are happening.
              </p>
            </div>

            <div className="p-4 bg-cream/5 rounded-lg border-l-2 border-gold/70">
              <h4 className="text-cream font-medium mb-2">Level 2: Antardasha (Sub-Period) - Months to 3+ years</h4>
              <p className="text-cream/70">
                Within your major period, you cycle through sub-periods ruled by each planet. This adds <strong className="text-cream">texture and variation</strong> to your main chapter.
              </p>
              <p className="text-cream/60 text-sm mt-2 italic">
                Example: Venus mahadasha + Mars antardasha = Taking bold action on relationship/creative themes. The Venus chapter gets Mars energy - more passion, drive, possibly conflict.
              </p>
            </div>

            <div className="p-4 bg-cream/5 rounded-lg border-l-2 border-gold/50">
              <h4 className="text-cream font-medium mb-2">Level 3: Pratyantardasha (Micro-Period) - Weeks to months</h4>
              <p className="text-cream/70">
                Sub-periods have their own sub-periods. This is where <strong className="text-cream">precise timing</strong> comes in - identifying specific windows for action.
              </p>
              <p className="text-cream/60 text-sm mt-2 italic">
                Most astrologers focus on major + sub-periods. Micro-periods are for fine-tuning important decisions.
              </p>
            </div>
          </div>

          <p className="text-cream/60 text-sm mt-4">
            Sub-period lengths within Venus mahadasha:
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <tbody className="text-cream/70">
                {venusSubPeriods.map((item, index) => (
                  <tr key={index} className="border-b border-cream/10">
                    <td className="py-1.5 px-3 text-cream">{item.combo}</td>
                    <td className="py-1.5 px-3">{item.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The 9 Planetary Periods */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The 9 Planetary Periods: What Each One Brings
          </h2>

          {/* Ketu */}
          <div className="mt-8 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Ketu Period (7 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Spirituality, detachment, letting go, past-life patterns, isolation, liberation
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Material attachments feel less important</li>
              <li>• Spiritual interests increase</li>
              <li>• Unexpected endings or separations</li>
              <li>• Feeling "between worlds"</li>
              <li>• Past patterns surface for release</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Don't cling. Let go of what's ending. Focus on inner development rather than external achievement.
            </p>
          </div>

          {/* Venus */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Venus Period (20 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Relationships, love, beauty, creativity, luxury, finances, pleasure, values
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Relationships become central to life</li>
              <li>• Creative abilities flourish</li>
              <li>• Financial opportunities (especially through Venus-ruled activities)</li>
              <li>• Marriage/partnership often occurs</li>
              <li>• Values clarify</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Cultivate beauty and harmony, but don't lose yourself in relationships or luxury.
            </p>
          </div>

          {/* Sun */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Sun Period (6 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Self, ego, authority, father, career, leadership, vitality, recognition
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Focus on self-development and identity</li>
              <li>• Leadership opportunities arise</li>
              <li>• Relationship with father/authority figures highlighted</li>
              <li>• Career advancement or public recognition</li>
              <li>• Confidence builds (or ego challenges arise)</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Lead with integrity. Balance confidence with humility. Take care of your health.
            </p>
          </div>

          {/* Moon */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Moon Period (10 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Mind, emotions, mother, home, nurturing, public, fluctuation, intuition
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Emotional life intensifies</li>
              <li>• Mother/maternal figures become important</li>
              <li>• Home and domestic matters take focus</li>
              <li>• Public-facing activities (Moon = masses)</li>
              <li>• Nurturing others or being nurtured</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Nurture your emotional health. Create a stable home base. Don't let moods run your life.
            </p>
          </div>

          {/* Mars */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Mars Period (7 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Action, courage, conflict, energy, siblings, property, competition, passion
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Energy and drive increase dramatically</li>
              <li>• Conflicts or competitions arise</li>
              <li>• Property/real estate matters activate</li>
              <li>• Sibling relationships highlighted</li>
              <li>• Courage tested and developed</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Channel energy constructively. Pick your battles wisely. Physical exercise is essential.
            </p>
          </div>

          {/* Rahu */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Rahu Period (18 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Ambition, worldly desire, obsession, innovation, foreigners, unconventional paths, illusion
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Intense worldly ambition</li>
              <li>• Unconventional or innovative pursuits</li>
              <li>• Foreign connections (travel, people, ideas)</li>
              <li>• Breaking from tradition</li>
              <li>• Material success possible (but may feel hollow)</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Pursue ambitions but stay grounded. Question whether you want what you're chasing. Watch for deception.
            </p>
          </div>

          {/* Jupiter */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Jupiter Period (16 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Wisdom, expansion, teaching, children, luck, spirituality, abundance, optimism
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Life expands in positive ways</li>
              <li>• Teaching or learning opportunities</li>
              <li>• Children may arrive</li>
              <li>• Spiritual understanding deepens</li>
              <li>• "Lucky" breaks or opportunities</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Expand thoughtfully. Share your wisdom. Stay humble despite success.
            </p>
          </div>

          {/* Saturn */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Saturn Period (19 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Discipline, hard work, limitations, delays, responsibility, maturity, longevity, karma
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Life demands hard work and patience</li>
              <li>• Responsibilities increase</li>
              <li>• Delays test your commitment</li>
              <li>• Long-term foundations built</li>
              <li>• Maturity deepens</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Embrace responsibility. Work hard. Be patient. Don't expect shortcuts.
            </p>
          </div>

          {/* Mercury */}
          <div className="mt-6 p-5 bg-cream/5 rounded-lg border border-cream/10">
            <h3 className="font-display text-xl text-cream mb-3">Mercury Period (17 years)</h3>
            <p className="text-cream/70 mb-3">
              <strong className="text-cream">Core themes:</strong> Communication, intellect, commerce, learning, siblings, adaptability, analysis
            </p>
            <p className="text-cream/70 mb-2"><strong className="text-cream">What happens:</strong></p>
            <ul className="space-y-1 text-cream/60 text-sm mb-3">
              <li>• Intellectual pursuits thrive</li>
              <li>• Communication skills develop</li>
              <li>• Business/commerce opportunities</li>
              <li>• Learning and education emphasized</li>
              <li>• Writing, speaking, teaching</li>
            </ul>
            <p className="text-cream/60 text-sm">
              <strong className="text-cream/80">Best approach:</strong> Learn constantly. Communicate clearly. Don't scatter your energy across too many projects.
            </p>
          </div>

          {/* How to Find Your Current Period */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            How to Find Your Current Period
          </h2>

          <p>
            To know your planetary periods, you need your exact birth time and location. Your period sequence is based on your Moon's nakshatra at birth.
          </p>

          <p className="text-cream font-medium mt-4">Nakshatra rulers:</p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-cream/20">
                  <th className="text-left py-2 px-3 text-gold font-medium">Planet</th>
                  <th className="text-left py-2 px-3 text-gold font-medium">Rules</th>
                </tr>
              </thead>
              <tbody className="text-cream/70">
                {nakshatraRulers.map((item, index) => (
                  <tr key={index} className="border-b border-cream/10">
                    <td className="py-2 px-3 text-cream">{item.planet}</td>
                    <td className="py-2 px-3">{item.nakshatras}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="my-8">
            <Link to="/vedic/input">
              <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-6 py-5">
                Get your free 2026 forecast with your current period
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Common Questions */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Common Questions About Planetary Periods
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-cream font-medium mb-2">"I'm about to enter Saturn period. Should I be scared?"</h3>
              <p className="text-cream/70">
                No. Saturn period is demanding, not disastrous. It requires hard work, patience, taking responsibility, and building for the long term. Many people achieve their greatest accomplishments during Saturn periods - through effort, not luck.
              </p>
            </div>

            <div>
              <h3 className="text-cream font-medium mb-2">"How do transits interact with periods?"</h3>
              <p className="text-cream/70">
                They layer on top of each other. <strong className="text-cream">Period = the foundation</strong> (what chapter you're in). <strong className="text-cream">Transit = current weather</strong> (what's happening now). The period tells you WHAT life area is active. The transit tells you WHAT'S HAPPENING in that area.
              </p>
            </div>

            <div>
              <h3 className="text-cream font-medium mb-2">"Can I change my period or its effects?"</h3>
              <p className="text-cream/70">
                You can't change which period you're in, but you can understand it better, strengthen the planet through remedial measures, use favorable sub-periods strategically, and focus on the positive houses the planet rules.
              </p>
            </div>
          </div>

          {/* The Bottom Line */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The Bottom Line
          </h2>

          <p>
            The planetary period system is Vedic astrology's answer to the question: <strong className="text-cream">"Why is my life different from others born at the same time?"</strong>
          </p>

          <p>
            Your periods create a <strong className="text-cream">personal timeline</strong> layered on top of collective transits. They explain why certain life chapters feel so distinct, why opportunities come when they do, and why you and your friend (with similar charts) are having totally different experiences.
          </p>

          <p className="text-cream">
            It's not about fatalism - it's about strategic awareness. Like knowing the seasons so you plant in spring and harvest in fall.
          </p>

          <div className="my-8">
            <Link to="/vedic/input">
              <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-6 py-5">
                Get your personal period analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-16 pt-12 border-t border-cream/10">
          <h2 className="font-display text-xl text-cream mb-6">Related Posts</h2>
          <div className="space-y-3">
            <Link to="/blog/what-is-nakshatra" className="block text-gold hover:underline">
              Nakshatra: Your True Cosmic DNA →
            </Link>
            <Link to="/vedic-astrology-explained" className="block text-gold hover:underline">
              What is Vedic Astrology? A Modern Guide →
            </Link>
            <Link to="/how-to-read-vedic-chart" className="block text-gold hover:underline">
              How to Read Your Vedic Birth Chart →
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

export default PlanetaryPeriodsDashasPage;
