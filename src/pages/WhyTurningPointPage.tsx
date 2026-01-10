import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhyTurningPointPage = () => {
  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <StarField />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link 
          to="/2026-astrology-forecast" 
          className="inline-flex items-center gap-2 text-cream/60 hover:text-cream transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to 2026 Forecast
        </Link>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream mb-4 leading-tight">
          Why 2026 Is a Turning Point in Astrology
        </h1>
        <p className="text-lg text-gold mb-8">
          Major Planetary Transits Explained
        </p>

        {/* Note */}
        <p className="text-cream/60 italic text-sm mb-12 border-l-2 border-gold/30 pl-4">
          Note: This analysis focuses on collective astrology and major planetary transits affecting the broader cultural and psychological landscape of 2026. It does not replace a personal astrology reading, which depends on individual birth data such as date, time, and location.
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream/80 leading-relaxed">
          <p className="text-lg">
            If 2025 felt like standing at the edge of something, 2026 is the year we finally jump. The cosmic difference between these two years isn't subtle. It's a complete recalibration of energy, intention, and collective destiny.
          </p>

          {/* Quick Reference Table */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-6">
            Quick Reference: Major 2026 Transits
          </h2>
          <div className="overflow-x-auto mb-12">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-cream/20">
                  <th className="text-left py-3 px-4 text-gold font-medium">Planet</th>
                  <th className="text-left py-3 px-4 text-gold font-medium">Sign Change</th>
                  <th className="text-left py-3 px-4 text-gold font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gold font-medium">Significance</th>
                </tr>
              </thead>
              <tbody className="text-cream/70">
                <tr className="border-b border-cream/10">
                  <td className="py-3 px-4">Saturn</td>
                  <td className="py-3 px-4">Pisces → Aries</td>
                  <td className="py-3 px-4">May 2026</td>
                  <td className="py-3 px-4">Structures shift from dissolution to action</td>
                </tr>
                <tr className="border-b border-cream/10">
                  <td className="py-3 px-4">Neptune</td>
                  <td className="py-3 px-4">Pisces → Aries</td>
                  <td className="py-3 px-4">March 2026</td>
                  <td className="py-3 px-4">Dreams shift from escape to inspiration</td>
                </tr>
                <tr className="border-b border-cream/10">
                  <td className="py-3 px-4">Jupiter</td>
                  <td className="py-3 px-4">Cancer</td>
                  <td className="py-3 px-4">Jan-June 2026</td>
                  <td className="py-3 px-4">Emotional security and nurturing favored</td>
                </tr>
                <tr className="border-b border-cream/10">
                  <td className="py-3 px-4">Uranus</td>
                  <td className="py-3 px-4">Gemini (ongoing)</td>
                  <td className="py-3 px-4">Started July 2025</td>
                  <td className="py-3 px-4">Information revolution accelerates</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Pluto</td>
                  <td className="py-3 px-4">Aquarius (ongoing)</td>
                  <td className="py-3 px-4">Continues through 2026</td>
                  <td className="py-3 px-4">Collective transformation deepens</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Saturn Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Saturn Leaves Pisces: From Fog to Fire
          </h2>
          <p>
            <strong className="text-cream">The most significant shift?</strong> Saturn finally leaves Pisces in May 2026 and enters Aries. This represents a fundamental shift in astrological emphasis.
          </p>
          <p>
            For the past three years, Saturn in Pisces has kept us marinating in confusion, spiritual bypassing, and institutional dissolution. We've watched structures crumble without clear replacements. I interpret this as the necessary dissolution phase before reconstruction can begin, and that fog appears to lift in 2026.
          </p>
          <p className="text-cream"><strong>Saturn in Aries tends to be:</strong></p>
          <ul className="list-disc pl-6 space-y-2 text-cream/70">
            <li>Direct and aggressive in its approach</li>
            <li>Focused on individual action over collective processing</li>
            <li>Rewarding to pioneers and early adopters</li>
            <li>Punishing to those who wait for permission</li>
          </ul>
          <p>
            I read this transit as one that demands action, rewards pioneers, and punishes those who wait for permission. Where 2025 was about grieving what no longer works, 2026 appears to be about building what comes next, with our bare hands if necessary.
          </p>
          <p>
            <strong className="text-cream">The key astrological difference:</strong> Saturn's shift from a mutable water sign (dissolution, confusion) to a cardinal fire sign (initiation, clarity). This is the difference between asking "why did this fall apart?" and declaring "here's what I'm building instead."
          </p>

          {/* Neptune Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Neptune's 14-Year Journey Ends
          </h2>
          <p>
            Neptune completes its 14-year journey through Pisces in early 2026 before entering Aries. This marks the end of an unusually long period where Neptune occupied its home sign.
          </p>
          <p>Since 2012, I've observed this creating a prolonged era of:</p>
          <ul className="list-disc pl-6 space-y-2 text-cream/70">
            <li>Disillusionment with traditional institutions</li>
            <li>Increased spiritual seeking and alternative beliefs</li>
            <li>Blurred boundaries between truth and fiction</li>
            <li>Escapism through technology and substances</li>
          </ul>
          <p>
            The correlation with the social media illusion age, the rise of conspiracy thinking, and pandemic dissociation seems noteworthy when examining Neptune in Pisces.
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            What Neptune in Aries Means
          </h3>
          <p>
            When Neptune enters Aries in March 2026, I interpret the collective dream as shifting from escapism to inspiration. The focus appears to move from fantasizing about change to romanticizing action itself.
          </p>
          <p className="text-cream"><strong>This suggests:</strong></p>
          <ul className="list-disc pl-6 space-y-2 text-cream/70">
            <li>A cultural obsession with courage and authenticity</li>
            <li>Idealization of new frontiers and pioneers</li>
            <li>Decreased tolerance for deception and manipulation</li>
            <li>Dreams focused on individual heroism</li>
          </ul>
          <p>
            The liars and grifters who thrived under Pisces ambiguity may struggle with Aries energy, which I read as burning too hot for sustained deception. <strong className="text-cream">Neptune in Aries idealizes the warrior, the pioneer, the individual who acts</strong> rather than the mystic who transcends.
          </p>

          {/* Uranus Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Uranus in Gemini: The Information Revolution Continues
          </h2>
          <p>
            Uranus enters Gemini in July 2025, but 2026 is when its effects become more pronounced in the collective experience. This transit hasn't occurred since the 1940s, and I interpret it as likely to revolutionize how we think, communicate, and process information.
          </p>
          <p className="text-cream"><strong>The 2025 vs 2026 difference with Uranus in Gemini:</strong></p>
          <p>
            In 2025, Uranus in Gemini is new and disruptive, causing chaos in communication systems. By 2026, we appear to be adapting, innovating, and weaponizing these changes.
          </p>
          <p>I anticipate potential breakthroughs in:</p>
          <ul className="list-disc pl-6 space-y-2 text-cream/70">
            <li>Neural technology and brain-computer interfaces</li>
            <li>Educational delivery systems</li>
            <li>Media and information distribution</li>
            <li>AI integration in daily communication</li>
          </ul>
          <p>
            Information may become simultaneously more democratized and more weaponized. Uranus disrupts, and in an air sign like Gemini, that disruption targets the realm of ideas, data, and connection itself.
          </p>

          {/* Jupiter Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Jupiter in Cancer: The Emotional Counterbalance
          </h2>
          <p>
            Jupiter spends most of 2026 in Cancer, which I read as a significant counterbalance after its transit through Gemini in 2025. Jupiter in Cancer tends to be generous, protective, and deeply concerned with emotional security and home.
          </p>
          <p className="text-cream">
            <strong>This transit appears to bring softness to the otherwise aggressive Aries energy dominating the year.</strong>
          </p>
          <p>Here's how I interpret this practically: 2026 may reward those who:</p>
          <ul className="list-disc pl-6 space-y-2 text-cream/70">
            <li>Build communities and support networks</li>
            <li>Invest in family (chosen or blood)</li>
            <li>Create safe spaces for vulnerability</li>
            <li>Prioritize emotional intelligence</li>
          </ul>
          <p>
            The rugged individualism suggested by Saturn and Neptune in Aries needs Jupiter in Cancer as a counterbalance. We appear to be learning that revolution without compassion risks becoming just violence.
          </p>
          <p>
            <strong className="text-cream">Jupiter expands whatever it touches</strong>, and in the nurturing sign of Cancer, that expansion favors emotional intelligence and care-based systems.
          </p>

          {/* Pluto Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Pluto in Aquarius: The Revolutionary Undertow
          </h2>
          <p>
            Pluto remains firmly in Aquarius throughout 2026, continuing the transformation it began. But here's the crucial shift I'm observing: in 2025, Pluto in Aquarius was working against Neptune and Saturn still in Pisces.
          </p>
          <p className="text-cream"><strong>The collective appeared to be pulled in opposite directions:</strong></p>
          <ul className="list-disc pl-6 space-y-2 text-cream/70">
            <li>Toward radical future thinking (Pluto in Aquarius)</li>
            <li>Toward nostalgic dissolution (Pisces placements)</li>
          </ul>
          <p>
            In 2026, Pluto in Aquarius finally gets backup from the Aries transits. Now the outer planets align in forward-thinking, action-oriented signs. I interpret this as a dropping of resistance.
          </p>
          <p>
            The future may stop being something we fear and become something we aggressively pursue. Pluto transforms through destruction and renewal, and in the fixed air sign of Aquarius, that transformation targets collective structures, technological systems, and our relationship to power itself.
          </p>

          {/* Personal Meaning Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            What This May Mean for You Personally
          </h2>
          <p className="text-lg text-cream">
            Where 2025 asked you to let go, 2026 appears to demand you step up.
          </p>
          <p>
            This doesn't look like a year for waiting, planning, or researching. The cosmic weather of 2026 seems to favor the bold, the honest, and the slightly reckless. If you've been sitting on an idea, relationship, or life change, you may feel physically uncomfortable staying still.
          </p>
          <p>
            I interpret this discomfort as the Aries energy manifesting in our physical bodies, demanding movement and expression.
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            The Shadow Side to Watch
          </h3>
          <p>Potential manifestations of difficult 2026 energy:</p>
          <ul className="list-disc pl-6 space-y-2 text-cream/70">
            <li>Impulsiveness and hasty decisions</li>
            <li>Increased aggression and conflict</li>
            <li>Burnout from unsustainable pace</li>
            <li>Lack of patience with process</li>
          </ul>
          <p>
            <strong className="text-cream">That's where Jupiter in Cancer becomes your secret weapon:</strong> build rest and emotional connection into your revolution. The balance between doing (Aries) and being (Cancer) may be the central challenge of the year.
          </p>

          {/* Key Takeaways */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Key Takeaways: 2026 vs 2025
          </h2>
          <p><strong className="text-cream">2025's Theme:</strong> Dissolution, grief, letting go, confusion about direction</p>
          <p><strong className="text-cream">2026's Theme:</strong> Action, initiation, building, aggressive forward movement</p>
          <p>
            <strong className="text-cream">The Core Difference:</strong> The shift from mutable water energy (Pisces) to cardinal fire energy (Aries) across multiple outer planets creates a year that demands participation rather than observation.
          </p>

          {/* FAQ Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-6">
            Frequently Asked Questions
          </h2>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            What is the most important astrological event in 2026?
          </h3>
          <p>
            The most significant shift is Saturn leaving Pisces for Aries in May 2026, combined with Neptune making the same move in March. This double transition from water to fire changes the entire energetic landscape from passive to active.
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            How is 2026 different from 2025 astrologically?
          </h3>
          <p>
            2025 still carried heavy Pisces energy (Saturn and Neptune both in Pisces), creating confusion and dissolution. 2026 shifts to Aries energy, demanding action, clarity, and forward movement. The focus moves from processing what's ending to building what's beginning.
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            Will 2026 be a good year?
          </h3>
          <p>
            "Good" depends on your relationship with change and action. 2026 appears to favor those ready to take risks, start new ventures, and embrace discomfort. It may be challenging for those who prefer stability, careful planning, or waiting for perfect conditions.
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            What sign will be most affected in 2026?
          </h3>
          <p>
            Cardinal signs (Aries, Cancer, Libra, Capricorn) will feel these transits most intensely, as Saturn and Neptune in Aries will aspect their Sun signs directly. However, everyone will experience the shift in collective energy.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="mt-16 pt-12 border-t border-cream/10">
          <p className="text-cream/60 mb-6 text-sm">Continue reading:</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/2026-astrology-forecast" 
              className="flex-1 p-4 border border-cream/20 rounded-lg hover:bg-cream/5 transition-colors"
            >
              <p className="text-gold text-sm mb-1">Main Article</p>
              <p className="text-cream">The Astrological Shift: 2026 Overview</p>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 pt-12 border-t border-cream/10 text-center">
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
      </div>
    </div>
  );
};

export default WhyTurningPointPage;
