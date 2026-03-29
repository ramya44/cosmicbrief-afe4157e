import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "\u2648",
  Taurus: "\u2649",
  Gemini: "\u264A",
  Cancer: "\u264B",
  Leo: "\u264C",
  Virgo: "\u264D",
  Libra: "\u264E",
  Scorpio: "\u264F",
  Sagittarius: "\u2650",
  Capricorn: "\u2651",
  Aquarius: "\u2652",
  Pisces: "\u2653",
};

function getSymbol(sign: string | null): string {
  if (!sign) return "";
  return ZODIAC_SYMBOLS[sign] ?? "";
}

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);

  const name = searchParams.get("name");
  const sun = searchParams.get("sun");
  const moon = searchParams.get("moon");
  const asc = searchParams.get("asc");
  const nakshatra = searchParams.get("nak");
  const type = searchParams.get("type") ?? "forecast";

  const heading =
    type === "chart"
      ? name
        ? `${name}'s Birth Chart`
        : "Vedic Birth Chart"
      : type === "weekly"
        ? name
          ? `${name}'s Weekly Forecast`
          : "Weekly Vedic Forecast"
        : name
          ? `${name}'s Cosmic Brief`
          : "2026 Cosmic Brief";

  const hasPlacements = sun || moon || asc;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0c29 0%, #1a1145 40%, #302b63 70%, #24243e 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative stars */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "60px",
            fontSize: "48px",
            opacity: 0.15,
            display: "flex",
          }}
        >
          &#x2729;
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            fontSize: "36px",
            opacity: 0.12,
            display: "flex",
          }}
        >
          &#x2729;
        </div>
        <div
          style={{
            position: "absolute",
            top: "120px",
            right: "150px",
            fontSize: "24px",
            opacity: 0.1,
            display: "flex",
          }}
        >
          &#x2729;
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontSize: "20px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "#b8a9e0",
              display: "flex",
            }}
          >
            Cosmic Brief
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: name && name.length > 15 ? "52px" : "60px",
              fontWeight: 700,
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: 1.2,
              display: "flex",
            }}
          >
            {heading}
          </div>

          {/* Placements row */}
          {hasPlacements ? (
            <div
              style={{
                display: "flex",
                gap: "48px",
                marginTop: "16px",
              }}
            >
              {sun ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "36px", display: "flex" }}>
                    {getSymbol(sun) || "\u2609"}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#b8a9e0",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      display: "flex",
                    }}
                  >
                    Sun
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 600, display: "flex" }}>
                    {sun}
                  </div>
                </div>
              ) : null}
              {moon ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "36px", display: "flex" }}>
                    {getSymbol(moon) || "\u263D"}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#b8a9e0",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      display: "flex",
                    }}
                  >
                    Moon
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 600, display: "flex" }}>
                    {moon}
                  </div>
                </div>
              ) : null}
              {asc ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "36px", display: "flex" }}>
                    {getSymbol(asc) || "\u2191"}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#b8a9e0",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      display: "flex",
                    }}
                  >
                    Rising
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 600, display: "flex" }}>
                    {asc}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Nakshatra */}
          {nakshatra ? (
            <div
              style={{
                fontSize: "18px",
                color: "#c4b5e0",
                marginTop: "8px",
                display: "flex",
              }}
            >
              Nakshatra: {nakshatra}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "16px",
            color: "#7a6b9e",
            letterSpacing: "2px",
            display: "flex",
          }}
        >
          www.cosmicbrief.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
