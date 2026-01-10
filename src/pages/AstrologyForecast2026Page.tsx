import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Horoscope2026Page = () => {
  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <StarField />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
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
          The Astrological Shift
        </h1>
        <p className="text-xl text-gold mb-12">
          Why 2026 Marks a Turning Point
        </p>

        {/* Introduction */}
        <div className="prose prose-invert max-w-none space-y-6 text-cream/80 leading-relaxed">
          <p className="text-lg">
            If 2025 felt like standing at the edge of something, 2026 is the year we finally jump. The cosmic difference between these two years isn't subtle. It's a complete recalibration of energy, intention, and collective destiny.
          </p>

          {/* Saturn Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Saturn's Liberation from Pisces
          </h2>
          <p>
            The most significant shift? Saturn finally leaves Pisces in May 2026 and enters Aries. This is everything. For the past three years, Saturn in Pisces has kept us marinating in confusion, spiritual bypassing, and institutional dissolution. We've watched structures crumble without clear replacements. That fog lifts in 2026.
          </p>
          <p>
            Saturn in Aries is direct, aggressive, and honest. No more hiding behind vague promises or ethereal excuses. This transit demands action, rewards pioneers, and punishes those who wait for permission. If 2025 was about grieving what no longer works, 2026 is about building what comes next, with our bare hands if necessary.
          </p>

          {/* Neptune Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Neptune's Final Bow in Pisces
          </h2>
          <p>
            Neptune completes its 14-year journey through Pisces in early 2026 before entering Aries. This is monumental. Neptune has been in its home sign since 2012, creating a prolonged era of disillusionment, spiritual seeking, and blurred boundaries. Think about it: the entire social media illusion age, the rise of conspiracy thinking, pandemic dissociation. All Neptune in Pisces.
          </p>
          <p>
            When Neptune enters Aries in March 2026, the collective dream shifts from escapism to inspiration. We stop fantasizing about change and start romanticizing action itself. Expect a cultural obsession with courage, new frontiers, and radical authenticity. The liars and grifters of the Pisces era won't survive Aries energy. It burns too hot for deception.
          </p>

          {/* Uranus Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Uranus in Gemini: The Information Revolution Accelerates
          </h2>
          <p>
            Uranus enters Gemini in July 2025, but 2026 is when we really feel it. This transit hasn't happened since the 1940s, and it's going to revolutionize how we think, communicate, and process information. AI is just the beginning.
          </p>
          <p>
            The key difference between 2025 and 2026? In 2025, Uranus in Gemini is new and disruptive, causing chaos in communication systems. By 2026, we're adapting, innovating, and weaponizing these changes. Expect breakthroughs in neural technology, radical shifts in education, and the complete demolition of traditional media structures. Information will be democratized and weaponized in equal measure.
          </p>

          {/* Jupiter Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The Jupiter Factor
          </h2>
          <p>
            Jupiter spends most of 2026 in Cancer, which is a massive relief after its transit through Gemini in 2025. Jupiter in Cancer is generous, protective, and deeply concerned with emotional security and home. This transit brings a softness to the otherwise aggressive Aries energy dominating the year.
          </p>
          <p>
            Here's what this means practically: 2026 rewards those who build communities, invest in family (chosen or blood), and create safe spaces for vulnerability. The rugged individualism of Saturn and Neptune in Aries needs Jupiter in Cancer as a counterbalance. We're learning that revolution without compassion is just violence.
          </p>

          {/* Pluto Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The Pluto Undertow
          </h2>
          <p>
            Don't forget: Pluto remains firmly in Aquarius throughout 2026, continuing the transformation it began. But here's the crucial shift—in 2025, Pluto in Aquarius was working against Neptune and Saturn still in Pisces. The collective was being pulled in opposite directions: toward radical future thinking (Pluto in Aquarius) and nostalgic dissolution (Pisces placements).
          </p>
          <p>
            In 2026, Pluto in Aquarius finally gets backup from the Aries transits. Now the outer planets are aligned in forward-thinking, action-oriented signs. The resistance drops. The future stops being something we fear and becomes something we aggressively pursue.
          </p>

          {/* What This Means Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            What This Means for You
          </h2>
          <p className="text-lg text-cream">
            2025 asked you to let go. 2026 demands you step up.
          </p>
          <p>
            This is not a year for waiting, planning, or researching. The cosmic weather of 2026 favors the bold, the honest, and the slightly reckless. If you've been sitting on an idea, relationship, or life change, you'll feel physically uncomfortable staying still.
          </p>
          <p>
            The shadow side? Impulsiveness, aggression, and burnout. Aries energy doesn't pace itself naturally. That's where Jupiter in Cancer becomes your secret weapon: build rest and emotional connection into your revolution.
          </p>

          {/* Political Implications Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The Political Implications: Aries Doesn't Negotiate
          </h2>
          <p>
            Let's be blunt about what Saturn and Neptune in Aries means for the global political landscape. Aries is the warrior, the pioneer, the sign that would rather fight than compromise. When both Saturn (structure, authority) and Neptune (collective dreams, idealism) enter this sign, political discourse becomes more combative, more polarized, and frankly, more honest about its aggression.
          </p>
          <p>
            The Pisces era gave us political gaslighting, institutional rot disguised as bureaucracy, and leaders who hid behind complexity. Aries energy strips that away. In 2026, expect political figures who stop pretending to play nice. Diplomatic language erodes. Nationalist impulses strengthen, not because Aries is inherently nationalist, but because it's inherently self-focused and territorial.
          </p>
          <p>
            In the US specifically, with Pluto in Aquarius squaring the nation's Taurus placements, we're watching the death of old power structures while Aries energy demands immediate replacements. This creates volatility. Political movements in 2026 won't waste time with incrementalism—they'll demand revolution or nothing. The center cannot hold under this astrology.
          </p>
          <p>
            Globally, watch for younger, more aggressive leadership emerging. Military posturing increases. Borders become flashpoints. But here's what's less obvious: this energy also favors grassroots uprisings, civilian-led movements, and individuals who refuse to wait for systemic change. Aries doesn't ask permission from institutions. It acts.
          </p>
          <p>
            The danger? Mars-ruled energy can tip into authoritarianism when unchecked. Strongman politics feel cosmically supported in 2026, which means those of us who value democracy need to channel our own Aries energy defensively. Passivity is complicity under these transits.
          </p>

          {/* Timing Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            Timing the Personal: When to Act on What Matters
          </h2>
          <p>
            While the year pulses with Aries urgency, Jupiter's movement through Cancer from mid-January through June creates a distinct window for relationship and family matters. This is your sweet spot for:
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            Love and Relationships (January-June)
          </h3>
          <p>
            Jupiter in Cancer is romantic, nesting, and emotionally generous. If you're planning to commit, cohabitate, or deepen intimacy, the first half of 2026 is blessed. This transit also favors reconciliation and healing family wounds, but only if both parties are willing. Cancer doesn't force, it nurtures.
          </p>
          <p>
            After June, when Jupiter enters Leo, the energy shifts toward passion and drama. Great for new love affairs and creative partnerships, less ideal for the quiet work of building security.
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            Career Moves (May-September)
          </h3>
          <p>
            Saturn's entry into Aries in May is your signal. This is when to launch businesses, ask for promotions, or make bold career pivots. Saturn in Aries rewards initiative and punishes hesitation. The sweet spot is May through September before retrogrades complicate matters. If you've been waiting to go independent or start something from scratch, this window is cosmically lit.
          </p>

          <h3 className="font-display text-xl text-gold mt-8 mb-3">
            Health and Vitality (March-August)
          </h3>
          <p>
            Neptune entering Aries in March brings renewed enthusiasm for physical movement and body autonomy. This transit is excellent for starting aggressive health protocols, training for physical challenges, or surgery and medical interventions that require courage. Aries rules the head, so issues with migraines, jaw tension, or head injuries may surface but also find resolution.
          </p>
          <p>
            The caveat: Aries energy burns hot and fast. By August, many will feel depleted. Jupiter's move into Leo helps, but you'll need to build in recovery time or risk burnout by year's end.
          </p>

          {/* Bottom Line Section */}
          <h2 className="font-display text-2xl md:text-3xl text-cream mt-16 mb-4">
            The Bottom Line
          </h2>
          <p>
            2025 was the grief year. 2026 is the warrior year. The difference is palpable, inevitable, and exactly what we need. The cosmos isn't asking permission anymore—it's kicking down doors and demanding we finally become who we've been claiming to be.
          </p>
          <p>
            Politically, this means turbulence, confrontation, and the end of polite fictions. Personally, it means taking the risks you've been calculating for years. The astrology of 2026 doesn't reward caution. It rewards commitment to action, even imperfect action.
          </p>
          <p className="text-lg text-cream font-medium">
            Stop preparing. Start moving. That's the only astrological advice that matters in 2026.
          </p>
        </div>

        {/* Related Content */}
        <div className="mt-16 pt-12 border-t border-cream/10">
          <p className="text-cream/60 mb-6 text-sm">Continue reading:</p>
          <Link 
            to="/2026-astrology-forecast/why-2026-is-a-turning-point" 
            className="block p-4 border border-cream/20 rounded-lg hover:bg-cream/5 transition-colors"
          >
            <p className="text-gold text-sm mb-1">Deep Dive</p>
            <p className="text-cream">Why 2026 Is a Turning Point in Astrology</p>
            <p className="text-cream/60 text-sm mt-1">Major planetary transits explained</p>
          </Link>
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

export default Horoscope2026Page;