import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const CareerAstrology2026Page = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Career Transits in 2026: A Vedic Astrology Guide by Moon Sign",
    "description": "2026 career predictions by Moon sign. Jupiter exalted in Cancer, Saturn in Pisces, and the Rahu-Ketu shift into Capricorn-Cancer. Find your professional outlook.",
    "datePublished": "2025-01-18",
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
      "@id": "https://cosmicbrief.com/blog/career-astrology-2026"
    },
    "keywords": ["2026 career astrology", "vedic astrology career", "jupiter in cancer 2026", "saturn in pisces career", "moon sign career predictions", "vedic transits 2026"]
  };

  const keyDates = [
    { date: "February 17", event: "Annular Solar Eclipse (Sun-Rahu in Aquarius)" },
    { date: "March 3", event: "Total Lunar Eclipse in Leo" },
    { date: "March 11", event: "Jupiter goes direct in Gemini" },
    { date: "June 2", event: "Jupiter enters Cancer (exalted)" },
    { date: "October 31", event: "Jupiter enters Leo" },
    { date: "December 7", event: "Rahu-Ketu shift into Capricorn-Cancer" },
    { date: "December 13", event: "Jupiter goes retrograde in Leo" },
  ];

  const moonSigns = [
    {
      name: "Aries",
      sanskrit: "Mesha",
      jupiter: "3rd house → 4th house → 5th house",
      content: `The first half of 2026 activates your third house of effort and initiative. This favors short projects, communication-based work, and building skills. You're laying groundwork.

When Jupiter moves into Cancer (your 4th house) in June, the focus shifts inward — property matters, working from home, or changes in your domestic base that support career indirectly. This isn't about climbing the ladder; it's about building the foundation you'll climb from.

From November, Jupiter in your 5th house opens creative expression and recognition. If you've been developing something original, this is when it gets noticed.`,
      saturn: "Pisces is your 12th house. Saturn here all year asks for release — of old professional identities, exhausting commitments, or roles that no longer serve. Career restructuring may happen behind the scenes before visible change occurs.",
      rahu: "Rahu in 11th house: Strong for gains, networking, and achieving long-held goals. Social capital matters this year.",
      opportunity: "June through October, when exalted Jupiter aspects your 10th house of career from the 4th. This is a quiet but powerful period for establishing security that enables professional growth."
    },
    {
      name: "Taurus",
      sanskrit: "Vrishabha",
      jupiter: "2nd house → 3rd house → 4th house",
      content: `Money and resources are the theme early in the year. Jupiter in your 2nd house (through early June) favors income growth, but also spending on self-improvement or education that pays off later.

From June, Jupiter in Cancer activates your 3rd house — short-term projects, writing, teaching, media work, or building skills through practice. Not the flashiest career transit, but productive.`,
      saturn: "Pisces is your 11th house. Saturn here brings slow but steady gains through discipline. Networking feels effortful but pays off. Large goals require patience.",
      rahu: "Rahu in 10th house: This is significant. Rahu in your house of career creates ambition, visibility, and sometimes unconventional professional paths. You may be drawn to roles that break from tradition. Beware of overreach or cutting corners.",
      opportunity: "Rahu in the 10th is hungry energy. Channel it into calculated risk rather than impulsive moves. The December nodal shift begins to release this intensity."
    },
    {
      name: "Gemini",
      sanskrit: "Mithuna",
      jupiter: "1st house → 2nd house → 3rd house",
      content: `You start 2026 with Jupiter still in your sign (though retrograde until March 11). This completes a cycle of personal expansion that began in 2025. Use the first quarter to consolidate what you've learned.

From June, Jupiter in Cancer (your 2nd house) brings focus to income, savings, and material security. Exalted Jupiter here is excellent for financial growth and building resources.`,
      saturn: "Pisces is your 10th house. This is the big one. Saturn directly transiting your career house demands discipline, accountability, and often brings increased responsibility — sometimes before the recognition catches up. This transit rewards persistence and penalizes shortcuts.",
      rahu: "Rahu in 9th house: Higher education, international connections, or expansion through teaching and publishing. Career growth may come through expertise or credentials.",
      opportunity: "Saturn in the 10th is a master class in professional maturity. It's not glamorous, but the structures you build now last. June-October's exalted Jupiter supports this with financial stability."
    },
    {
      name: "Cancer",
      sanskrit: "Karka",
      jupiter: "12th house → 1st house (exalted) → 2nd house",
      content: `This is your year.

Jupiter enters your sign on June 2 and remains exalted until October 30. Jupiter in the 1st house expands your presence, opportunities, and overall life direction. In its sign of exaltation, this effect is amplified. Doors open. Confidence increases. Visibility rises.

The first half of the year (Jupiter in 12th) may feel quieter — a period of preparation, behind-the-scenes work, or spiritual recalibration before the expansion hits.`,
      saturn: "Pisces is your 9th house. Saturn here brings a serious approach to learning, mentorship, or long-distance matters. Career growth may come through developing expertise.",
      rahu: "Ketu enters Cancer in December: The nodal shift places Ketu in your 1st house starting December 7. This begins a period of identity questioning and potential release of old self-images. It's karmic but not career-blocking.",
      opportunity: "June through October. Schedule major career moves, launches, or visibility efforts for this window when Jupiter is exalted in your sign.",
      highlight: true
    },
    {
      name: "Leo",
      sanskrit: "Simha",
      jupiter: "11th house → 12th house → 1st house",
      content: `The first half of 2026 completes Jupiter's transit through your 11th house — strong for gains, goal achievement, and social expansion. If you've been building toward something, the early months bring harvest.

June through October has Jupiter in your 12th house. This is a quieter period professionally — more introspection, foreign connections, or work that happens away from the spotlight.

From November, Jupiter enters your sign. The closing months begin a new cycle of personal expansion that carries into 2027.`,
      saturn: "Pisces is your 8th house. Saturn here can bring transformation through difficulty — inheritance matters, shared resources, or deep psychological work that affects how you show up professionally. It's heavy but ultimately clarifying.",
      rahu: "Ketu in 1st house (until December): Identity dissolution continues. You may feel less attached to old professional personas.",
      opportunity: "Early 2026, while Jupiter is still in your 11th. Use this for networking, launching group projects, or locking in gains. The middle of the year is for rest and recalibration."
    },
    {
      name: "Virgo",
      sanskrit: "Kanya",
      jupiter: "10th house → 11th house → 12th house",
      content: `You begin 2026 with Jupiter in your 10th house — direct career activation. Even though Jupiter is in Gemini (not its favorite sign), the house placement is powerful. Recognition, promotion, and professional expansion are possible in the first half.

From June, Jupiter moves to your 11th house in Cancer (exalted). This is excellent for networking, income from career, and achieving goals that have been building. Your professional efforts translate into tangible gains.`,
      saturn: "Pisces is your 7th house. Saturn here affects partnerships — business and personal. Collaborations require patience and clear boundaries. Contracts need careful review.",
      rahu: "Rahu in 6th house: Strong for overcoming competition and obstacles. Work feels demanding but victories are possible.",
      opportunity: "The whole year is strong for career, but June-October stands out. Exalted Jupiter in the 11th brings reward for effort.",
      highlight: true
    },
    {
      name: "Libra",
      sanskrit: "Tula",
      jupiter: "9th house → 10th house → 11th house",
      content: `Career building is the theme.

Jupiter starts in your 9th house (luck, higher learning, expansion through travel or teaching). In June, Jupiter enters Cancer — your 10th house — and becomes exalted. This is one of the best career transits possible. Expect increased visibility, leadership opportunities, and professional recognition during June through October.

From November, Jupiter in Leo moves to your 11th house, shifting focus to gains and networks.`,
      saturn: "Pisces is your 6th house. Saturn here helps with discipline around daily work, health routines, and overcoming obstacles. Work may feel like a grind, but you're building resilience.",
      rahu: "Rahu in 5th house: Creative projects, investments, or matters involving children. Career growth may come through original ideas or speculative ventures.",
      opportunity: "June through October is your window. Jupiter exalted in the 10th is rare — don't wait for things to come to you. Initiate, apply, launch.",
      highlight: true
    },
    {
      name: "Scorpio",
      sanskrit: "Vrishchika",
      jupiter: "8th house → 9th house → 10th house",
      content: `Transformation into expansion into recognition — that's your arc.

Early 2026 continues Jupiter's transit through your 8th house. This can bring gains through inheritance, insurance, or other people's resources. It can also mean deep inner work that reshapes your professional identity.

From June, Jupiter enters your 9th house (exalted in Cancer). This opens doors through higher education, publishing, international work, or mentorship. It's not direct career activity, but it elevates your credentials and worldview.

From November, Jupiter enters your 10th house. The final months of 2026 begin a powerful career cycle.`,
      saturn: "Pisces is your 5th house. Saturn here brings seriousness to creative projects, relationships with children, or speculative investments. The 5th house also relates to recognition — Saturn may delay applause but deepens substance.",
      rahu: "Rahu in 4th house: Home and inner life feel unstable or unconventional. Work-from-home situations or real estate matters may be prominent.",
      opportunity: "Use June-October to build the expertise or credentials that the November Jupiter in 10th will leverage."
    },
    {
      name: "Sagittarius",
      sanskrit: "Dhanu",
      jupiter: "7th house → 8th house → 9th house",
      content: `Jupiter is your ruling planet, so its movements affect you more than most.

The year begins with Jupiter in your 7th house — partnerships, collaborations, and client relationships. This is strong for business development or formalizing professional relationships.

From June, Jupiter enters Cancer (your 8th house) in exaltation. The 8th house is transformative — research, psychology, occult subjects, inheritance, or deep strategic work. Career may take a less visible but more profound direction.

From November, Jupiter returns to your 9th house (its natural home). Teaching, publishing, travel, or higher learning become prominent.`,
      saturn: "Pisces is your 4th house. Saturn here brings weight to domestic matters — aging parents, property responsibilities, or internal emotional processing. Career may feel deprioritized while you handle foundational life matters.",
      rahu: "Rahu in 3rd house: Good for communication, media, writing, and short-term projects.",
      opportunity: "The 7th house Jupiter through early June. If partnerships or collaborations matter to your career, formalize them before Jupiter moves on."
    },
    {
      name: "Capricorn",
      sanskrit: "Makara",
      jupiter: "6th house → 7th house → 8th house",
      content: `You begin the year with Jupiter in your 6th house — victory over competitors, obstacles dissolving, and daily work flowing more smoothly.

From June, Jupiter enters Cancer — your 7th house and the sign opposite your own. Exalted Jupiter in the 7th is powerful for partnerships, contracts, marriage, and client-facing work. Relationships become your vehicle for growth.`,
      saturn: "Pisces is your 3rd house. Saturn here asks for disciplined communication and effort. Skills are built through repetition. Short projects require patience.",
      rahu: "Rahu enters Capricorn in December: This is significant. Rahu in your 1st house (starting December 7) begins a new 18-month cycle of intensified ambition and identity expansion. You'll feel more driven but also more restless. It's hungry energy.",
      opportunity: "June-October, when exalted Jupiter in your 7th house supports collaboration and partnership. After December, the energy becomes more individual and self-focused."
    },
    {
      name: "Aquarius",
      sanskrit: "Kumbha",
      jupiter: "5th house → 6th house → 7th house",
      content: `Creative projects and recognition mark the early months, with Jupiter in your 5th house. Original ideas get attention.

From June, Jupiter enters Cancer (your 6th house) in exaltation. This is excellent for overcoming obstacles, dealing with health matters, or improving daily work routines. It's a service-oriented period — doing the work that builds credibility.

From November, Jupiter enters your 7th house. Partnerships and collaborations take center stage.`,
      saturn: "Pisces is your 2nd house. Saturn here asks for financial discipline and thoughtful resource management. Income may feel slow but steady.",
      rahu: "Rahu in 1st house (until December): You're still in the Rahu-in-self transit that's been running since 2025. Identity expansion, unconventional paths, and intensity around personal direction continue until December.",
      opportunity: "The early months for creative work; June-October for grinding through obstacles with Jupiter's support."
    },
    {
      name: "Pisces",
      sanskrit: "Meena",
      jupiter: "4th house → 5th house → 6th house",
      content: `Jupiter is your ruling planet, and its exaltation in Cancer (a fellow water sign) from June through October supports your general wellbeing and emotional stability.

The year begins with Jupiter in your 4th house — home, inner life, property matters. Career may feel secondary while you establish domestic foundations.

From June, Jupiter enters Cancer (your 5th house) in exaltation. This is creative, expansive, and joyful energy. Children, creative projects, recognition, and romance all benefit. Career rewards may come through original expression or teaching.`,
      saturn: "Saturn is in your 1st house all year. This is the most significant career transit for Pisces in 2026. Saturn in the 1st house brings responsibility, maturity, and often a serious tone to your whole year. You may feel burdened but also capable. This is a time of building character.",
      rahu: "Ketu enters your 5th house in December: This begins to temper the expansive 5th house energy with karmic reflection.",
      opportunity: "June-October, when exalted Jupiter in your 5th house offsets some of Saturn's heaviness in the 1st. This is your window for creative career expression."
    },
  ];

  const takeaways = {
    bestMonths: "June – October (Jupiter exalted in Cancer)",
    strongestSupport: [
      "Cancer — Jupiter in 1st house (exalted)",
      "Libra — Jupiter in 10th house (exalted)",
      "Virgo — Jupiter in 11th house (exalted)",
    ],
    restructuring: [
      "Gemini — Saturn in 10th house",
      "Pisces — Saturn in 1st house",
      "Scorpio — Saturn in 5th house",
    ],
  };

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>Career Transits in 2026: Vedic Astrology Guide by Moon Sign | Cosmic Brief</title>
        <meta name="description" content="2026 career predictions by Moon sign. Jupiter exalted in Cancer, Saturn in Pisces, and the Rahu-Ketu shift into Capricorn-Cancer. Find your professional outlook." />
        <link rel="canonical" href="https://cosmicbrief.com/blog/career-astrology-2026" />
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
          <Link to="/blog/category/transits" className="text-cream/50 hover:text-cream text-sm">
            Cosmic Weather
          </Link>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream mb-4 leading-tight">
          Career Transits in 2026
        </h1>
        <p className="text-xl text-cream/70 mb-4">
          A Vedic Astrology Guide by Moon Sign
        </p>

        {/* Category & Read Time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 text-xs bg-gold/10 text-gold rounded">
            Cosmic Weather
          </span>
          <span className="text-cream/40 text-sm">12 min read</span>
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
            2026 is a year of significant planetary reshuffling. Jupiter reaches its exaltation in Cancer, Saturn continues its slow march through Pisces, and the lunar nodes (Rahu and Ketu) shift into Capricorn-Cancer by year's end — placing career and security themes at the center of the karmic conversation.
          </p>

          <p>
            This isn't sun sign astrology. These predictions are based on your <strong className="text-cream">Moon sign</strong> (Rashi), which Vedic astrology considers far more relevant for timing and emotional experience. If you don't know your Moon sign,{" "}
            <Link to="/get-birth-chart" className="text-gold hover:underline">
              get your free birth chart first →
            </Link>
          </p>

          <p>Let's break down the major transits and what they mean for your professional life.</p>

          {/* Major Transits */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-6">
            The Major Transits of 2026
          </h2>

          <p>Before diving into sign-by-sign predictions, here's what's actually happening in the sky:</p>

          <div className="space-y-6 my-8">
            {/* Jupiter */}
            <div className="p-4 bg-cream/5 rounded-lg border border-cream/10">
              <h3 className="text-gold font-medium mb-3">Jupiter (Guru)</h3>
              <ul className="space-y-1 text-sm">
                <li>• January – June 1: In Gemini (finishing retrograde, goes direct March 11)</li>
                <li>• June 2 – October 30: <span className="text-gold">In Cancer (exalted) ✦</span></li>
                <li>• October 31 onwards: In Leo (goes retrograde December 13)</li>
              </ul>
              <p className="text-cream/60 text-sm mt-3">
                Jupiter's exaltation in Cancer from June through October is the highlight of the year. This is Jupiter at its most powerful — expansive, fertile, and generous. Wherever Cancer falls in your chart, expect growth.
              </p>
            </div>

            {/* Saturn */}
            <div className="p-4 bg-cream/5 rounded-lg border border-cream/10">
              <h3 className="text-gold font-medium mb-3">Saturn (Shani)</h3>
              <ul className="space-y-1 text-sm">
                <li>• All of 2026: In Pisces</li>
              </ul>
              <p className="text-cream/60 text-sm mt-3">
                Saturn has been in Pisces since 2023 and continues its transit through 2026, moving through the nakshatras Purva Bhadrapada, Uttara Bhadrapada, and Revati. Saturn aspects the 10th house from any position with its third aspect, so its house placement matters deeply for career.
              </p>
            </div>

            {/* Rahu Ketu */}
            <div className="p-4 bg-cream/5 rounded-lg border border-cream/10">
              <h3 className="text-gold font-medium mb-3">Rahu and Ketu (The Lunar Nodes)</h3>
              <ul className="space-y-1 text-sm">
                <li>• January – December 6: Rahu in Aquarius, Ketu in Leo</li>
                <li>• December 7 onwards: Rahu enters Capricorn, Ketu enters Cancer</li>
              </ul>
              <p className="text-cream/60 text-sm mt-3">
                The nodal shift in December is significant. Rahu moving into Capricorn — the natural 10th house of career — signals a collective intensification around ambition, authority, and professional identity. Ketu in Cancer brings karmic lessons around security and emotional foundations.
              </p>
            </div>
          </div>

          {/* Key Dates */}
          <h3 className="text-cream font-medium mt-8 mb-4">Key Dates</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {keyDates.map((item, index) => (
                  <tr key={index} className="border-b border-cream/10">
                    <td className="py-2 pr-4 text-gold font-medium whitespace-nowrap">{item.date}</td>
                    <td className="py-2 text-cream/70">{item.event}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Moon Sign Predictions */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-6">
            Career Outlook by Moon Sign
          </h2>

          <div className="space-y-12">
            {moonSigns.map((sign, index) => (
              <div
                key={index}
                id={sign.name.toLowerCase()}
                className={`scroll-mt-24 ${sign.highlight ? 'p-6 bg-gold/5 rounded-lg border border-gold/20 -mx-6' : ''}`}
              >
                <h3 className="font-display text-xl md:text-2xl text-cream mb-2">
                  {sign.name} <span className="text-cream/50">({sign.sanskrit})</span>
                </h3>

                <p className="text-gold text-sm mb-4">
                  Jupiter's journey: {sign.jupiter}
                </p>

                <div className="space-y-4 text-cream/80">
                  {sign.content.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-cream/60">
                    <strong className="text-cream">Saturn's influence:</strong> {sign.saturn}
                  </p>
                  <p className="text-cream/60">
                    <strong className="text-cream">{sign.rahu.split(':')[0]}:</strong>{sign.rahu.split(':')[1]}
                  </p>
                  <p className="text-gold">
                    <strong>The real opportunity:</strong> {sign.opportunity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Using This Information */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Using This Information
          </h2>

          <p>
            These transits set the stage, but your personal dasha periods determine how strongly you'll feel them. Jupiter in your 10th house during Jupiter dasha is very different from Jupiter in your 10th house during Saturn dasha.
          </p>

          <div className="my-6">
            <Link to="/vedic/input">
              <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-6 py-5">
                Get your 2026 Cosmic Brief
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-cream/60 text-sm">
            For a personalized analysis that accounts for both transits and your individual timing cycles.
          </p>

          {/* Key Takeaways */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-6">
            Key Takeaways for 2026 Career
          </h2>

          <div className="space-y-6">
            <div className="p-4 bg-gold/5 rounded-lg border border-gold/20">
              <p className="text-gold font-medium mb-2">Best months for career moves</p>
              <p className="text-cream">{takeaways.bestMonths}</p>
            </div>

            <div className="p-4 bg-cream/5 rounded-lg border border-cream/10">
              <p className="text-cream font-medium mb-2">Signs with strongest career support</p>
              <ul className="space-y-1">
                {takeaways.strongestSupport.map((item, i) => (
                  <li key={i} className="text-cream/70 text-sm">• {item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-cream/5 rounded-lg border border-cream/10">
              <p className="text-cream font-medium mb-2">Signs in career restructuring</p>
              <ul className="space-y-1">
                {takeaways.restructuring.map((item, i) => (
                  <li key={i} className="text-cream/70 text-sm">• {item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-cream/5 rounded-lg border border-cream/10">
              <p className="text-gold font-medium mb-2">Watch December</p>
              <p className="text-cream/70 text-sm">
                The shift of the lunar nodes into Capricorn-Cancer changes the karmic weather. Capricorn and Cancer moon signs will feel this most directly, but everyone experiences the collective turn toward ambition, authority, and emotional security themes.
              </p>
            </div>
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
          </div>
        </div>

        {/* Go Deeper CTA */}
        <div className="mt-12 p-6 bg-gold/5 rounded-lg border border-gold/20">
          <h3 className="font-display text-lg text-cream mb-4">Go Deeper</h3>
          <div className="space-y-3 text-sm">
            <p className="text-cream/70">
              <Link to="/get-birth-chart" className="text-gold hover:underline font-medium">Get Your Birth Chart</Link>
              {" "}— Find your Moon sign, planetary positions, and current dasha period.
            </p>
            <p className="text-cream/70">
              <Link to="/vedic/input" className="text-gold hover:underline font-medium">2026 Cosmic Brief</Link>
              {" "}— Your personalized year ahead, combining transits with your individual timing cycles.
            </p>
            <p className="text-cream/70">
              <Link to="/compatibility" className="text-gold hover:underline font-medium">Compatibility Check</Link>
              {" "}— See how your charts align in relationships and professional partnerships.
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

export default CareerAstrology2026Page;
