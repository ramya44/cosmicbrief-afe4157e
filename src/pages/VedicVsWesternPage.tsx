import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { Sparkles } from 'lucide-react';

const VedicVsWesternPage = () => {
  return (
    <>
      <Helmet>
        <title>Vedic vs Western Astrology: Key Differences Explained (2026 Guide) | Cosmic Brief</title>
        <meta name="description" content="Discover the key differences between Vedic and Western astrology, why your zodiac sign might be different, and which system is right for you." />
        <link rel="canonical" href="https://cosmicbrief.app/#/vedic-vs-western-astrology" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Vedic vs Western Astrology: What's the Difference?",
            "description": "Discover the key differences between Vedic and Western astrology, why your zodiac sign might be different, and which system is right for you.",
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
                "name": "Will my personality change if I use Vedic astrology?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No! You're the same person. Vedic just uses a different measurement system that might describe you differently—or might resonate more. Think of it as getting a second opinion that might reveal something your first opinion missed."
                }
              },
              {
                "@type": "Question",
                "name": "Can I ignore Western astrology if I use Vedic?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can, but you don't have to! Many people find value in both. Western for psychological insight, Vedic for timing."
                }
              },
              {
                "@type": "Question",
                "name": "Is Vedic astrology tied to Hinduism?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Vedic astrology originated in ancient India and shares cultural roots with Hindu philosophy, but you don't need to be Hindu to use it — just like you don't need to be Greek to use Western astrology (which has roots in Hellenistic Greece)."
                }
              },
              {
                "@type": "Question",
                "name": "How do I find out my Vedic chart?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You need your exact birth time, date, and location. Enter that information to get your free Vedic forecast."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-celestial">
        <StarField />

        <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
          <article className="prose prose-invert prose-lg max-w-none text-lg">
            <h1 className="text-4xl md:text-5xl font-bold text-cream mb-6">
              Vedic vs Western Astrology: What's the Difference?
            </h1>

            {/* Quick Answer Section */}
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 my-8">
              <h2 className="text-2xl font-semibold text-gold mt-0 mb-4">Quick Answer</h2>
              <p className="text-cream-muted m-0">
                The main difference between Vedic and Western astrology is the <strong className="text-cream">zodiac system</strong>: Vedic uses the <strong className="text-cream">sidereal zodiac</strong> (based on actual star positions), while Western uses the <strong className="text-cream">tropical zodiac</strong> (based on seasons). This means your sun sign might be different in each system—and Vedic astrology places more emphasis on timing and life cycles.
              </p>
            </div>

            {/* Quick Comparison Table */}
            <h3 className="text-xl font-semibold text-cream mt-8 mb-4">Quick Comparison</h3>
            <div className="overflow-x-auto my-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-4 px-4 text-cream font-semibold">Feature</th>
                    <th className="text-left py-4 px-4 text-cream font-semibold">Vedic (Sidereal)</th>
                    <th className="text-left py-4 px-4 text-cream font-semibold">Western (Tropical)</th>
                  </tr>
                </thead>
                <tbody className="text-cream-muted">
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Zodiac Type</td>
                    <td className="py-3 px-4">Based on actual star positions</td>
                    <td className="py-3 px-4">Based on seasons (equinoxes)</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Your Sun Sign</td>
                    <td className="py-3 px-4">Often 1 sign earlier</td>
                    <td className="py-3 px-4">What you know from magazines</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Primary Focus</td>
                    <td className="py-3 px-4">Timing & life cycles (planetary periods)</td>
                    <td className="py-3 px-4">Psychological traits & transits</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Chart Calculation</td>
                    <td className="py-3 px-4">Accounts for precession (~23° difference)</td>
                    <td className="py-3 px-4">Fixed to March equinox</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Best For</td>
                    <td className="py-3 px-4">Strategic timing, major decisions</td>
                    <td className="py-3 px-4">Self-understanding, daily guidance</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Moon Emphasis</td>
                    <td className="py-3 px-4">27 lunar mansions (nakshatras)</td>
                    <td className="py-3 px-4">12 zodiac signs</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">Predictive Method</td>
                    <td className="py-3 px-4">Dasha system (planetary periods)</td>
                    <td className="py-3 px-4">Transits & progressions</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Why Your Sun Sign Is Different */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Why Your Sun Sign Is Different
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              If you've ever looked up your Vedic birth chart and thought "Wait, I'm not a Pisces anymore?"— you're not alone.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              Here's what's happening: Earth wobbles on its axis (called <strong className="text-cream">precession</strong>). Over the past 2,000+ years, this wobble has created a ~23-degree shift between the constellations and the seasons.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Western astrology</strong> decided to stay fixed to the seasons. So if you're born around March 21st, you're an Aries in Western astrology—always. It's tied to the spring equinox.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Vedic astrology</strong> tracks the actual stars. So that same March 21st birthday might make you a Pisces in Vedic, because the constellation behind the sun has shifted.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Which one is "right"?</strong> Both. They're measuring different things:
            </p>
            <ul className="text-cream-muted space-y-2 my-4">
              <li>Western = psychological archetype tied to seasonal energy</li>
              <li>Vedic = astronomical position tied to predictive timing</li>
            </ul>
            <p className="text-cream-muted leading-relaxed">
              Think of it like Fahrenheit vs Celsius—different systems, both valid, used for different purposes.
            </p>

            {/* The Real Difference */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              The Real Difference: Focus and Approach
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              The zodiac shift gets all the attention, but the <strong className="text-cream">real difference</strong> is what each system prioritizes:
            </p>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">Western Astrology: Self-Understanding</h3>
            <p className="text-cream-muted leading-relaxed">
              Western astrology excels at psychological insight. It's like therapy through the stars—helping you understand your inner world, patterns, and growth edges. It's deeply influenced by Jungian psychology and focuses on:
            </p>
            <ul className="text-cream-muted space-y-2 my-4">
              <li>Character traits and personality</li>
              <li>Current transits and their psychological impact</li>
              <li>Aspects between planets (angles that create dynamics)</li>
              <li>Houses as life areas you experience internally</li>
            </ul>
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Best for:</strong> Understanding yourself, processing emotions, daily/weekly horoscopes
            </p>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">Vedic Astrology: Strategic Timing</h3>
            <p className="text-cream-muted leading-relaxed">
              Vedic astrology is more like a strategic planning tool. It's focused on <strong className="text-cream">when</strong> things happen—the timing of opportunities, challenges, and life chapters. It uses:
            </p>
            <ul className="text-cream-muted space-y-2 my-4">
              <li><strong className="text-cream">Planetary periods (dashas)</strong>: You're always in a specific planet's "chapter" that lasts years, with sub-chapters lasting months</li>
              <li><strong className="text-cream">Nakshatras (lunar mansions)</strong>: 27 divisions of the zodiac that are more precise than the 12 signs</li>
              <li><strong className="text-cream">Transits combined with periods</strong>: When a planet moves through your chart + you're in a favorable period = powerful timing window</li>
            </ul>
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Best for:</strong> Making major decisions, timing career moves, understanding life cycles
            </p>

            {/* Key Concepts Unique to Each System */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Key Concepts Unique to Each System
            </h2>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">Vedic Astrology's Unique Tools</h3>
            
            <div className="space-y-4 my-6">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">1. Planetary Periods (Dasha System)</h4>
                <p className="text-cream-muted m-0">
                  You're always in a major "life chapter" governed by a specific planet—and that chapter has sub-chapters, and those have micro-chapters. These periods last for years, months, and weeks respectively.
                </p>
                <p className="text-cream-muted mt-2 mb-0 italic">
                  Example: If you're in your Venus major period (lasts 20 years), and currently in the Mars sub-period (lasts ~1 year), the themes of Venus get colored by Mars energy (action, conflict, drive).
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">2. Nakshatras (Lunar Mansions)</h4>
                <p className="text-cream-muted m-0">
                  Instead of 12 zodiac signs, Vedic divides the sky into 27 lunar mansions—each with its own flavor and planetary ruler. Your moon's nakshatra is considered more important than your sun sign.
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">3. Divisional Charts (Vargas)</h4>
                <p className="text-cream-muted m-0">
                  Vedic creates multiple "sub-charts" from your main chart—one for career, one for marriage, one for spiritual life, etc. It's like zooming in on specific life areas.
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">Western Astrology's Unique Tools</h3>

            <div className="space-y-4 my-6">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">1. Psychological Archetypes</h4>
                <p className="text-cream-muted m-0">
                  Western astrology interprets placements through the lens of psychology. Your Saturn isn't just about discipline—it's about your relationship with authority, structure, and the parts of life where you feel inadequate until you master them.
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">2. Aspects (Planetary Angles)</h4>
                <p className="text-cream-muted m-0">
                  Western places huge emphasis on the angles planets make to each other—trines, squares, oppositions, etc. These create the "plot" of your life's story.
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">3. Outer Planets (Uranus, Neptune, Pluto)</h4>
                <p className="text-cream-muted m-0">
                  Western astrology incorporated these modern discoveries; Vedic traditionally doesn't use them (though some modern Vedic astrologers do).
                </p>
              </div>
            </div>

            {/* Which One Should You Use */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Which One Should You Use?
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">The honest answer:</strong> It depends on what you need.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gold mt-0 mb-4">Choose Vedic if you want:</h3>
                <ul className="text-cream-muted space-y-2 m-0 list-none p-0">
                  <li>✅ Strategic timing for major life decisions</li>
                  <li>✅ To understand which "life chapter" you're in</li>
                  <li>✅ Predictive accuracy for events and opportunities</li>
                  <li>✅ Guidance on when to act vs when to wait</li>
                  <li>✅ A system used for thousands of years with consistent techniques</li>
                </ul>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-4">Choose Western if you want:</h3>
                <ul className="text-cream-muted space-y-2 m-0 list-none p-0">
                  <li>✅ Psychological insight and self-understanding</li>
                  <li>✅ To process emotions and inner patterns</li>
                  <li>✅ Daily/weekly guidance on current energy</li>
                  <li>✅ To understand relationship dynamics (synastry)</li>
                  <li>✅ A system that integrates modern psychology</li>
                </ul>
              </div>
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-semibold text-gold mt-0 mb-4">Or Use Both</h3>
              <p className="text-cream-muted m-0">
                Many people do! Western for self-understanding and Vedic for timing. They're complementary, not competitive.
              </p>
              <p className="text-cream-muted mt-3 mb-0">
                Think of it like this:
              </p>
              <ul className="text-cream-muted space-y-1 mt-2 mb-0">
                <li><strong className="text-cream">Western astrology</strong> = understanding your personality, motivations, and inner world</li>
                <li><strong className="text-cream">Vedic astrology</strong> = understanding your timeline, opportunities, and strategic windows</li>
              </ul>
            </div>

            {/* Common Misconceptions */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Common Misconceptions Debunked
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 1: "Vedic is more accurate because it uses actual stars"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> Both are accurate for what they measure. Vedic tracks astronomical positions, Western tracks seasonal archetypes. Neither is "more right."
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 2: "Vedic astrology is older, so it must be better"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> Age doesn't equal superiority. Western astrology has evolved and integrated modern psychology in valuable ways. Vedic has maintained consistent techniques. Both approaches have merit.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 3: "I need to pick one and stick with it"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> You can use both! Many astrologers are versed in both systems and find them complementary.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 4: "Western astrology is just pop culture fluff"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> Newspaper horoscopes aren't real Western astrology any more than fortune cookies are real Vedic astrology. Professional Western astrology is deep and psychologically sophisticated.
                </p>
              </div>
              
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">Myth 5: "If my signs are different, one must be wrong"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">Reality:</strong> Your signs are measuring different things. It's like saying "I'm 5'10" so I can't also be 178cm." Same height, different measurement systems.
                </p>
              </div>
            </div>

            {/* Real Example */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Real Example: How They Differ in Practice
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              Let's say you're considering a career change.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-4">Western astrology approach:</h3>
                <p className="text-cream-muted mb-3">
                  "Look at your 10th house (career sector), see what sign is there and any planets. Check current transits—is Jupiter expanding your career zone? Is Saturn asking for restructuring? Examine your natal aspects to understand your career patterns and psychological blocks."
                </p>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">What you get:</strong> Understanding of your career psychology, what fulfills you, and current energetic themes.
                </p>
              </div>
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gold mt-0 mb-4">Vedic astrology approach:</h3>
                <p className="text-cream-muted mb-3">
                  "Check which planetary period you're in. If you're in a Sun period and Sun rules your 10th house, career moves are favored. Look at when you enter a Mercury sub-period if Mercury is well-placed—that's your window. Check for major transits that align with favorable periods."
                </p>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">What you get:</strong> Specific timing windows for action, understanding of which life chapter you're in, and when opportunities are most likely.
                </p>
              </div>
            </div>

            {/* The Bottom Line */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              The Bottom Line
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              Vedic and Western astrology are like two different lenses on the same subject—your life. Western zooms in on your psychology and current energy. Vedic zooms out on your timeline and life cycles.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              The "zodiac sign difference" gets all the attention, but the real power of Vedic astrology is its <strong className="text-cream">timing system</strong>—the planetary periods that tell you which areas of life are activated and for how long.
            </p>
            
            <p className="text-cream-muted leading-relaxed">
              If you've only ever used Western astrology, trying Vedic can feel like upgrading from a weather report to a 10-day forecast. Instead of just knowing "it's stormy," you know "the storm hits Tuesday, clears Thursday, and next week is ideal for that outdoor project."
            </p>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/40 rounded-2xl p-8 my-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-cream mt-0 mb-4">
                Ready to Try Vedic Astrology?
              </h2>
              <p className="text-cream-muted text-lg mb-6">
                Get your free 2026 forecast based on Vedic astrology. See which life chapter you're in, what themes are active this year, and when your key turning points arrive.
              </p>
              <Link to="/vedic/input">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-midnight font-semibold px-8 py-6 text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Your Free 2026 Forecast
                </Button>
              </Link>
              <p className="text-cream-muted/60 text-sm mt-4">
                No credit card required. Takes 2 minutes.
              </p>
            </div>

            {/* FAQ Section */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              FAQ
            </h2>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Will my personality change if I use Vedic astrology?</h4>
                <p className="text-cream-muted m-0">
                  A: No! You're the same person. Vedic just uses a different measurement system that might describe you differently—or might resonate more. Think of it as getting a second opinion that might reveal something your first opinion missed.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Can I ignore Western astrology if I use Vedic?</h4>
                <p className="text-cream-muted m-0">
                  A: You can, but you don't have to! Many people find value in both. Western for psychological insight, Vedic for timing.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Is Vedic astrology tied to Hinduism?</h4>
                <p className="text-cream-muted m-0">
                  A: Vedic astrology originated in ancient India and shares cultural roots with Hindu philosophy, but you don't need to be Hindu to use it — just like you don't need to be Greek to use Western astrology (which has roots in Hellenistic Greece).
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Which celebrities use Vedic astrology?</h4>
                <p className="text-cream-muted m-0">
                  A: Vedic astrology is widely used in India by everyone from Bollywood stars to business leaders. In the West, it's gaining popularity among those who want predictive timing rather than just personality insights.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: How do I find out my Vedic chart?</h4>
                <p className="text-cream-muted m-0">
                  A: You need your exact birth time, date, and location. Enter that information <Link to="/vedic/input" className="text-gold hover:text-gold-light underline">here</Link> to get your free Vedic forecast.
                </p>
              </div>
            </div>

            {/* Related Reading */}
            <div className="mt-12 pt-8 border-t border-border/30">
              <h3 className="text-xl font-semibold text-cream mb-4">Related Reading:</h3>
              <ul className="text-cream-muted space-y-2">
                <li><Link to="/vedic-astrology-explained" className="text-gold hover:text-gold-light underline">What is Vedic Astrology? Complete Guide</Link></li>
                <li><Link to="/how-to-read-vedic-chart" className="text-gold hover:text-gold-light underline">How to Read Your Vedic Birth Chart</Link></li>
              </ul>
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

export default VedicVsWesternPage;
