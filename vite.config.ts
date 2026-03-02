import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import prerender from "@prerenderer/rollup-plugin";
import puppeteerRenderer from "@prerenderer/renderer-puppeteer";

// Page metadata for SEO (extracted from Helmet configs)
const pageMetadata: Record<string, { title: string; description: string; canonical?: string }> = {
  "/": {
    title: "Get Your 2026 Cosmic Brief | Personalized Vedic Astrology Forecast",
    description: "Discover what 2026 holds for you with a personalized Vedic astrology forecast based on your exact birth details. Get actionable guidance for the year ahead."
  },
  "/blog": {
    title: "The Cosmic Journal | Vedic Astrology Insights & Guides",
    description: "Explore Vedic astrology guides, nakshatra profiles, and cosmic insights. Learn about planetary periods, birth charts, and what the stars reveal about your life path."
  },
  "/blog/rohini-nakshatra": {
    title: "Rohini Nakshatra: The Fertile Garden of Creation | Cosmic Brief",
    description: "Explore Rohini nakshatra, the most auspicious lunar mansion in Vedic astrology. Discover its creative power, beauty, and influence on growth and prosperity."
  },
  "/blog/ashwini-nakshatra": {
    title: "Ashwini Nakshatra: The Star of Swift Action | Cosmic Brief",
    description: "Explore Ashwini nakshatra, the first lunar mansion in Vedic astrology. Discover its healing power, swift energy, and influence on new beginnings."
  },
  "/blog/bharani-nakshatra": {
    title: "Bharani Nakshatra: The Star of Transformation | Cosmic Brief",
    description: "Explore Bharani nakshatra in Vedic astrology. Discover its transformative power, connection to life and death, and influence on creativity."
  },
  "/blog/krittika-nakshatra": {
    title: "Krittika Nakshatra: The Star of Fire | Cosmic Brief",
    description: "Explore Krittika nakshatra in Vedic astrology. Discover its fiery nature, purifying power, and influence on leadership and determination."
  },
  "/blog/mrigashira-nakshatra": {
    title: "Mrigashira Nakshatra: The Searching Star | Cosmic Brief",
    description: "Explore Mrigashira nakshatra in Vedic astrology. Discover its curious nature, gentle energy, and influence on exploration and seeking."
  },
  "/blog/ardra-nakshatra": {
    title: "Ardra Nakshatra: The Star of Storms | Cosmic Brief",
    description: "Explore Ardra nakshatra in Vedic astrology. Discover its transformative storms, emotional depth, and influence on breakthrough and renewal."
  },
  "/blog/punarvasu-nakshatra": {
    title: "Punarvasu Nakshatra: The Star of Renewal | Cosmic Brief",
    description: "Explore Punarvasu nakshatra in Vedic astrology. Discover its restorative power, optimistic nature, and influence on recovery and return."
  },
  "/blog/pushya-nakshatra": {
    title: "Pushya Nakshatra: The Star of Nourishment | Cosmic Brief",
    description: "Explore Pushya nakshatra in Vedic astrology. Discover its nurturing power, auspicious nature, and influence on growth and prosperity."
  },
  "/blog/ashlesha-nakshatra": {
    title: "Ashlesha Nakshatra: The Clinging Star | Cosmic Brief",
    description: "Explore Ashlesha nakshatra in Vedic astrology. Discover its mystical serpent energy, psychological depth, and influence on transformation."
  },
  "/blog/magha-nakshatra": {
    title: "Magha Nakshatra: The Throne Star | Cosmic Brief",
    description: "Explore Magha nakshatra in Vedic astrology. Discover its royal nature, ancestral power, and influence on authority and legacy."
  },
  "/blog/purva-phalguni-nakshatra": {
    title: "Purva Phalguni Nakshatra: The Star of Creativity | Cosmic Brief",
    description: "Explore Purva Phalguni nakshatra in Vedic astrology. Discover its creative power, pleasure-seeking nature, and influence on romance and arts."
  },
  "/blog/uttara-phalguni-nakshatra": {
    title: "Uttara Phalguni Nakshatra: The Star of Patronage | Cosmic Brief",
    description: "Explore Uttara Phalguni nakshatra in Vedic astrology. Discover its helpful nature, partnership energy, and influence on service and support."
  },
  "/blog/hasta-nakshatra": {
    title: "Hasta Nakshatra: The Hand Star | Cosmic Brief",
    description: "Explore Hasta nakshatra in Vedic astrology. Discover its skillful nature, healing hands, and influence on craftsmanship and dexterity."
  },
  "/blog/chitra-nakshatra": {
    title: "Chitra Nakshatra: The Brilliant Star | Cosmic Brief",
    description: "Explore Chitra nakshatra in Vedic astrology. Discover its artistic brilliance, creative power, and influence on beauty and design."
  },
  "/blog/swati-nakshatra": {
    title: "Swati Nakshatra: The Independent Star | Cosmic Brief",
    description: "Explore Swati nakshatra in Vedic astrology. Discover its independent spirit, adaptable nature, and influence on trade and communication."
  },
  "/blog/vishakha-nakshatra": {
    title: "Vishakha Nakshatra: The Star of Purpose | Cosmic Brief",
    description: "Explore Vishakha nakshatra in Vedic astrology. Discover its determined nature, goal-oriented power, and influence on achievement."
  },
  "/blog/anuradha-nakshatra": {
    title: "Anuradha Nakshatra: The Star of Success | Cosmic Brief",
    description: "Explore Anuradha nakshatra in Vedic astrology. Discover its devoted nature, friendship power, and influence on success through cooperation."
  },
  "/blog/jyeshtha-nakshatra": {
    title: "Jyeshtha Nakshatra: The Chief Star | Cosmic Brief",
    description: "Explore Jyeshtha nakshatra in Vedic astrology. Discover its protective nature, seniority power, and influence on leadership and responsibility."
  },
  "/blog/mula-nakshatra": {
    title: "Mula Nakshatra: The Root Star | Cosmic Brief",
    description: "Explore Mula nakshatra in Vedic astrology. Discover its transformative power, root-seeking nature, and influence on investigation and truth."
  },
  "/blog/purva-ashadha-nakshatra": {
    title: "Purva Ashadha Nakshatra: The Invincible Star | Cosmic Brief",
    description: "Explore Purva Ashadha nakshatra in Vedic astrology. Discover its victorious energy, purifying power, and influence on conviction."
  },
  "/blog/revati-nakshatra": {
    title: "Revati Nakshatra: The Star of Completion and Transcendence | Cosmic Brief",
    description: "Discover Revati nakshatra, the final star of nourishment, completion, and spiritual return in Vedic astrology. Learn about its gentle power and journey's end."
  },
  "/vedic-astrology-explained": {
    title: "What is Vedic Astrology? Complete Beginner's Guide (2026)",
    description: "Learn Vedic astrology basics: how it differs from Western astrology, planetary periods (dashas), nakshatras, and why it's powerful for timing life decisions."
  },
  "/vedic-vs-western-astrology": {
    title: "Vedic vs Western Astrology: Key Differences Explained",
    description: "Compare Vedic and Western astrology: zodiac systems, planetary rulers, timing techniques, and which system is better for different purposes."
  },
  "/how-to-read-vedic-chart": {
    title: "How to Read a Vedic Birth Chart: Step-by-Step Guide",
    description: "Learn to read your Vedic birth chart: houses, planets, signs, and aspects. Understand the basics of Jyotish chart interpretation."
  },
  "/blog/why-2026-is-a-turning-point": {
    title: "Why 2026 is a Cosmic Turning Point | Vedic Astrology Analysis",
    description: "Discover why 2026 marks a significant astrological shift. Explore the planetary alignments, Saturn-Neptune conjunction, and what it means for you."
  },
  "/blog/career-astrology-2026": {
    title: "Career Astrology 2026: Your Professional Year Ahead",
    description: "Discover your career outlook for 2026 using Vedic astrology. Learn which planetary periods favor job changes, promotions, and new ventures."
  },
  "/terms": {
    title: "Terms of Service | Cosmic Brief",
    description: "Read the terms of service for Cosmic Brief, your personalized Vedic astrology platform."
  },
  "/privacy": {
    title: "Privacy Policy | Cosmic Brief",
    description: "Learn how Cosmic Brief protects your privacy and handles your personal data."
  },
  "/contact": {
    title: "Contact Us | Cosmic Brief",
    description: "Get in touch with the Cosmic Brief team for questions, feedback, or support."
  },
  "/background": {
    title: "About Cosmic Brief | Our Story",
    description: "Learn about Cosmic Brief's mission to make Vedic astrology accessible and actionable for modern seekers."
  },
  "/2026": {
    title: "Your 2026 Vedic Astrology Forecast | Cosmic Brief",
    description: "Get your personalized 2026 cosmic forecast based on Vedic astrology. Discover your planetary periods, key transits, and timing for the year ahead."
  },
  "/blog/category/nakshatra-profiles": {
    title: "Nakshatra Profiles | Cosmic Brief Journal",
    description: "Explore all 27 nakshatras (lunar mansions) in Vedic astrology. Discover your moon nakshatra and its influence on your personality and destiny."
  },
  "/blog/category/cosmic-updates": {
    title: "Cosmic Updates | Cosmic Brief Journal",
    description: "Stay current with Vedic astrology forecasts, planetary transits, and cosmic events affecting your life."
  },
  "/blog/category/practical-guidance": {
    title: "Practical Guidance | Cosmic Brief Journal",
    description: "Actionable Vedic astrology guidance for career, relationships, and life decisions."
  }
};

