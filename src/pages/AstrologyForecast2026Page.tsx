import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight, Sparkles, Globe, Briefcase, BookOpen, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const AstrologyForecast2026Page = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "The Cosmic Brief Journal",
    "description": "Vedic astrology decoded. Explore nakshatras, planetary transits, and the rhythms that shape your life. Ancient patterns, modern insight.",
    "url": "https://cosmicbrief.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Cosmic Brief"
    }
  };

  // Latest articles
  const latestArticles = [
    {
      title: "Planetary Periods (Dashas) Explained",
      category: "Learn",
      excerpt: "The Vedic timing system that shapes your life in 6-20 year chapters. Learn which period you're in and what it means.",
      link: "/blog/planetary-periods-dashas",
      author: "Maya G.",
      date: "Jan 21, 2025"
    },
    {
      title: "Nakshatra: Your True Cosmic DNA",
      category: "Learn",
      excerpt: "The 27 lunar mansions are the heart of Vedic astrology. Here's why they matter more than your zodiac sign.",
      link: "/blog/what-is-nakshatra",
      author: "Maya G.",
      date: "Jan 18, 2025"
    },
    {
      title: "Why 2026 Is a Turning Point in Astrology",
      category: "Cosmic Weather",
      excerpt: "Saturn and Neptune enter Aries permanently. What this rare double transit means for the collective.",
      link: "/blog/why-2026-is-a-turning-point",
      author: "Maya G.",
      date: "Jan 1, 2025"
    },
    {
      title: "Career Transits in 2026",
      category: "Cosmic Weather",
      excerpt: "2026 career predictions by Moon sign. Jupiter exalted in Cancer, Saturn in Pisces, and the Rahu-Ketu shift.",
      link: "/blog/career-astrology-2026",
      author: "Maya G.",
      date: "Jan 18, 2025"
    },
    {
      title: "2026 Political Astrology",
      category: "Cosmic Weather",
      excerpt: "What Aries energy means for global events, leadership, and grassroots movements.",
      link: "/blog/politics-and-global-events",
      author: "Maya G.",
      date: "Jan 1, 2025"
    },
  ];

  // Start Here articles
  const startHereArticles = [
    {
      title: "What is Vedic Astrology? A Modern Guide",
      description: "The 5,000-year-old system that reads your actual birth sky — not just your sun sign.",
      link: "/vedic-astrology-explained",
      available: true
    },
    {
      title: "Nakshatra: Your True Cosmic DNA",
      description: "The 27 lunar mansions are the heart of Vedic astrology. Here's why they matter more than your zodiac sign.",
      link: "/blog/what-is-nakshatra",
      available: true
    },
    {
      title: "Planetary Periods (Dashas) Explained",
      description: "The timing system that shapes your life in 6-20 year chapters. Your personal cosmic calendar.",
      link: "/blog/planetary-periods-dashas",
      available: true
    },
    {
      title: "Vedic vs Western Astrology: 5 Key Differences",
      description: "Same planets, different approach. Understand what sets Vedic apart.",
      link: "/vedic-vs-western-astrology",
      available: true
    },
  ];

  // Topic categories
  const topicCategories = [
    {
      icon: BookOpen,
      title: "Learn Vedic Astrology",
      description: "Foundations, terminology, and how to read your chart.",
      link: "/blog/category/learn",
      available: true
    },
    {
      icon: Star,
      title: "Nakshatras",
      description: "Deep dives into each of the 27 lunar mansions.",
      link: "/blog/category/nakshatras",
      available: true
    },
    {
      icon: Globe,
      title: "Cosmic Weather",
      description: "Current planetary movements and what they mean for you.",
      link: "/blog/category/transits",
      available: true
    },
  ];

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>The Cosmic Brief Journal | Vedic Astrology Decoded</title>
        <meta name="description" content="Vedic astrology decoded. Explore nakshatras, planetary transits, and the rhythms that shape your life. Ancient patterns, modern insight." />
        <link rel="canonical" href="https://cosmicbrief.com/blog" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <StarField />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
            The Cosmic Brief Journal
          </h1>
          <p className="text-xl text-gold mb-8">
            Ancient patterns. Modern insight.
          </p>
          <p className="text-cream/70 max-w-2xl mx-auto leading-relaxed">
            Vedic astrology is one of the oldest systems for understanding time, personality, and potential — refined over thousands of years, now accessible to you. Here we explore nakshatras, planetary transits, and the rhythms that shape your life. No fluff. No fatalism. Just the stars, decoded.
          </p>
        </div>

        {/* Start Here */}
        <div className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-2 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-gold" />
            Start Here
          </h2>
          <p className="text-cream/60 mb-6">New to Vedic astrology? These posts will ground you:</p>

          <div className="space-y-4 mb-6">
            {startHereArticles.map((article, index) => (
              article.available ? (
                <Link
                  key={index}
                  to={article.link}
                  className="block p-4 border border-cream/20 rounded-lg hover:bg-cream/5 hover:border-cream/30 transition-colors"
                >
                  <h3 className="text-cream font-medium mb-1">{article.title}</h3>
                  <p className="text-cream/60 text-sm">{article.description}</p>
                </Link>
              ) : (
                <div
                  key={index}
                  className="block p-4 border border-cream/10 rounded-lg opacity-60"
                >
                  <h3 className="text-cream font-medium mb-1">
                    {article.title}
                    <span className="text-cream/40 text-sm ml-2">(Coming Soon)</span>
                  </h3>
                  <p className="text-cream/60 text-sm">{article.description}</p>
                </div>
              )
            ))}
          </div>

          <p className="text-cream/60">
            Or skip straight to your chart:{" "}
            <Link to="/get-birth-chart" className="text-gold hover:underline font-medium">
              Get Your Free Birth Chart →
            </Link>
          </p>
        </div>

        {/* Latest from the Journal */}
        <div className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-6">
            Latest from the Journal
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestArticles.map((article, index) => (
              <Link
                key={index}
                to={article.link}
                className="block p-5 border border-cream/20 rounded-lg hover:bg-cream/5 hover:border-cream/30 transition-colors"
              >
                <span className="inline-block px-2 py-1 text-xs bg-gold/10 text-gold rounded mb-3">
                  {article.category}
                </span>
                <h3 className="text-cream font-display text-lg mb-2">{article.title}</h3>
                <p className="text-cream/60 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                <div className="flex items-center gap-2">
                  <img src="/maya.png" alt="Maya G." className="w-5 h-5 rounded-full" />
                  <p className="text-cream/40 text-xs">{article.author} · {article.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Explore by Topic */}
        <div className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-6">
            Explore by Topic
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicCategories.map((category, index) => {
              const IconComponent = category.icon;
              return category.available ? (
                <Link
                  key={index}
                  to={category.link}
                  className="flex items-start gap-3 p-4 border border-cream/20 rounded-lg hover:bg-cream/5 hover:border-cream/30 transition-colors"
                >
                  <IconComponent className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <h3 className="text-cream font-medium mb-1">{category.title}</h3>
                    <p className="text-cream/60 text-sm">{category.description}</p>
                  </div>
                </Link>
              ) : (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 border border-cream/10 rounded-lg opacity-60"
                >
                  <IconComponent className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <h3 className="text-cream font-medium mb-1">
                      {category.title}
                      <span className="text-cream/40 text-xs ml-1">(Soon)</span>
                    </h3>
                    <p className="text-cream/60 text-sm">{category.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your 2026 Cosmic Brief CTA */}
        <div className="mb-16 p-8 bg-gold/5 rounded-lg border border-gold/20 text-center">
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-gold" />
            Your 2026 Cosmic Brief
          </h2>
          <p className="text-cream/70 mb-2 max-w-xl mx-auto">
            A personalized yearly outlook based on your birth moment — your dasha periods, planetary transits, and the themes shaping your year ahead.
          </p>
          <p className="text-gold font-medium mb-6">
            Not your sun sign. Your actual sky.
          </p>
          <Link to="/vedic/input">
            <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-8 py-6 text-lg">
              Get Your 2026 Forecast
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Why Vedic? */}
        <div className="mb-16 p-6 bg-cream/5 rounded-lg border border-cream/10">
          <h2 className="font-display text-2xl text-cream mb-4">Why Vedic?</h2>
          <div className="space-y-4 text-cream/70 leading-relaxed">
            <p>
              Most horoscopes use Western tropical astrology, which drifted from the actual stars centuries ago. Vedic astrology (Jyotish) stays aligned with the constellations as they appear in the sky today.
            </p>
            <p>
              It also uses <strong className="text-cream">nakshatras</strong> — 27 lunar mansions that reveal nuance Western astrology can't capture. Your Moon's nakshatra alone says more about your inner world than your sun sign ever could.
            </p>
            <p>
              This isn't about prediction. It's about pattern recognition — understanding the rhythms that have always been there, so you can move with them instead of against them.
            </p>
          </div>
          <Link to="/vedic-astrology-explained" className="inline-block mt-4 text-gold hover:underline font-medium">
            Learn more about Vedic astrology →
          </Link>
        </div>

        {/* Stay in the Loop */}
        <div className="mb-16 p-6 border border-cream/20 rounded-lg text-center">
          <h2 className="font-display text-2xl text-cream mb-4">Stay in the Loop</h2>
          <p className="text-cream/70 mb-6 max-w-lg mx-auto">
            Get weekly insights based on your birth chart — planetary transits, nakshatra forecasts, and cosmic weather that actually applies to you.
          </p>
          <Link to="/weekly-horoscope">
            <Button variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-medium px-6 py-5">
              Get Your Weekly Horoscope
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Footer tagline */}
        <p className="text-cream/40 text-sm text-center italic">
          Cosmic Brief is Vedic astrology for the modern seeker. No guilt. No fate. Just ancient wisdom, translated.
        </p>
      </div>
    </div>
  );
};

export default AstrologyForecast2026Page;
