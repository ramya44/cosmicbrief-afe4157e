import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ArrowLeft, Sparkles } from 'lucide-react';

const VedicAstrologyExplainedPage = () => {
  return (
    <>
      <Helmet>
        <title>What is Vedic Astrology? Complete Beginner's Guide (2026) | Cosmic Brief</title>
        <meta name="description" content="Vedic astrology explained simply. Learn what makes it different, how it works, and why it's gaining popularity as a strategic timing tool for life decisions." />
        <link rel="canonical" href="https://cosmicbrief.app/#/vedic-astrology-explained" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "What is Vedic Astrology? A Modern Guide",
            "description": "Vedic astrology explained simply. Learn what makes it different, how it works, and why it's gaining popularity as a strategic timing tool for life decisions.",
            "author": {
              "@type": "Organization",
              "name": "Cosmic Brief"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Do I need to know my exact birth time?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, birth time is crucial in Vedic astrology because it determines your rising sign and house placements. Even a few minutes off can change your chart. If you don't know it, check your birth certificate or hospital records."
                }
              },
              {
                "@type": "Question",
                "name": "Is Vedic astrology more accurate than Western?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "They measure different things. Vedic uses actual star positions (arguably more 'astronomically accurate'), but Western's psychological approach is deeply accurate for understanding personality. Both are valid."
                }
              },
              {
                "@type": "Question",
                "name": "Can Vedic astrology predict specific events?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It can identify high-probability periods for certain types of events (career opportunities, relationship milestones, health challenges), but it's not fortune-telling. Think weather forecast, not crystal ball."
                }
              },
              {
                "@type": "Question",
                "name": "Why is my moon sign so important in Vedic astrology?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "In Vedic, the moon represents your mind and emotions—your inner experience of life. Your moon's position and nakshatra are considered more revealing than your sun sign for understanding your nature and life path."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use both Western and Vedic astrology?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! Many people do. Use Western for psychological insights and day-to-day guidance, Vedic for major timing decisions and understanding life cycles."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-celestial">
        <StarField />

        {/* Header */}
        <header className="relative z-20 border-b border-border/30 bg-midnight/80 backdrop-blur-md sticky top-0">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-cream-muted hover:text-cream transition-colors flex items-center gap-2 font-sans">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
          <article className="prose prose-invert prose-lg max-w-none text-lg">
            <h1 className="text-4xl md:text-5xl font-bold text-cream mb-6">
              What is Vedic Astrology? A Modern Guide
            </h1>

            {/* Quick Answer Section */}
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 my-8">
              <h2 className="text-2xl font-semibold text-gold mt-0 mb-4">Quick Answer</h2>
              <p className="text-cream-muted mb-4">
                Vedic astrology (also called Jyotish) is an ancient Indian system that uses the <strong className="text-cream">actual positions of stars</strong> to create your birth chart and predict <strong className="text-cream">timing</strong> in your life. Unlike Western astrology's focus on personality, Vedic emphasizes <strong className="text-cream">when</strong> opportunities and challenges will arrive through a unique system of planetary periods called dashas.
              </p>
              <p className="text-cream-muted font-semibold mb-2">In 60 seconds:</p>
              <ul className="text-cream-muted space-y-1 m-0 list-none p-0">
                <li>• Uses sidereal zodiac (actual star positions, not seasons)</li>
                <li>• Your sun sign is often different than Western astrology</li>
                <li>• Focuses on timing and life cycles, not just personality</li>
                <li>• Uses "planetary periods" that last years/months/weeks</li>
                <li>• Moon placement is more important than sun</li>
                <li>• Originated in India 5,000+ years ago</li>
                <li>• Best for: strategic timing, major decisions, life planning</li>
              </ul>
            </div>

            {/* The Core Idea */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              The Core Idea: It's About Timing, Not Just Traits
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              Here's what makes Vedic astrology different from what you might know:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-cream mt-0 mb-3">Most Western astrology:</h3>
                <p className="text-cream-muted m-0 italic">
                  "You're a Capricorn, so you're ambitious and disciplined. Mercury is retrograde, so expect communication issues this week."
                </p>
              </div>
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gold mt-0 mb-3">Vedic astrology:</h3>
                <p className="text-cream-muted m-0 italic">
                  "You're in a Jupiter period for the next 16 years, which activates your career and expansion themes. Right now you're in a Mars sub-period (next 11 months), so expect more action and energy in how you pursue those opportunities. March 2026 starts a Venus micro-period—ideal for partnerships and financial decisions."
                </p>
              </div>
            </div>
            
            <p className="text-cream-muted leading-relaxed">
              See the difference? Vedic tells you <strong className="text-cream">which areas of life are "turned on" right now</strong> and <strong className="text-cream">for how long</strong>.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              It's less like reading your personality profile, and more like having a <strong className="text-cream">strategic timeline</strong> for your life.
            </p>

            {/* How Vedic Astrology Actually Works */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              How Vedic Astrology Actually Works
            </h2>

            {/* 1. Your Birth Chart */}
            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">1. Your Birth Chart: The Foundation</h3>
            <p className="text-cream-muted leading-relaxed">
              Like all astrology, Vedic starts with your birth chart—a snapshot of where the planets were at your exact birth moment.
            </p>
            <p className="text-cream-muted leading-relaxed font-semibold">What's different:</p>
            <ul className="text-cream-muted space-y-2 my-4">
              <li>Uses the <strong className="text-cream">sidereal zodiac</strong> (actual star positions)</li>
              <li>This creates a ~23° shift from Western charts</li>
              <li>Your signs are often different (but you're not a different person!)</li>
              <li>Emphasizes your <strong className="text-cream">rising sign</strong> and <strong className="text-cream">moon placement</strong> more than sun</li>
            </ul>
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Why this matters:</strong> More astronomical precision, and different tools for interpretation.
            </p>

            {/* 2. Planetary Periods */}
            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">2. Planetary Periods (Dashas): The Game-Changer</h3>
            <p className="text-cream-muted leading-relaxed">
              This is Vedic astrology's superpower—and what Western astrology doesn't have.
            </p>
            <p className="text-cream-muted leading-relaxed">
              You're always in a <strong className="text-cream">multi-layered timeline</strong> of planetary influences:
            </p>

            <div className="space-y-4 my-6">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">Mahadasha (Major Period)</h4>
                <p className="text-cream-muted text-base m-0">
                  Lasts 6-20 years depending on the planet. This is your current "life chapter" that defines the major theme of this chunk of your life.
                </p>
                <p className="text-cream-muted text-base mt-2 mb-0 italic">
                  Example: A 20-year Venus period emphasizes relationships, values, creativity, beauty
                </p>
              </div>
              
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">Antardasha (Sub-Period)</h4>
                <p className="text-cream-muted text-base m-0">
                  Lasts 2 months to 3+ years within the major period. Creates variations within your main chapter.
                </p>
                <p className="text-cream-muted text-base mt-2 mb-0 italic">
                  Example: Venus major period + Mars sub-period = taking action on relationship/creative themes
                </p>
              </div>
              
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">Pratyantardasha (Micro-Period)</h4>
                <p className="text-cream-muted text-base m-0">
                  Lasts weeks to months within the sub-period. Fine-tunes timing for specific windows.
                </p>
                <p className="text-cream-muted text-base mt-2 mb-0 italic">
                  Example: When to launch, when to wait, when to make decisions
                </p>
              </div>
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 my-8">
              <h4 className="text-lg font-semibold text-gold mb-3">Why this matters:</h4>
              <p className="text-cream-muted m-0">
                Instead of just "Saturn is transiting your 10th house" (which everyone born around the same time experiences), Vedic tells you whether <strong className="text-cream">YOU'RE</strong> in a period that activates career themes right now—or if you're focused elsewhere.
              </p>
            </div>

            <div className="bg-midnight/50 border border-border/30 rounded-xl p-6 my-8">
              <h4 className="text-lg font-semibold text-cream mb-3">Real-world example:</h4>
              <ul className="text-cream-muted space-y-2 m-0">
                <li>Person A and Person B are both Capricorn risings</li>
                <li>Saturn transits their career sector (same external influence)</li>
                <li><strong className="text-cream">Person A</strong> is in a Sun major period (Sun rules their 8th house of transformation) = Saturn transit brings career restructuring</li>
                <li><strong className="text-cream">Person B</strong> is in a Venus major period (Venus rules their 5th house of creativity) = Saturn transit brings discipline to creative projects, not necessarily career change</li>
              </ul>
              <p className="text-cream-muted mt-4 mb-0 font-semibold">
                Same transit, totally different meaning based on which <strong className="text-cream">period</strong> you're in.
              </p>
            </div>

            {/* 3. Nakshatras */}
            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">3. Nakshatras (Lunar Mansions): More Precision</h3>
            <p className="text-cream-muted leading-relaxed">
              Western astrology divides the zodiac into 12 signs. Vedic goes deeper with <strong className="text-cream">27 nakshatras</strong>—think of them as sub-divisions that add texture and nuance.
            </p>
            <p className="text-cream-muted leading-relaxed">
              Your moon's nakshatra (which of the 27 it falls in) is considered <strong className="text-cream">more important than your sun sign</strong> for understanding your emotional nature and life path.
            </p>
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Why this matters:</strong> Two people with "Aquarius moon" might have totally different emotional experiences depending on which nakshatra their moon occupies. It's like the difference between "California" and "San Francisco, California"—more specific location, more accurate insight.
            </p>

            {/* 4. Houses */}
            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">4. Houses: Your Life Areas</h3>
            <p className="text-cream-muted leading-relaxed">
              Both Vedic and Western use 12 houses representing different life areas, but Vedic calculates them differently (whole sign houses are common).
            </p>

            <div className="overflow-x-auto my-8">
              <table className="w-full border-collapse text-base">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-cream font-semibold">House</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Life Area</th>
                  </tr>
                </thead>
                <tbody className="text-cream-muted">
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">1st House</td>
                    <td className="py-2 px-4">Self, body, how you show up in the world</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">2nd House</td>
                    <td className="py-2 px-4">Money, possessions, values, speech</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">3rd House</td>
                    <td className="py-2 px-4">Communication, siblings, short travels, courage</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">4th House</td>
                    <td className="py-2 px-4">Home, mother, emotional foundation, property</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">5th House</td>
                    <td className="py-2 px-4">Creativity, children, romance, education</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">6th House</td>
                    <td className="py-2 px-4">Health, service, daily routines, obstacles</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">7th House</td>
                    <td className="py-2 px-4">Partnerships, marriage, business relationships</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">8th House</td>
                    <td className="py-2 px-4">Transformation, shared resources, psychology, occult</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">9th House</td>
                    <td className="py-2 px-4">Higher learning, philosophy, long travels, luck</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">10th House</td>
                    <td className="py-2 px-4">Career, public life, reputation, father</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">11th House</td>
                    <td className="py-2 px-4">Gains, social circles, aspirations, income</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-medium text-cream">12th House</td>
                    <td className="py-2 px-4">Spirituality, losses, foreign lands, isolation</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">How periods interact with houses:</strong> If you're in a Mars period and Mars rules your 10th house (career), career themes are activated. If Mars rules your 4th house (home), domestic matters and emotional foundations get the spotlight.
            </p>

            {/* What Vedic Astrology Can Tell You */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              What Vedic Astrology Can Tell You
            </h2>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">✅ What Vedic Excels At:</h3>

            <div className="space-y-4 my-6">
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">1. Strategic Timing</h4>
                <p className="text-cream-muted m-0">
                  "When should I start this business / get married / move cities / change careers?"
                  Vedic can identify favorable periods and challenging ones—not guarantees, but probabilities.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">2. Life Cycles and Chapters</h4>
                <p className="text-cream-muted m-0">
                  "Why did my 30s feel so different from my 20s?"
                  Planetary periods create distinct life chapters with different themes.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">3. Major Life Events</h4>
                <p className="text-cream-muted m-0">
                  "When are my peak opportunity windows?"
                  Vedic can identify periods when certain life areas are more likely to activate—career breakthroughs, relationship milestones, health challenges.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">4. Understanding Your Timeline</h4>
                <p className="text-cream-muted m-0">
                  "Why does it feel like I'm in a waiting period?"
                  Sometimes you're in a period that asks for patience and internal work, not external action. Knowing this prevents forcing things at the wrong time.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">5. Compatibility and Relationships</h4>
                <p className="text-cream-muted m-0">
                  Vedic has sophisticated compatibility analysis (Nakshatra matching, planetary period compatibility) that goes beyond sun sign compatibility.
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">⚠️ What Vedic Doesn't Do:</h3>
            <ul className="text-cream-muted space-y-2 my-4">
              <li><strong className="text-cream">It's not fortune-telling:</strong> Astrology shows <em>tendencies</em> and <em>timing</em>, not fixed outcomes. You still have free will.</li>
              <li><strong className="text-cream">It's not a substitute for therapy:</strong> While it can reveal patterns, it's not a replacement for psychological support.</li>
              <li><strong className="text-cream">It's not always literal:</strong> A challenging period doesn't mean doom. Often it means growth through challenges.</li>
              <li><strong className="text-cream">It's not 100% predictive:</strong> Life is complex. Astrology is one lens, not the only lens.</li>
            </ul>

            {/* Common Misconceptions */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Common Misconceptions
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 1: "Vedic astrology is religious"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> While it originated in India alongside Hindu philosophy, Vedic astrology is a technical system that anyone can use regardless of religion. It's like yoga—originally spiritual, now practiced by people of all backgrounds for its practical benefits.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 2: "It's too complicated for beginners"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> The basics are straightforward: Know your chart, know your current period, understand which life areas are activated. The depth is there if you want it, but you don't need to master Sanskrit to benefit from it.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 3: "Vedic astrology is fatalistic"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> Yes, some traditional interpretations can sound doom-and-gloom, but modern Vedic astrology (like what Cosmic Brief offers) is about <strong className="text-cream">empowerment</strong>: knowing the weather so you can dress accordingly.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 4: "My Western chart is wrong then?"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> Neither is wrong. Western and Vedic use different zodiacs for different purposes. Western focuses on psychology, Vedic on timing. Both are valid.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 5: "I need to study for years to use this"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> You can benefit immediately. Get a reading or forecast that interprets your chart for you—no study required. (Like driving a car without needing to understand the engine.)
                </p>
              </div>
            </div>

            {/* Vedic vs Western Quick Comparison */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Vedic Astrology vs Western Astrology (Quick Comparison)
            </h2>

            <div className="overflow-x-auto my-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-4 px-4 text-cream font-semibold">Aspect</th>
                    <th className="text-left py-4 px-4 text-cream font-semibold">Vedic (Jyotish)</th>
                    <th className="text-left py-4 px-4 text-cream font-semibold">Western</th>
                  </tr>
                </thead>
                <tbody className="text-cream-muted">
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Zodiac</td>
                    <td className="py-3 px-4">Sidereal (star-based)</td>
                    <td className="py-3 px-4">Tropical (season-based)</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Main Focus</td>
                    <td className="py-3 px-4">Timing & life cycles</td>
                    <td className="py-3 px-4">Psychology & traits</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Unique Tool</td>
                    <td className="py-3 px-4">Dasha system (planetary periods)</td>
                    <td className="py-3 px-4">Psychological archetypes</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Moon Importance</td>
                    <td className="py-3 px-4">Very high (27 nakshatras)</td>
                    <td className="py-3 px-4">Moderate (12 signs)</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Predictive Method</td>
                    <td className="py-3 px-4">Periods + transits</td>
                    <td className="py-3 px-4">Transits + progressions</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">House System</td>
                    <td className="py-3 px-4">Usually whole sign</td>
                    <td className="py-3 px-4">Various (Placidus common)</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Best For</td>
                    <td className="py-3 px-4">Major decisions, timing</td>
                    <td className="py-3 px-4">Self-understanding</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Bottom line:</strong> They're complementary, not competing. Use Western for psychological insight, Vedic for strategic timing.
            </p>

            <p className="text-cream-muted leading-relaxed mt-4">
              <Link to="/vedic-vs-western-astrology" className="text-gold hover:underline">
                Read our detailed comparison of Vedic vs Western Astrology →
              </Link>
            </p>

            {/* Why Vedic Astrology is Gaining Popularity */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Why Vedic Astrology is Gaining Popularity
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              In the past decade, more Westerners are discovering Vedic astrology because:
            </p>
            
            <ol className="text-cream-muted space-y-3 my-4">
              <li><strong className="text-cream">1. Precision:</strong> The planetary period system offers more specific timing than just transits</li>
              <li><strong className="text-cream">2. Practicality:</strong> It's action-oriented—helps with real decisions, not just self-reflection</li>
              <li><strong className="text-cream">3. Predictive accuracy:</strong> People report "aha moments" when they see past events line up with past periods</li>
              <li><strong className="text-cream">4. Different perspective:</strong> If Western astrology isn't resonating, Vedic offers fresh insights</li>
              <li><strong className="text-cream">5. Strategic mindset:</strong> Modern life is about timing—when to launch, pivot, invest, wait. Vedic speaks that language.</li>
            </ol>
            
            <p className="text-cream-muted leading-relaxed">
              It's not replacing Western astrology; it's adding a powerful timing layer that Western doesn't have.
            </p>

            {/* How to Get Started */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              How to Get Started with Vedic Astrology
            </h2>

            <div className="space-y-6 my-8">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-3">Step 1: Get Your Vedic Birth Chart</h3>
                <p className="text-cream-muted mb-2">You need:</p>
                <ul className="text-cream-muted space-y-1 m-0">
                  <li>• Exact birth date</li>
                  <li>• Exact birth time (to the minute if possible)</li>
                  <li>• Birth city/location</li>
                </ul>
              </div>
              
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-3">Step 2: Learn Your Big Three</h3>
                <ul className="text-cream-muted space-y-2 m-0">
                  <li><strong className="text-cream">Rising sign (Ascendant):</strong> How you show up, your life path</li>
                  <li><strong className="text-cream">Moon sign + Nakshatra:</strong> Your emotional nature, inner world</li>
                  <li><strong className="text-cream">Sun sign:</strong> Your core self (less emphasized than in Western, but still relevant)</li>
                </ul>
              </div>
              
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-3">Step 3: Find Out Your Current Periods</h3>
                <ul className="text-cream-muted space-y-2 m-0">
                  <li>Which <strong className="text-cream">mahadasha</strong> (major period) are you in? This is your current life chapter.</li>
                  <li>Which <strong className="text-cream">antardasha</strong> (sub-period) is active? This colors your experience right now.</li>
                  <li>When do these change? Transitions between periods are significant.</li>
                </ul>
              </div>
              
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-3">Step 4: Understand Which Houses are Active</h3>
                <p className="text-cream-muted m-0">
                  Based on your current planetary periods, which life areas are "turned on"? Career? Relationships? Spirituality? Home?
                </p>
              </div>
              
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gold mt-0 mb-3">Step 5: Get a Forecast</h3>
                <p className="text-cream-muted mb-4">
                  Instead of studying for years, let us interpret your chart and periods for you—especially if you're making major decisions.
                </p>
                <Link to="/vedic/input">
                  <Button className="bg-gold hover:bg-gold-light text-midnight font-semibold">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Your 2026 Forecast
                  </Button>
                </Link>
              </div>
            </div>

            {/* Real-World Example */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Real-World Example: How Vedic Astrology Works in Practice
            </h2>

            <div className="bg-midnight/50 border border-border/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-semibold text-cream mt-0 mb-4">Meet Sarah (hypothetical example):</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-cream mb-2">Western astrology tells her:</h4>
                  <p className="text-cream-muted m-0 italic">
                    "You're a Sagittarius sun, Gemini moon, Virgo rising. You love learning and freedom, but you're practical and detail-oriented. Currently, Saturn is transiting your 5th house—time to get serious about creative projects."
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gold mb-2">Vedic astrology tells her:</h4>
                  <p className="text-cream-muted m-0 italic">
                    "You're a Scorpio sun (sidereal zodiac), Taurus moon in Rohini nakshatra, Leo rising. You're in an 18-year Rahu major period (started in 2019, ends 2037) which activates your 10th house of career and public life. Right now you're in a Jupiter sub-period (until mid-2026) which rules your 5th house of creativity and 8th house of transformation.
                  </p>
                  <p className="text-cream-muted mt-3 mb-0">
                    Translation: Your career and public visibility are the main themes for the next decade+. Right now (through mid-2026), opportunities involving creative work, teaching, and transformative projects are especially favored. After mid-2026, you enter a Saturn sub-period—that's when career gets more structured and serious. Late 2026 is ideal for launching that creative business you've been planning, before Saturn's discipline takes over."
                  </p>
                </div>
              </div>
              
              <p className="text-cream-muted mt-6 mb-0 font-semibold">
                <strong className="text-cream">The difference:</strong> Vedic gave her <strong className="text-cream">timing, sequence, and duration</strong>. Western gave her <strong className="text-cream">psychological insight</strong>. Both valuable. Different purposes.
              </p>
            </div>

            {/* Is Vedic Right for You */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Is Vedic Astrology Right for You?
            </h2>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gold mt-0 mb-4">Vedic astrology is especially valuable if:</h3>
                <ul className="text-cream-muted space-y-2 m-0 list-none p-0">
                  <li>✅ You're making <strong className="text-cream">major life decisions</strong> (career change, marriage, moving, business launch)</li>
                  <li>✅ You want to understand <strong className="text-cream">why different life chapters feel so distinct</strong></li>
                  <li>✅ You're interested in <strong className="text-cream">predictive timing</strong>, not just personality insights</li>
                  <li>✅ Western astrology hasn't fully clicked for you</li>
                  <li>✅ You're a <strong className="text-cream">strategic thinker</strong> who wants to optimize timing</li>
                  <li>✅ You've noticed patterns in your life and want to understand the cycles</li>
                </ul>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-4">It might not be for you if:</h3>
                <ul className="text-cream-muted space-y-2 m-0 list-none p-0">
                  <li>❌ You're only interested in daily horoscopes (that's more of a Western thing)</li>
                  <li>❌ You want purely psychological self-exploration (Western is better for that)</li>
                  <li>❌ You're uncomfortable with predictive astrology (prefer "everything is in your hands")</li>
                  <li>❌ Dashas, Nakshatras sound like confusing concepts (we simplify though!)</li>
                </ul>
              </div>
            </div>

            {/* The Bottom Line */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              The Bottom Line
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              Vedic astrology is a <strong className="text-cream">timing system</strong> wrapped in a star map. It tells you:
            </p>
            <ul className="text-cream-muted space-y-2 my-4">
              <li>Which life chapter you're in (planetary periods)</li>
              <li>How long it lasts</li>
              <li>Which areas of life are activated</li>
              <li>When major shifts will occur</li>
            </ul>
            
            <p className="text-cream-muted leading-relaxed">
              It's not about personality quizzes or daily horoscopes. It's about understanding <strong className="text-cream">the seasons of your life</strong> so you can plant in spring, harvest in fall, and rest in winter.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              If Western astrology is like understanding your personality through the stars, Vedic astrology is like having a <strong className="text-cream">strategic calendar</strong> that shows you when different areas of your life are most likely to flourish.
            </p>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/40 rounded-2xl p-8 my-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-cream mt-0 mb-4">
                Ready to Try Vedic Astrology?
              </h2>
              <p className="text-cream-muted text-lg mb-6">
                Get your free 2026 forecast based on your Vedic birth chart. Discover which planetary period you're in, what themes are active this year, and when your key turning points arrive.
              </p>
              <Link to="/vedic/input">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-midnight font-semibold px-8 py-6 text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Your Free 2026 Forecast
                </Button>
              </Link>
              <p className="text-cream-muted/60 text-sm mt-4">
                Takes 2 minutes. No credit card required.
              </p>
            </div>

            {/* FAQ Section */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Do I need to know my exact birth time?</h4>
                <p className="text-cream-muted m-0">
                  A: Yes, birth time is crucial in Vedic astrology because it determines your rising sign and house placements. Even a few minutes off can change your chart. If you don't know it, check your birth certificate or hospital records.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Is Vedic astrology more accurate than Western?</h4>
                <p className="text-cream-muted m-0">
                  A: They measure different things. Vedic uses actual star positions (arguably more "astronomically accurate"), but Western's psychological approach is deeply accurate for understanding personality. Both are valid.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Can Vedic astrology predict specific events?</h4>
                <p className="text-cream-muted m-0">
                  A: It can identify high-probability periods for certain types of events (career opportunities, relationship milestones, health challenges), but it's not fortune-telling. Think weather forecast, not crystal ball.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Why is my moon sign so important in Vedic astrology?</h4>
                <p className="text-cream-muted m-0">
                  A: In Vedic, the moon represents your mind and emotions—your inner experience of life. Your moon's position and nakshatra are considered more revealing than your sun sign for understanding your nature and life path.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Do I have to believe in karma or reincarnation to use Vedic astrology?</h4>
                <p className="text-cream-muted m-0">
                  A: No. While Vedic astrology has roots in Vedic philosophy (which includes those concepts), you can use it purely as a practical timing tool. Many modern users don't subscribe to any particular spiritual beliefs.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: How often do planetary periods change?</h4>
                <p className="text-cream-muted m-0">
                  A: Major periods (mahadashas) change every 6-20 years. Sub-periods (antardashas) change every few months to a few years. Micro-periods (pratyantardashas) change every few weeks to months. There's always movement at some level.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Can I use both Western and Vedic astrology?</h4>
                <p className="text-cream-muted m-0">
                  A: Absolutely! Many people do. Use Western for psychological insights and day-to-day guidance, Vedic for major timing decisions and understanding life cycles.
                </p>
              </div>
            </div>

            {/* Birth Chart CTA Section */}
            <div className="bg-midnight/50 border border-border/30 rounded-2xl p-8 my-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-cream mt-0 mb-4">
                Get Your Free Birth Chart
              </h2>
              <p className="text-cream-muted text-lg mb-6">
                See your planetary positions, ascendant, moon sign, and nakshatra based on Vedic calculations—completely free.
              </p>
              <Link to="/get-birth-chart">
                <Button size="lg" variant="outline" className="border-gold/50 text-cream hover:bg-gold/10 font-semibold px-8 py-6 text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Your Free Birth Chart
                </Button>
              </Link>
            </div>
          </article>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/30 bg-midnight/50 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4 text-center text-cream-muted text-xs">
            <p>&copy; {new Date().getFullYear()} Cosmic Brief. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <Link to="/privacy" className="hover:text-cream transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-cream transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-cream transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default VedicAstrologyExplainedPage;
