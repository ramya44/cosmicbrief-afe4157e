import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowLeft, ArrowRight, Calendar, Heart, Briefcase, Activity, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const AstrologyForecast2026Page = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "2026 Astrology: Major Transits & Forecasts",
    "description": "Explore 2026's major planetary transits including Saturn and Neptune entering Aries, Jupiter in Cancer to Leo, and their influence on career, love, health, and global events.",
    "datePublished": "2025-01-01",
    "dateModified": "2026-01-10",
    "author": {
      "@type": "Organization",
      "name": "Cosmic Brief"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Cosmic Brief"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://cosmicbrief.com/2026-astrology-forecast"
    },
    "keywords": ["astrology 2026", "saturn in aries", "neptune in aries", "jupiter in cancer", "jupiter in leo", "pluto in aquarius", "uranus in gemini", "2026 horoscope", "planetary transits 2026"]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What makes 2026 astrologically significant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "2026 marks the permanent entry of both Saturn and Neptune into Aries after years in Pisces. This represents a shift from dissolving, emotional, Piscean themes to initiating, active, Aries themes. The last time Neptune was in Aries was 1861-1875; the last time Saturn was in Aries was 1996-1999."
        }
      },
      {
        "@type": "Question",
        "name": "Are these predictions or interpretations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "These are interpretations of astrological symbolism, not predictions. Astrology describes potential themes and energetic qualities; it does not determine specific outcomes or override free will and personal circumstances."
        }
      },
      {
        "@type": "Question",
        "name": "Which zodiac signs are most affected in 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Cardinal signs (Aries, Cancer, Libra, Capricorn) experience these transits most directly. However, everyone experiences the collective shift in cultural energy regardless of Sun sign."
        }
      },
      {
        "@type": "Question",
        "name": "Is 2026 a good or bad year?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Astrological years aren't inherently good or bad. 2026's transits favor action, courage, and initiation. Whether that feels supportive or challenging depends on individual circumstances and readiness for change."
        }
      }
    ]
  };

  const transits = [
    { planet: "Neptune", movement: "Re-enters Aries (permanent)", date: "January 26, 2026" },
    { planet: "Saturn", movement: "Re-enters Aries (permanent)", date: "February 13-15, 2026" },
    { planet: "Jupiter", movement: "Remains in Cancer", date: "Through June 30, 2026" },
    { planet: "Jupiter", movement: "Enters Leo", date: "June 30, 2026" },
    { planet: "Uranus", movement: "Continues in Gemini", date: "Ongoing (entered July 2025)" },
    { planet: "Pluto", movement: "Continues in Aquarius", date: "Ongoing" },
  ];

  const topicCards = [
    {
      icon: Sparkles,
      category: "Understanding the Core Shifts",
      title: "Why 2026 Is a Turning Point in Astrology",
      subtitle: "Major Planetary Transits Explained",
      bullets: [
        "Detailed explanation of Saturn and Neptune moving from Pisces to Aries",
        "How 2026 differs from 2025 astrologically",
        "Interpretation of what these transits may mean collectively",
        "Complete FAQ on the year's astrological significance"
      ],
      link: "/2026-astrology-forecast/why-2026-is-a-turning-point",
      available: true
    },
    {
      icon: Briefcase,
      category: "Career & Professional Life",
      title: "2026 Career Astrology",
      subtitle: "Best Timing for Professional Moves",
      bullets: [
        "Optimal windows for launching businesses and making career pivots",
        "When to ask for raises or promotions",
        "Industry-specific guidance based on planetary rulerships",
        "Entrepreneurship timing and preparation phases"
      ],
      link: "#",
      available: false
    },
    {
      icon: Heart,
      category: "Love & Relationships",
      title: "2026 Love & Relationship Astrology",
      subtitle: "Best Timing Guide",
      bullets: [
        "Relationship commitment and marriage timing",
        "Best periods for meeting new partners",
        "Family healing and reconciliation windows",
        "Navigating the shift from Jupiter in Cancer to Leo"
      ],
      link: "#",
      available: false
    },
    {
      icon: Activity,
      category: "Health & Wellness",
      title: "2026 Health & Wellness Astrology",
      subtitle: "Optimal Timing Guide",
      bullets: [
        "Fitness program and physical transformation timing",
        "Medical procedures and surgery windows",
        "Mental health and therapy support periods",
        "Avoiding burnout during peak action phases"
      ],
      link: "#",
      available: false
    },
    {
      icon: Globe,
      category: "Political & Global Themes",
      title: "2026 Political Astrology",
      subtitle: "Global Climate Forecast",
      bullets: [
        "Potential shifts in political discourse and leadership styles",
        "Aries energy in collective movements and institutions",
        "Themes of confrontation versus collaboration",
        "Regional considerations and historical context"
      ],
      link: "/2026-astrology-forecast/politics-and-global-events",
      available: true
    },
  ];

  const months = [
    { month: "January", description: "Neptune settles permanently in Aries" },
    { month: "February", description: "Saturn re-enters Aries; major action window begins" },
    { month: "March-May", description: "Peak period for new initiatives across all life areas" },
    { month: "June", description: "Jupiter enters Leo; energy shifts from security to expression" },
    { month: "July-August", description: "Peak Aries activation; heightened energy and potential burnout risk" },
    { month: "September-October", description: "Consolidation and integration phase" },
    { month: "November-December", description: "Creative projects and rest" },
  ];

  const faqs = [
    {
      question: "What makes 2026 astrologically significant?",
      answer: "2026 marks the permanent entry of both Saturn and Neptune into Aries after years in Pisces. This represents a shift from dissolving, emotional, Piscean themes to initiating, active, Aries themes. The last time Neptune was in Aries was 1861-1875; the last time Saturn was in Aries was 1996-1999."
    },
    {
      question: "Are these predictions or interpretations?",
      answer: "These are interpretations of astrological symbolism, not predictions. Astrology describes potential themes and energetic qualities; it does not determine specific outcomes or override free will and personal circumstances."
    },
    {
      question: "How do I know if this applies to me personally?",
      answer: "These analyses examine collective transits affecting everyone. Your personal experience depends on your individual birth chart (natal placements, current transits to your chart, progressions). For personalized guidance, consult an astrologer with your birth data."
    },
    {
      question: "Which zodiac signs are most affected in 2026?",
      answer: "Cardinal signs (Aries, Cancer, Libra, Capricorn) experience these transits most directly. However, everyone experiences the collective shift in cultural energy regardless of Sun sign."
    },
    {
      question: "Can I use this for timing important decisions?",
      answer: "These timing windows are interpretive guidance based on when certain planetary energies are strongest. They can inform timing decisions but should be considered alongside practical circumstances and, ideally, personal chart analysis."
    },
    {
      question: "Is 2026 a 'good' or 'bad' year?",
      answer: "Astrological years aren't inherently good or bad. 2026's transits favor action, courage, and initiation. Whether that feels supportive or challenging depends on individual circumstances and readiness for change."
    },
  ];

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>2026 Astrology: Major Transits & Forecasts | Cosmic Brief</title>
        <meta name="description" content="Explore 2026's major planetary transits: Saturn and Neptune enter Aries, Jupiter moves from Cancer to Leo. Timing guides for career, love, health, and global events." />
        <link rel="canonical" href="https://cosmicbrief.com/2026-astrology-forecast" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <StarField />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-cream/60 hover:text-cream transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl text-cream mb-4">
          2026 Astrology
        </h1>
        <p className="text-xl text-gold mb-8">
          Major Transits & Forecasts
        </p>

        {/* Introduction */}
        <div className="prose prose-invert max-w-none space-y-6 text-cream/80 leading-relaxed mb-16">
          <h2 className="font-display text-2xl text-cream mt-0 mb-4">What Is 2026 Astrology?</h2>
          <p className="text-lg">
            2026 astrology refers to the study of major planetary movements (transits) occurring during the calendar year 2026 and their potential influence on collective human experience. This year features several significant outer planet sign changes that astrologers interpret as marking shifts in cultural, political, and personal themes.
          </p>
          <p>
            The most notable feature of 2026 is the movement of Saturn and Neptune from Pisces into Aries, representing a transition from water (emotional, dissolving) to fire (active, initiating) elemental energy.
          </p>
        </div>

        {/* Major Transits Table */}
        <div className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-6">
            Major Planetary Transits in 2026
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-cream/20">
                  <th className="text-left py-3 px-4 text-gold font-medium">Planet</th>
                  <th className="text-left py-3 px-4 text-gold font-medium">Movement</th>
                  <th className="text-left py-3 px-4 text-gold font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transits.map((transit, index) => (
                  <tr key={index} className="border-b border-cream/10">
                    <td className="py-3 px-4 text-cream font-medium">{transit.planet}</td>
                    <td className="py-3 px-4 text-cream/80">{transit.movement}</td>
                    <td className="py-3 px-4 text-cream/60">{transit.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-cream/50 text-sm mt-4 italic">
            Note: Saturn and Neptune both previewed Aries in early 2025 before retrograding back to Pisces in fall 2025.
          </p>
        </div>

        {/* Topic Cards */}
        <div className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-6">
            Explore 2026 Astrology by Topic
          </h2>
          <div className="space-y-6">
            {topicCards.map((card, index) => {
              const IconComponent = card.icon;
              const cardContent = (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <IconComponent className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gold text-sm mb-1">{card.category}</p>
                    <h3 className="text-cream font-display text-xl mb-1">
                      {card.title}
                      {!card.available && <span className="text-cream/40 text-sm ml-2">(Coming Soon)</span>}
                    </h3>
                    <p className="text-cream/60 text-sm mb-3">{card.subtitle}</p>
                    <ul className="space-y-1">
                      {card.bullets.map((bullet, i) => (
                        <li key={i} className="text-cream/50 text-sm flex items-start gap-2">
                          <span className="text-gold/60 mt-1">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {card.available && (
                    <ArrowRight className="w-5 h-5 text-cream/40 mt-1" />
                  )}
                </div>
              );
              
              const baseClassName = `block p-6 border rounded-lg transition-colors ${
                card.available 
                  ? 'border-cream/20 hover:bg-cream/5 hover:border-cream/30 cursor-pointer' 
                  : 'border-cream/10 opacity-60'
              }`;
              
              return card.available ? (
                <Link key={index} to={card.link} className={baseClassName}>
                  {cardContent}
                </Link>
              ) : (
                <div key={index} className={baseClassName}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Months */}
        <div className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-gold" />
            Key Months in 2026
          </h2>
          <div className="space-y-3">
            {months.map((item, index) => (
              <div key={index} className="flex gap-4 p-3 border-l-2 border-gold/30 hover:border-gold/60 transition-colors">
                <span className="text-gold font-medium min-w-[120px]">{item.month}</span>
                <span className="text-cream/70">{item.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scope & Limitations */}
        <div className="mb-16 p-6 bg-cream/5 rounded-lg border border-cream/10">
          <h2 className="font-display text-2xl text-cream mb-4">Scope & Limitations</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-gold font-medium mb-2">What these forecasts cover:</h3>
              <ul className="space-y-1 text-cream/70 text-sm">
                <li>• Collective astrological transits affecting broad cultural and psychological themes</li>
                <li>• Interpretive timing guidance based on planetary symbolism</li>
                <li>• Potential archetypal patterns associated with planetary movements</li>
              </ul>
            </div>
            <div>
              <h3 className="text-gold font-medium mb-2">What these forecasts do not include:</h3>
              <ul className="space-y-1 text-cream/70 text-sm">
                <li>• Personal chart analysis (requires individual birth data)</li>
                <li>• Prediction of specific events or outcomes</li>
                <li>• Political endorsements or geopolitical analysis</li>
                <li>• Guaranteed results or deterministic claims</li>
              </ul>
            </div>
          </div>
          
          <p className="text-cream/50 text-sm mt-4 italic">
            Astrological approach: These analyses use Western tropical astrology examining outer planetary transits. All interpretations are clearly identified as such and represent professional astrological reading of symbolic patterns.
          </p>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-cream/10 pb-6">
                <h3 className="text-cream font-medium mb-2">{faq.question}</h3>
                <p className="text-cream/70 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Start Exploring */}
        <div className="mb-16 p-6 bg-gold/5 rounded-lg border border-gold/20">
          <h2 className="font-display text-2xl text-cream mb-4">Start Exploring</h2>
          
          <p className="text-cream/70 mb-4">
            <strong className="text-cream">New to 2026 astrology?</strong> Begin with{" "}
            <Link to="/2026-astrology-forecast/why-2026-is-a-turning-point" className="text-gold hover:underline">
              Why 2026 Is a Turning Point in Astrology
            </Link>{" "}
            for foundational understanding.
          </p>
          
          <p className="text-cream/70 mb-4">
            <strong className="text-cream">Know your focus area?</strong> Jump to{" "}
            <span className="text-cream/50">Career</span> |{" "}
            <span className="text-cream/50">Love</span> |{" "}
            <span className="text-cream/50">Health</span> |{" "}
            <Link to="/2026-astrology-forecast/politics-and-global-events" className="text-gold hover:underline">
              Politics
            </Link>
          </p>
          
          <p className="text-cream/70">
            <strong className="text-cream">Want personalized analysis?</strong> These collective forecasts provide general timing and themes. For analysis specific to your birth chart, get your personalized forecast below.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-12 border-t border-cream/10 text-center">
          <p className="text-cream/60 mb-6">
            Discover how these transits affect your personal chart
          </p>
          <Link to="/input">
            <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-8 py-6 text-lg">
              Get Your 2026 Forecast
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Last Updated */}
        <p className="text-cream/40 text-sm text-center mt-12">
          Last updated: January 2026
        </p>
      </div>
    </div>
  );
};

export default AstrologyForecast2026Page;
