import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NakshatraData {
  name: string;
  symbol: string;
  ruler: string;
  zodiac: string;
  slug?: string; // URL slug if page exists
}

const nakshatras: NakshatraData[] = [
  { name: "Ashwini", symbol: "🐴", ruler: "Ketu", zodiac: "Aries", slug: "ashwini-nakshatra" },
  { name: "Bharani", symbol: "△", ruler: "Venus", zodiac: "Aries", slug: "bharani-nakshatra" },
  { name: "Krittika", symbol: "🔥", ruler: "Sun", zodiac: "Aries/Taurus", slug: "krittika-nakshatra" },
  { name: "Rohini", symbol: "◎", ruler: "Moon", zodiac: "Taurus", slug: "rohini-nakshatra" },
  { name: "Mrigashira", symbol: "🦌", ruler: "Mars", zodiac: "Taurus/Gemini", slug: "mrigashira-nakshatra" },
  { name: "Ardra", symbol: "💧", ruler: "Rahu", zodiac: "Gemini", slug: "ardra-nakshatra" },
  { name: "Punarvasu", symbol: "🏹", ruler: "Jupiter", zodiac: "Gemini/Cancer", slug: "punarvasu-nakshatra" },
  { name: "Pushya", symbol: "❀", ruler: "Saturn", zodiac: "Cancer", slug: "pushya-nakshatra" },
  { name: "Ashlesha", symbol: "🐍", ruler: "Mercury", zodiac: "Cancer", slug: "ashlesha-nakshatra" },
  { name: "Magha", symbol: "👑", ruler: "Ketu", zodiac: "Leo", slug: "magha-nakshatra" },
  { name: "Purva Phalguni", symbol: "🛏", ruler: "Venus", zodiac: "Leo", slug: "purva-phalguni-nakshatra" },
  { name: "Uttara Phalguni", symbol: "☀", ruler: "Sun", zodiac: "Leo/Virgo", slug: "uttara-phalguni-nakshatra" },
  { name: "Hasta", symbol: "✋", ruler: "Moon", zodiac: "Virgo", slug: "hasta-nakshatra" },
  { name: "Chitra", symbol: "💎", ruler: "Mars", zodiac: "Virgo/Libra", slug: "chitra-nakshatra" },
  { name: "Swati", symbol: "🌬", ruler: "Rahu", zodiac: "Libra", slug: "swati-nakshatra" },
  { name: "Vishakha", symbol: "⚡", ruler: "Jupiter", zodiac: "Libra/Scorpio", slug: "vishakha-nakshatra" },
  { name: "Anuradha", symbol: "🪷", ruler: "Saturn", zodiac: "Scorpio", slug: "anuradha-nakshatra" },
  { name: "Jyeshtha", symbol: "☂", ruler: "Mercury", zodiac: "Scorpio", slug: "jyeshtha-nakshatra" },
  { name: "Mula", symbol: "🌱", ruler: "Ketu", zodiac: "Sagittarius", slug: "mula-nakshatra" },
  { name: "Purva Ashadha", symbol: "🌊", ruler: "Venus", zodiac: "Sagittarius" },
  { name: "Uttara Ashadha", symbol: "🐘", ruler: "Sun", zodiac: "Sagittarius/Capricorn" },
  { name: "Shravana", symbol: "👂", ruler: "Moon", zodiac: "Capricorn" },
  { name: "Dhanishta", symbol: "🥁", ruler: "Mars", zodiac: "Capricorn/Aquarius" },
  { name: "Shatabhisha", symbol: "○", ruler: "Rahu", zodiac: "Aquarius" },
  { name: "Purva Bhadrapada", symbol: "⚔", ruler: "Jupiter", zodiac: "Aquarius/Pisces", slug: "purva-bhadrapada-nakshatra" },
  { name: "Uttara Bhadrapada", symbol: "☿", ruler: "Saturn", zodiac: "Pisces", slug: "uttara-bhadrapada-nakshatra" },
  { name: "Revati", symbol: "🐟", ruler: "Mercury", zodiac: "Pisces" },
];

// Color palette - modern gradient based on position
const getSegmentColor = (index: number, isHovered: boolean) => {
  const hue = (index * 13.3) + 200; // Start from blue-ish, cycle through
  const saturation = isHovered ? 70 : 45;
  const lightness = isHovered ? 55 : 35;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const NakshatraWheel = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const size = 400;
  const center = size / 2;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.35;
  const labelRadius = outerRadius * 0.7;

  const segmentAngle = 360 / 27;

  // Create path for each segment
  const createSegmentPath = (index: number) => {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

    const x1 = center + outerRadius * Math.cos(startAngle);
    const y1 = center + outerRadius * Math.sin(startAngle);
    const x2 = center + outerRadius * Math.cos(endAngle);
    const y2 = center + outerRadius * Math.sin(endAngle);
    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;
  };

  // Get position for symbol
  const getSymbolPosition = (index: number) => {
    const angle = ((index + 0.5) * segmentAngle - 90) * (Math.PI / 180);
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  const hoveredNakshatra = hoveredIndex !== null ? nakshatras[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="max-w-full h-auto"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="rgba(0,0,0,0.3)"
            stroke="rgba(212,175,55,0.2)"
            strokeWidth="1"
          />

          {/* Nakshatra segments */}
          {nakshatras.map((nakshatra, index) => {
            const isHovered = hoveredIndex === index;
            const hasPage = !!nakshatra.slug;
            return (
              <g key={nakshatra.name}>
                <path
                  d={createSegmentPath(index)}
                  fill={getSegmentColor(index, isHovered)}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="1"
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered ? 'brightness(1.2)' : 'none',
                    transform: isHovered ? `scale(1.02)` : 'scale(1)',
                    transformOrigin: `${center}px ${center}px`,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => hasPage && navigate(`/blog/${nakshatra.slug}`)}
                />
                {/* Symbol */}
                <text
                  x={getSymbolPosition(index).x}
                  y={getSymbolPosition(index).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  className="pointer-events-none select-none"
                  style={{
                    opacity: isHovered ? 1 : 0.8,
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    transformOrigin: `${getSymbolPosition(index).x}px ${getSymbolPosition(index).y}px`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {nakshatra.symbol}
                </text>
              </g>
            );
          })}

          {/* Center circle */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius - 5}
            fill="rgba(10,10,20,0.9)"
            stroke="rgba(212,175,55,0.3)"
            strokeWidth="2"
          />

          {/* Center text */}
          <text
            x={center}
            y={center - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#d4af37"
            fontSize="12"
            fontWeight="500"
          >
            27
          </text>
          <text
            x={center}
            y={center + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,250,240,0.6)"
            fontSize="10"
          >
            Nakshatras
          </text>
        </svg>
      </div>

      {/* Tooltip / Info display */}
      <div className="h-20 flex items-center justify-center">
        {hoveredNakshatra ? (
          <div className="text-center animate-in fade-in duration-200">
            <p className="text-cream font-display text-xl">
              {hoveredNakshatra.symbol} {hoveredNakshatra.name}
            </p>
            <p className="text-cream/60 text-sm">
              Ruled by {hoveredNakshatra.ruler} · {hoveredNakshatra.zodiac}
            </p>
            {hoveredNakshatra.slug && (
              <p className="text-gold text-xs mt-1">Click to learn more</p>
            )}
          </div>
        ) : (
          <p className="text-cream/40 text-sm">Hover over a segment to explore</p>
        )}
      </div>
    </div>
  );
};

export default NakshatraWheel;
