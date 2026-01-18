import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { Sparkles } from 'lucide-react';

const HowToReadChartPage = () => {
  return (
    <>
      <Helmet>
        <title>How to Read Your Vedic Birth Chart: Complete Tutorial (2026) | Cosmic Brief</title>
        <meta name="description" content="Learn to read your Vedic astrology chart step-by-step. Understand houses, planets, signs, and what they mean for your life—explained in plain English." />
        <link rel="canonical" href="https://cosmicbrief.app/#/how-to-read-vedic-chart" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "How to Read Your Vedic Birth Chart: A Beginner's Guide",
            "description": "Learn to read your Vedic astrology chart step-by-step. Understand houses, planets, signs, and what they mean for your life—explained in plain English.",
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
                "name": "Do I need software to read my chart?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "For beginners, yes. Use a free Vedic astrology calculator online, or get a professional reading. Once you understand the basics, you can read charts by eye."
                }
              },
              {
                "@type": "Question",
                "name": "Which house system should I use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Most Vedic astrologers use Whole Sign houses (each sign = one house). Some use other systems. Start with Whole Sign—it's simplest and most traditional."
                }
              },
              {
                "@type": "Question",
                "name": "How accurate does my birth time need to be?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Very accurate—ideally to the minute. Your rising sign changes every 2 hours, and house placements shift constantly. Even 15 minutes off can change your chart significantly."
                }
              },
              {
                "@type": "Question",
                "name": "What if my chart shows difficult placements?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "All charts have challenges. The point isn't to have a 'perfect' chart but to understand your specific terrain and work with it skillfully. Often our greatest challenges become our greatest strengths."
                }
              },
              {
                "@type": "Question",
                "name": "How long does it take to learn Vedic astrology?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "To read basics: a few months. To become proficient: 2-3 years of study. To become a professional astrologer: 5-10 years. But you don't need to be an expert to benefit from it—get readings while you learn."
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
              How to Read Your Vedic Birth Chart: A Beginner's Guide
            </h1>

            {/* Quick Start Section */}
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 my-8">
              <h2 className="text-2xl font-semibold text-gold mt-0 mb-4">Quick Start</h2>
              <p className="text-cream-muted mb-4">
                A Vedic birth chart (also called a kundali or horoscope) is a map of where planets were positioned at your exact moment of birth. Here's what you need to know first:
              </p>
              <p className="text-cream-muted font-semibold mb-2">The 3 Most Important Things in Your Chart:</p>
              <ol className="text-cream-muted space-y-1 m-0 list-decimal pl-5">
                <li><strong className="text-cream">Rising Sign (Ascendant)</strong> - Your life path and how you show up in the world</li>
                <li><strong className="text-cream">Moon Sign + Nakshatra</strong> - Your emotional nature and inner world</li>
                <li><strong className="text-cream">Current Planetary Period</strong> - Which area of life is "activated" right now</li>
              </ol>
              <p className="text-cream-muted mt-4 mb-0">Everything else builds on these three foundations.</p>
            </div>

            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">To read your chart, you'll identify:</strong>
            </p>
            <ul className="text-cream-muted space-y-1 my-4">
              <li>Your rising sign (starting point)</li>
              <li>The 12 houses (life areas)</li>
              <li>Where your planets are (which house and sign)</li>
              <li>Which planets "rule" which houses</li>
              <li>Your current planetary periods (timing)</li>
            </ul>

            {/* Step 1: Understand the Structure */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Step 1: Understand the Structure
            </h2>
            <p className="text-cream-muted leading-relaxed">
              Think of your Vedic chart like a <strong className="text-cream">strategic map</strong> with three layers:
            </p>

            <div className="space-y-4 my-6">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">Layer 1: The Houses (12 Life Areas)</h4>
                <p className="text-cream-muted m-0">
                  Fixed locations representing different parts of life—career, relationships, health, etc.
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">Layer 2: The Signs (12 Zodiac Energies)</h4>
                <p className="text-cream-muted m-0">
                  How the planets express themselves—the "flavor" or energy quality.
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5">
                <h4 className="text-lg font-semibold text-gold mb-2">Layer 3: The Planets (9 Major Players)</h4>
                <p className="text-cream-muted m-0">
                  The actors in your life story—what's actually doing things.
                </p>
              </div>
            </div>

            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">The key insight:</strong> Planets sit in signs, which sit in houses. A planet in a certain sign affects a certain life area.
            </p>
            <p className="text-cream-muted leading-relaxed italic">
              <strong className="text-cream">Example:</strong> Venus (planet of love) in Scorpio (intense, transformative sign) in your 7th house (partnerships) = intense, transformative relationships.
            </p>

            {/* Step 2: Find Your Rising Sign */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Step 2: Find Your Rising Sign (Ascendant)
            </h2>
            <p className="text-cream-muted leading-relaxed">
              This is <strong className="text-cream">the most important element</strong> in Vedic astrology.
            </p>
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">What it is:</strong> The zodiac sign rising on the eastern horizon at your exact birth moment.
            </p>
            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Why it matters:</strong>
            </p>
            <ul className="text-cream-muted space-y-1 my-4">
              <li>Sets the layout of your entire chart</li>
              <li>Represents your life path and how you approach the world</li>
              <li>Determines which signs fall in which houses</li>
              <li>Changes every 2 hours, so exact birth time is critical</li>
            </ul>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">Rising Sign Quick Reference</h3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Aries Rising</h4>
                <p className="text-cream-muted text-base m-0">Pioneering energy. You lead, initiate, act. Life asks you to be courageous.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Taurus Rising</h4>
                <p className="text-cream-muted text-base m-0">Stable, value-driven energy. You build, maintain, create security.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Gemini Rising</h4>
                <p className="text-cream-muted text-base m-0">Curious, communicative energy. You learn, connect, share information.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Cancer Rising</h4>
                <p className="text-cream-muted text-base m-0">Nurturing, intuitive energy. You care, protect, create emotional safety.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Leo Rising</h4>
                <p className="text-cream-muted text-base m-0">Creative, expressive energy. You shine, perform, lead with heart.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Virgo Rising</h4>
                <p className="text-cream-muted text-base m-0">Analytical, service-oriented energy. You refine, improve, serve.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Libra Rising</h4>
                <p className="text-cream-muted text-base m-0">Diplomatic, relationship-focused energy. You balance, mediate, harmonize.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Scorpio Rising</h4>
                <p className="text-cream-muted text-base m-0">Intense, transformative energy. You investigate, transform, dive deep.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Sagittarius Rising</h4>
                <p className="text-cream-muted text-base m-0">Philosophical, adventurous energy. You explore, teach, expand.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Capricorn Rising</h4>
                <p className="text-cream-muted text-base m-0">Ambitious, disciplined energy. You build, achieve, take responsibility.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Aquarius Rising</h4>
                <p className="text-cream-muted text-base m-0">Innovative, humanitarian energy. You reform, connect, see systems.</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-1">Pisces Rising</h4>
                <p className="text-cream-muted text-base m-0">Intuitive, compassionate energy. You feel, transcend, merge.</p>
              </div>
            </div>

            {/* Step 3: The 12 Houses */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Step 3: The 12 Houses (What They Mean)
            </h2>
            <p className="text-cream-muted leading-relaxed">
              Houses represent <strong className="text-cream">life areas</strong>. When planets occupy or "rule" a house, they activate that area.
            </p>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">The Personal Houses (You)</h3>
            <div className="space-y-4 my-6">
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">1st House - Self & Identity</h4>
                <p className="text-cream-muted m-0">Your physical body, appearance, personality. How you start things and show up in life.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Focus on self-development, health, new beginnings</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">2nd House - Resources & Values</h4>
                <p className="text-cream-muted m-0">Money, possessions, material security. What you value and how you speak.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Financial matters, building assets, defining values</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">3rd House - Communication & Courage</h4>
                <p className="text-cream-muted m-0">Siblings, neighbors, short travels. Communication skills, writing, media.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Learning, connecting, building courage</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">4th House - Home & Emotional Foundation</h4>
                <p className="text-cream-muted m-0">Home, mother, property, emotional security. Your private life and where you come from.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Family matters, home changes, emotional work</em></p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">The External Houses (Your Expression)</h3>
            <div className="space-y-4 my-6">
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">5th House - Creativity & Joy</h4>
                <p className="text-cream-muted m-0">Children, romance (dating phase), creative expression, hobbies, education.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Creative projects, romance, learning, fun</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">6th House - Service & Health</h4>
                <p className="text-cream-muted m-0">Daily routines, health, wellness, service. Obstacles and how you overcome them.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Health focus, daily habits, problem-solving, service work</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">7th House - Partnerships</h4>
                <p className="text-cream-muted m-0">Marriage, business partnerships, one-on-one relationships. What you seek in others.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Relationship focus, partnerships forming or evolving</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">8th House - Transformation & Shared Resources</h4>
                <p className="text-cream-muted m-0">Deep psychology, transformation, joint finances, inheritance, occult, hidden things.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Major changes, shared resources, psychological work</em></p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">The Higher Purpose Houses (Your Growth)</h3>
            <div className="space-y-4 my-6">
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">9th House - Higher Learning & Philosophy</h4>
                <p className="text-cream-muted m-0">Higher education, wisdom, philosophy, long-distance travel, teachers, mentors.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Learning, travel, spiritual growth, teaching</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">10th House - Career & Public Life</h4>
                <p className="text-cream-muted m-0">Career, profession, reputation, father, authority figures. How the world sees you.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Career moves, public visibility, professional growth</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">11th House - Gains & Community</h4>
                <p className="text-cream-muted m-0">Income, financial gains, social circles, friends, networks, aspirations.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Networking, income growth, goal achievement</em></p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">12th House - Spirituality & Release</h4>
                <p className="text-cream-muted m-0">Spirituality, meditation, isolation, foreign lands, endings, losses, letting go.</p>
                <p className="text-cream-muted mt-1 mb-0 text-base"><em>If active: Spiritual practice, travel abroad, rest, retreat</em></p>
              </div>
            </div>

            {/* Step 4: The Planets */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Step 4: The Planets (The Actors)
            </h2>
            <p className="text-cream-muted leading-relaxed">
              Each planet represents a different energy or life theme:
            </p>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">Personal Planets (Your Inner World)</h3>
            <div className="overflow-x-auto my-8">
              <table className="w-full border-collapse text-base">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-cream font-semibold">Planet</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Represents</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Rules</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">When Strong</th>
                  </tr>
                </thead>
                <tbody className="text-cream-muted">
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">☉ Sun (Surya)</td>
                    <td className="py-3 px-4">Self, ego, vitality, father, authority</td>
                    <td className="py-3 px-4">Leo</td>
                    <td className="py-3 px-4">Confidence, leadership, clarity of purpose</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">☽ Moon (Chandra)</td>
                    <td className="py-3 px-4">Mind, emotions, mother, intuition</td>
                    <td className="py-3 px-4">Cancer</td>
                    <td className="py-3 px-4">Emotional intelligence, nurturing, intuition</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">☿ Mercury (Budha)</td>
                    <td className="py-3 px-4">Communication, intellect, commerce</td>
                    <td className="py-3 px-4">Gemini, Virgo</td>
                    <td className="py-3 px-4">Quick mind, communication, business acumen</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">♀ Venus (Shukra)</td>
                    <td className="py-3 px-4">Love, beauty, relationships, values</td>
                    <td className="py-3 px-4">Taurus, Libra</td>
                    <td className="py-3 px-4">Harmonious relationships, artistic talent</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">♂ Mars (Mangala)</td>
                    <td className="py-3 px-4">Action, energy, courage, conflict</td>
                    <td className="py-3 px-4">Aries, Scorpio</td>
                    <td className="py-3 px-4">Drive, courage, athletic ability, leadership</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-semibold text-cream mt-8 mb-4">Outer Planets (Your Growth & Challenges)</h3>
            <div className="overflow-x-auto my-8">
              <table className="w-full border-collapse text-base">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-cream font-semibold">Planet</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Represents</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Rules</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Energy</th>
                  </tr>
                </thead>
                <tbody className="text-cream-muted">
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">♃ Jupiter (Guru)</td>
                    <td className="py-3 px-4">Wisdom, expansion, luck, spirituality</td>
                    <td className="py-3 px-4">Sagittarius, Pisces</td>
                    <td className="py-3 px-4">Growth, opportunities, optimism</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">♄ Saturn (Shani)</td>
                    <td className="py-3 px-4">Discipline, responsibility, limitations</td>
                    <td className="py-3 px-4">Capricorn, Aquarius</td>
                    <td className="py-3 px-4">Discipline, longevity, practical achievement</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">☊ Rahu (North Node)</td>
                    <td className="py-3 px-4">Ambition, desire, growth edge</td>
                    <td className="py-3 px-4">Shadow planet</td>
                    <td className="py-3 px-4">Where you're compelled to grow</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium text-cream">☋ Ketu (South Node)</td>
                    <td className="py-3 px-4">Spirituality, detachment, release</td>
                    <td className="py-3 px-4">Shadow planet</td>
                    <td className="py-3 px-4">Where you need to let go</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Step 5: How to Read Your Chart */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Step 5: How to Read Your Chart (Practical Methods)
            </h2>

            <div className="bg-midnight/50 border border-border/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-semibold text-cream mt-0 mb-4">Method 1: House-by-House Analysis</h3>
              <ol className="text-cream-muted space-y-2 m-0">
                <li><strong className="text-cream">Step 1:</strong> Look at each house</li>
                <li><strong className="text-cream">Step 2:</strong> Note which sign is in that house</li>
                <li><strong className="text-cream">Step 3:</strong> Note if any planets are in that house</li>
                <li><strong className="text-cream">Step 4:</strong> Ask: "What does this planet in this sign do in this life area?"</li>
              </ol>
              <p className="text-cream-muted mt-4 mb-0 italic">
                <strong className="text-cream">Example:</strong> 7th house (relationships) has Sagittarius sign + Jupiter inside → Relationships are philosophical, expansive, growth-oriented. Likely to meet partners through teaching, travel, or spiritual contexts.
              </p>
            </div>

            <div className="bg-midnight/50 border border-border/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-semibold text-cream mt-0 mb-4">Method 2: Planet-by-Planet Analysis</h3>
              <ol className="text-cream-muted space-y-2 m-0">
                <li><strong className="text-cream">Step 1:</strong> Pick a planet you want to understand</li>
                <li><strong className="text-cream">Step 2:</strong> See which house it's in (that's what life area it activates)</li>
                <li><strong className="text-cream">Step 3:</strong> Note which sign it's in (that's <em>how</em> it expresses)</li>
                <li><strong className="text-cream">Step 4:</strong> Check which houses it <em>rules</em> (those areas are also influenced)</li>
              </ol>
              <p className="text-cream-muted mt-4 mb-0 italic">
                <strong className="text-cream">Example:</strong> Venus in 10th house (career) in Capricorn → Career success linked to artistic or relational skills. You take a serious, disciplined approach to love and money.
              </p>
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-semibold text-gold mt-0 mb-4">Method 3: Planetary Rulerships (The Secret Sauce)</h3>
              <p className="text-cream-muted mb-4">
                Each house is "ruled" by the planet that governs the sign in that house. This is how Vedic astrology connects the dots between different life areas.
              </p>
              <p className="text-cream-muted mb-2">
                <strong className="text-cream">Example chart:</strong>
              </p>
              <ul className="text-cream-muted space-y-1 mb-4">
                <li>1st house (self): Aries → ruled by Mars</li>
                <li>7th house (relationships): Libra → ruled by Venus</li>
                <li>10th house (career): Capricorn → ruled by Saturn</li>
              </ul>
              <p className="text-cream-muted m-0 italic">
                <strong className="text-cream">If Mars is in your 10th house:</strong> Mars (ruling your 1st house of self) sitting in your 10th house (career) means your identity is strongly tied to your career and public role.
              </p>
            </div>

            {/* Step 6: Current Planetary Period */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Step 6: Your Current Planetary Period (Dasha)
            </h2>
            <p className="text-cream-muted leading-relaxed">
              This is <strong className="text-cream">THE KEY</strong> to understanding timing in your life.
            </p>
            <p className="text-cream-muted leading-relaxed">
              You're always in a planetary period that lasts for years—this is your current "life chapter." The planet whose period you're in becomes <strong className="text-cream">the CEO of your life</strong> for those years.
            </p>

            <div className="grid md:grid-cols-3 gap-4 my-8">
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-2">Venus Period (20 years)</h4>
                <p className="text-cream-muted text-base m-0">Relationships, beauty, creativity, values are central themes</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-2">Saturn Period (19 years)</h4>
                <p className="text-cream-muted text-base m-0">Discipline, hard work, responsibility, building foundations</p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gold mb-2">Rahu Period (18 years)</h4>
                <p className="text-cream-muted text-base m-0">Ambition, worldly success, material desires, unconventional paths</p>
              </div>
            </div>

            <p className="text-cream-muted leading-relaxed">
              <strong className="text-cream">Sub-periods add texture:</strong> Venus major period + Mars sub-period = Taking action on relationship/creative themes. This is how Vedic astrology tells you WHEN to focus on what.
            </p>

            {/* Step 7: Real Example */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Step 7: Putting It All Together (Real Example)
            </h2>

            <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-semibold text-gold mt-0 mb-4">Chart Details:</h3>
              <ul className="text-cream-muted space-y-1 mb-4">
                <li><strong className="text-cream">Rising Sign:</strong> Virgo</li>
                <li><strong className="text-cream">Moon:</strong> Pisces, 7th house, Revati nakshatra</li>
                <li><strong className="text-cream">Sun:</strong> Aquarius, 6th house</li>
                <li><strong className="text-cream">Current Period:</strong> Jupiter mahadasha, Venus antardasha</li>
              </ul>

              <h4 className="text-lg font-semibold text-cream mb-3">Reading:</h4>
              <div className="space-y-3 text-cream-muted">
                <p className="m-0"><strong className="text-cream">Rising Sign (Virgo):</strong> This person approaches life analytically, with attention to detail. Service-oriented, health-conscious, practical.</p>
                <p className="m-0"><strong className="text-cream">Moon in Pisces, 7th house:</strong> Emotional nature is compassionate, intuitive. Relationships are central to emotional wellbeing.</p>
                <p className="m-0"><strong className="text-cream">Sun in Aquarius, 6th house:</strong> Core identity involves innovation, humanitarian work, service.</p>
                <p className="m-0"><strong className="text-cream">Current Jupiter Period + Venus sub-period:</strong> Right now, Venus themes are highlighted—relationships, creativity, values. Expect focus on relationship development, home/family growth, financial stability.</p>
              </div>
            </div>

            {/* Common Questions */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Common Questions When Reading Your Chart
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">"I have no planets in my 7th house. Does that mean no relationships?"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">No!</strong> An empty house doesn't mean that life area is absent. Look at which planet <em>rules</em> that house and where that ruling planet is located. Empty houses can actually be easier—no complex planetary energies to navigate.
                </p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">"I have 4 planets in one house. What does that mean?"</h4>
                <p className="text-cream-muted m-0">
                  A house with multiple planets is <strong className="text-cream">emphasized</strong>—that life area is very active and important in your life. Example: 4 planets in your 10th house = Career is HUGE in your life.
                </p>
              </div>
              <div className="border-l-4 border-gold/50 pl-6">
                <h4 className="text-lg font-semibold text-cream mb-2">"My chart ruler is in the 12th house. Is that bad?"</h4>
                <p className="text-cream-muted m-0">
                  <strong className="text-cream">No houses are "bad"</strong> in modern Vedic astrology. The 12th house represents spirituality, foreign lands, rest, and letting go. A chart ruler there suggests your life path involves one of these themes.
                </p>
              </div>
            </div>

            {/* Tips for Beginners */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              Tips for Beginners
            </h2>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-3">1. Start Simple</h3>
                <p className="text-cream-muted m-0">
                  Don't try to analyze everything at once. Focus on your rising sign, moon sign + nakshatra, current period, and one or two planets that interest you.
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-3">2. Use Keywords</h3>
                <p className="text-cream-muted m-0">
                  Each house, sign, and planet has 3-5 keywords. Combine them to build meaning. Example: Venus (love) + Aries (bold) + 3rd house (communication) = Bold communication style in love.
                </p>
              </div>
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cream mt-0 mb-3">3. Look for Patterns</h3>
                <p className="text-cream-muted m-0">
                  Which houses have the most planets? That's where your life focuses. Which planets are strong? Those themes come easily to you.
                </p>
              </div>
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gold mt-0 mb-3">4. Get a Professional Reading</h3>
                <p className="text-cream-muted m-0">
                  Vedic astrology is complex. Having someone interpret your chart saves you months of study and gives you actionable insights immediately.
                </p>
              </div>
            </div>

            {/* The Bottom Line */}
            <h2 className="text-3xl font-semibold text-gold mt-12 mb-6">
              The Bottom Line
            </h2>
            
            <p className="text-cream-muted leading-relaxed">
              Reading a Vedic birth chart is about understanding:
            </p>
            <ol className="text-cream-muted space-y-2 my-4">
              <li><strong className="text-cream">Where you're headed</strong> (rising sign)</li>
              <li><strong className="text-cream">How you feel</strong> (moon sign + nakshatra)</li>
              <li><strong className="text-cream">What's happening now</strong> (current planetary periods)</li>
              <li><strong className="text-cream">Which life areas are active</strong> (planets in houses)</li>
              <li><strong className="text-cream">How things express</strong> (signs coloring the planets)</li>
            </ol>
            
            <p className="text-cream-muted leading-relaxed">
              It's a map, not a mandate. You still make the choices. The chart just shows you the terrain.
            </p>
            <p className="text-cream-muted leading-relaxed">
              Think of it like weather: The chart can't make it rain, but it can tell you when rain is likely—so you know whether to plan a picnic or bring an umbrella.
            </p>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/40 rounded-2xl p-8 my-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-cream mt-0 mb-4">
                Ready for Your Personalized Interpretation?
              </h2>
              <p className="text-cream-muted text-lg mb-4">
                Skip the learning curve and get your chart interpreted for you. Our 2026 forecast shows you:
              </p>
              <ul className="text-cream-muted text-left max-w-md mx-auto space-y-1 mb-6">
                <li>• Your current planetary period and what it means</li>
                <li>• Which life areas are activated this year</li>
                <li>• Month-by-month guidance based on your chart</li>
                <li>• Key timing windows for major decisions</li>
              </ul>
              <Link to="/vedic/input">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-midnight font-semibold px-8 py-6 text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Your 2026 Forecast Now
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
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Do I need software to read my chart?</h4>
                <p className="text-cream-muted m-0">
                  A: For beginners, yes. Use a free Vedic astrology calculator online, or get a professional reading. Once you understand the basics, you can read charts by eye.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Which house system should I use?</h4>
                <p className="text-cream-muted m-0">
                  A: Most Vedic astrologers use <strong className="text-cream">Whole Sign houses</strong> (each sign = one house). Some use other systems. Start with Whole Sign—it's simplest and most traditional.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: How accurate does my birth time need to be?</h4>
                <p className="text-cream-muted m-0">
                  A: Very accurate—ideally to the minute. Your rising sign changes every 2 hours, and house placements shift constantly. Even 15 minutes off can change your chart significantly.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: Can I read charts for other people?</h4>
                <p className="text-cream-muted m-0">
                  A: You can learn to, but it takes practice and ethical responsibility. Start with your own chart and family members who consent. Consider professional training if you want to read for others seriously.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: What if my chart shows difficult placements?</h4>
                <p className="text-cream-muted m-0">
                  A: All charts have challenges. The point isn't to have a "perfect" chart but to understand your specific terrain and work with it skillfully. Often our greatest challenges become our greatest strengths.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-cream mb-2">Q: How long does it take to learn Vedic astrology?</h4>
                <p className="text-cream-muted m-0">
                  A: To read basics: a few months. To become proficient: 2-3 years of study. To become a professional astrologer: 5-10 years. But you don't need to be an expert to benefit from it—get readings while you learn.
                </p>
              </div>
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

export default HowToReadChartPage;