// Generate breadcrumb schema based on route
function generateBreadcrumbSchema(route: string, pageTitle: string): object | null {
  const items: Array<{ name: string; item?: string }> = [
    { name: "Home", item: "https://www.cosmicbrief.com/" }
  ];

  // Nakshatra pages: Home > Journal > Nakshatras > [Page]
  if (route.match(/^\/blog\/[a-z]+-nakshatra$/)) {
    const nakshatraName = pageTitle.split(':')[0].trim();
    items.push({ name: "Journal", item: "https://www.cosmicbrief.com/blog" });
    items.push({ name: "Nakshatras", item: "https://www.cosmicbrief.com/blog/category/nakshatra-profiles" });
    items.push({ name: nakshatraName });
  }
  // Blog articles: Home > Journal > [Page]
  else if (route.startsWith('/blog/') && !route.includes('/category/')) {
    items.push({ name: "Journal", item: "https://www.cosmicbrief.com/blog" });
    items.push({ name: pageTitle.split(' | ')[0] });
  }
  // Blog categories: Home > Journal > [Category]
  else if (route.includes('/blog/category/')) {
    items.push({ name: "Journal", item: "https://www.cosmicbrief.com/blog" });
    items.push({ name: pageTitle.split(' | ')[0] });
  }
  // Guide pages: Home > Guides > [Page]
  else if (['/vedic-astrology-explained', '/vedic-vs-western-astrology', '/how-to-read-vedic-chart'].includes(route)) {
    items.push({ name: "Guides", item: "https://www.cosmicbrief.com/blog" });
    items.push({ name: pageTitle.split(' | ')[0].split(':')[0].trim() });
  }
  // Blog index
  else if (route === '/blog') {
    items.push({ name: "Journal" });
  }
  // Other pages: simple Home > [Page]
  else if (route !== '/') {
    items.push({ name: pageTitle.split(' | ')[0] });
  }
  else {
    return null; // No breadcrumbs for homepage
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.item ? { "item": item.item } : {})
    }))
  };
}

