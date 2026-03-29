import { Link } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { SEOBreadcrumbs } from "@/components/SEOBreadcrumbs";
import { ReactNode } from "react";

interface QuickFact {
  label: string;
  value: string;
}

interface RelatedPost {
  href: string;
  text: string;
}

interface JsonLdData {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  keywords: string[];
  url: string;
}

export interface NakshatraPageProps {
  /** The nakshatra name, e.g. "Ashwini" */
  name: string;
  /** The full page title/h1, e.g. "Ashwini Nakshatra: The Divine Healers" */
  title: string;
  /** SEO title for <title> tag */
  seoTitle: string;
  /** Meta description */
  metaDescription: string;
  /** Canonical URL slug, e.g. "ashwini-nakshatra" */
  slug: string;
  /** Read time, e.g. "6 min read". If omitted, badge is hidden */
  readTime?: string;
  /** Author line date, e.g. "January 26, 2025" */
  authorDate: string;
  /** Whether to prefix "By " before author name (default true) */
  showByPrefix?: boolean;
  /** Quick facts for the sidebar box */
  quickFacts: QuickFact[];
  /** JSON-LD structured data. If omitted, no JSON-LD is rendered */
  jsonLd?: JsonLdData;
  /** CTA box heading. Defaults to "Is {name} Your Nakshatra?" */
  ctaTitle?: string;
  /** CTA box description */
  ctaDescription?: string;
  /** CTA button link. Defaults to "/" */
  ctaLink?: string;
  /** CTA button text. Defaults to "Get your free Cosmic Brief" */
  ctaButtonText?: string;
  /** Related posts links. If omitted, section is hidden */
  relatedPosts?: RelatedPost[];
  /** Whether to show the "Go Deeper" section (default true) */
  showGoDeeper?: boolean;
  /** Whether to show the footer tagline (default true) */
  showFooterTagline?: boolean;
  /** The unique body content for this nakshatra */
  children: ReactNode;
}

export const NakshatraPageTemplate = ({
  name,
  title,
  seoTitle,
  metaDescription,
  slug,
  readTime,
  authorDate,
  showByPrefix = true,
  quickFacts,
  jsonLd,
  ctaTitle,
  ctaDescription,
  ctaLink = "/",
  ctaButtonText = "Get your free Cosmic Brief",
  relatedPosts,
  showGoDeeper = true,
  showFooterTagline = true,
  children,
}: NakshatraPageProps) => {
  const canonicalUrl = `https://www.cosmicbrief.com/blog/${slug}`;

  const jsonLdScript = jsonLd
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: jsonLd.headline,
        description: jsonLd.description,
        datePublished: jsonLd.datePublished,
        dateModified: jsonLd.dateModified,
        author: { "@type": "Person", name: "Maya G." },
        publisher: { "@type": "Organization", name: "Cosmic Brief" },
        mainEntityOfPage: { "@type": "WebPage", "@id": jsonLd.url || canonicalUrl },
        keywords: jsonLd.keywords,
      }
    : null;

  const resolvedCtaTitle = ctaTitle ?? `Is ${name} Your Nakshatra?`;
  const resolvedCtaDescription =
    ctaDescription ?? `Discover your Moon nakshatra and see how ${name}'s energy influences your chart.`;

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {jsonLdScript && (
          <script type="application/ld+json">{JSON.stringify(jsonLdScript)}</script>
        )}
      </Helmet>
      <StarField />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <SEOBreadcrumbs
          items={[
            { name: "Journal", href: "/blog" },
            { name: "Nakshatras", href: "/blog/category/nakshatras" },
          ]}
          currentPage={`${name} Nakshatra`}
        />

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-cream mb-4 leading-tight">
          {title}
        </h1>

        {/* Category & Read Time */}
        {readTime && (
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 text-xs bg-gold/10 text-gold rounded">
              Nakshatras
            </span>
            <span className="text-cream/40 text-sm">{readTime}</span>
          </div>
        )}

        {/* Author and Date */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/maya.png" alt="Maya G." className="w-8 h-8 rounded-full" />
          <p className="text-cream/50 text-sm">
            {showByPrefix ? "By " : ""}Maya G. · {authorDate}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6 text-cream/80 leading-relaxed">
          {/* Quick Facts */}
          <div className="my-8 p-6 bg-cream/5 rounded-lg border border-cream/10">
            <h2 className="font-display text-xl text-cream mb-4">
              Quick Facts About {name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {quickFacts.map((fact) => (
                <p key={fact.label}>
                  <span className="text-gold">{fact.label}:</span> {fact.value}
                </p>
              ))}
            </div>
          </div>

          {/* Unique body content */}
          {children}

          {/* CTA */}
          <div className="my-12 p-6 bg-gold/5 rounded-lg border border-gold/20">
            <h3 className="font-display text-xl text-cream mb-3">{resolvedCtaTitle}</h3>
            <p className="text-cream/70 mb-4">{resolvedCtaDescription}</p>
            <Link to={ctaLink}>
              <Button className="bg-gold hover:bg-gold/90 text-midnight font-medium px-6 py-5">
                {ctaButtonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-cream/10">
            <h2 className="font-display text-xl text-cream mb-6">Related Posts</h2>
            <div className="space-y-3">
              {relatedPosts.map((post) => (
                <Link key={post.href} to={post.href} className="block text-gold hover:underline">
                  {post.text} →
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Go Deeper CTA */}
        {showGoDeeper && (
          <div className="mt-12 p-6 bg-gold/5 rounded-lg border border-gold/20">
            <h3 className="font-display text-lg text-cream mb-4">Go Deeper</h3>
            <div className="space-y-3 text-sm">
              <p className="text-cream/70">
                <Link to="/" className="text-gold hover:underline font-medium">
                  Get your free Cosmic Brief
                </Link>
                {" "}— See your Moon nakshatra, planetary positions, and houses.
              </p>
              <p className="text-cream/70">
                <Link to="/vedic/input" className="text-gold hover:underline font-medium">
                  2026 Cosmic Brief
                </Link>
                {" "}— Your personalized year ahead, based on your dasha and transits.
              </p>
            </div>
          </div>
        )}

        {/* Footer tagline */}
        {showFooterTagline && (
          <p className="text-cream/40 text-sm text-center mt-12 italic">
            Cosmic Brief is Vedic astrology for the modern seeker. No guilt. No fate. Just ancient
            wisdom, translated.
          </p>
        )}
      </div>
    </div>
  );
};