// Post-process function to inject correct meta tags and schemas
function postProcessHtml(renderedRoute: { route: string; html: string }): string {
  const { route, html } = renderedRoute;
  const metadata = pageMetadata[route];

  if (!metadata) return html;

  let processedHtml = html;

  // Replace title
  processedHtml = processedHtml.replace(
    /<title>[^<]*<\/title>/,
    `<title>${metadata.title}</title>`
  );

  // Replace meta description
  processedHtml = processedHtml.replace(
    /<meta name="description" content="[^"]*"[^>]*>/,
    `<meta name="description" content="${metadata.description}">`
  );

  // Replace og:title
  processedHtml = processedHtml.replace(
    /<meta property="og:title" content="[^"]*"[^>]*>/,
    `<meta property="og:title" content="${metadata.title.split(' | ')[0]}">`
  );

  // Replace og:description
  processedHtml = processedHtml.replace(
    /<meta property="og:description" content="[^"]*"[^>]*>/,
    `<meta property="og:description" content="${metadata.description}">`
  );

  // Replace og:url
  processedHtml = processedHtml.replace(
    /<meta property="og:url" content="[^"]*"[^>]*>/,
    `<meta property="og:url" content="https://www.cosmicbrief.com${route}">`
  );

  // Replace twitter:title
  processedHtml = processedHtml.replace(
    /<meta name="twitter:title" content="[^"]*"[^>]*>/,
    `<meta name="twitter:title" content="${metadata.title.split(' | ')[0]}">`
  );

  // Replace twitter:description
  processedHtml = processedHtml.replace(
    /<meta name="twitter:description" content="[^"]*"[^>]*>/,
    `<meta name="twitter:description" content="${metadata.description.substring(0, 200)}">`
  );

  // Add canonical link if not present
  if (!processedHtml.includes('rel="canonical"')) {
    processedHtml = processedHtml.replace(
      '</head>',
      `<link rel="canonical" href="https://www.cosmicbrief.com${route}">\n</head>`
    );
  }

  // Add BreadcrumbList schema if Helmet didn't already add one
  const hasBreadcrumbFromHelmet = processedHtml.includes('"@type":"BreadcrumbList"') && processedHtml.includes('data-rh="true"');
  if (!hasBreadcrumbFromHelmet) {
    const breadcrumbSchema = generateBreadcrumbSchema(route, metadata.title);
    if (breadcrumbSchema) {
      const schemaScript = `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;
      processedHtml = processedHtml.replace('</head>', `${schemaScript}\n</head>`);
    }
  }

  return processedHtml;
}

// Static routes to prerender for SEO (35 pages)
const prerenderRoutes = [
  // Homepage
  "/",

  // Blog index and categories
  "/blog",
  "/blog/category/nakshatra-profiles",
  "/blog/category/cosmic-updates",
  "/blog/category/practical-guidance",

  // Nakshatra pages (20)
  "/blog/ashwini-nakshatra",
  "/blog/bharani-nakshatra",
  "/blog/krittika-nakshatra",
  "/blog/rohini-nakshatra",
  "/blog/mrigashira-nakshatra",
  "/blog/ardra-nakshatra",
  "/blog/punarvasu-nakshatra",
  "/blog/pushya-nakshatra",
  "/blog/ashlesha-nakshatra",
  "/blog/magha-nakshatra",
  "/blog/purva-phalguni-nakshatra",
  "/blog/uttara-phalguni-nakshatra",
  "/blog/hasta-nakshatra",
  "/blog/chitra-nakshatra",
  "/blog/swati-nakshatra",
  "/blog/vishakha-nakshatra",
  "/blog/anuradha-nakshatra",
  "/blog/jyeshtha-nakshatra",
  "/blog/mula-nakshatra",
  "/blog/purva-ashadha-nakshatra",
  "/blog/revati-nakshatra",

  // Blog articles
  "/blog/why-2026-is-a-turning-point",
  "/blog/career-astrology-2026",

  // Guides
  "/vedic-astrology-explained",
  "/vedic-vs-western-astrology",
  "/how-to-read-vedic-chart",

  // Utility pages
  "/terms",
  "/privacy",
  "/background",
  "/contact",

  // Special pages
  "/2026",
];

// https://vitejs.dev/config/
// Only prerender when PRERENDER=true (GitHub Actions sets this)
const shouldPrerender = process.env.PRERENDER === 'true';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      plugins: [
        mode === "production" && shouldPrerender && prerender({
          routes: prerenderRoutes,
          renderer: puppeteerRenderer,
          rendererOptions: {
            renderAfterDocumentEvent: "render-event",
            renderAfterTime: 5000,
          },
          postProcess: (renderedRoute) => {
            renderedRoute.html = postProcessHtml(renderedRoute);
            return renderedRoute;
          },
        }),
      ].filter(Boolean),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Exclude Deno edge function tests (they use https: imports)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/supabase/functions/**/*.test.ts',
    ],
  },
}));
