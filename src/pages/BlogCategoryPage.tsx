import { Link, useParams } from "react-router-dom";
import { StarField } from "@/components/StarField";
import { ArrowRight, BookOpen, Star, Globe, Heart, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

// Category metadata
const categories: Record<string, {
  title: string;
  description: string;
  longDescription: string;
  icon: typeof BookOpen;
}> = {
  learn: {
    title: "Learn Vedic Astrology",
    description: "Beginner-friendly explainers",
    longDescription: "Foundations, terminology, and how to read your chart. Start here if you're new to Vedic astrology.",
    icon: BookOpen,
  },
  nakshatras: {
    title: "Nakshatras",
    description: "The 27 lunar mansions",
    longDescription: "Deep dives into each of the 27 nakshatras — the lunar mansions that reveal your true cosmic DNA.",
    icon: Star,
  },
  transits: {
    title: "Cosmic Weather",
    description: "Current planetary movements",
    longDescription: "What's happening in the sky right now and what it means for you. Planetary transits decoded.",
    icon: Globe,
  },
  relationships: {
    title: "Relationships",
    description: "Compatibility and connection",
    longDescription: "Compatibility, synastry, and relationship dynamics through a Vedic lens.",
    icon: Heart,
  },
  life: {
    title: "Life Themes",
    description: "Career, purpose, and timing",
    longDescription: "Career, money, health, and the big questions — explored through Vedic astrology.",
    icon: Compass,
  },
};

// Posts by category (will grow over time)
const postsByCategory: Record<string, Array<{
  title: string;
  excerpt: string;
  link: string;
  author: string;
  date: string;
}>> = {
  learn: [
    {
      title: "Nakshatra: Your True Cosmic DNA",
      excerpt: "The 27 lunar mansions are the heart of Vedic astrology. Here's why they matter more than your zodiac sign.",
      link: "/blog/what-is-nakshatra",
      author: "Maya G.",
      date: "Jan 18, 2025",
    },
  ],
  nakshatras: [
    {
      title: "Nakshatra: Your True Cosmic DNA",
      excerpt: "Start here — an introduction to the 27 lunar mansions and why your Moon nakshatra matters most.",
      link: "/blog/what-is-nakshatra",
      author: "Maya G.",
      date: "Jan 18, 2025",
    },
  ],
  transits: [
    {
      title: "Career Transits in 2026",
      excerpt: "2026 career predictions by Moon sign. Jupiter exalted in Cancer, Saturn in Pisces, and the Rahu-Ketu shift.",
      link: "/blog/career-astrology-2026",
      author: "Maya G.",
      date: "Jan 18, 2025",
    },
    {
      title: "Why 2026 Is a Turning Point in Astrology",
      excerpt: "Saturn and Neptune enter Aries permanently. What this rare double transit means for the collective.",
      link: "/blog/why-2026-is-a-turning-point",
      author: "Maya G.",
      date: "Jan 1, 2025",
    },
    {
      title: "2026 Political Astrology",
      excerpt: "What Aries energy means for global events, leadership, and grassroots movements.",
      link: "/blog/politics-and-global-events",
      author: "Maya G.",
      date: "Jan 1, 2025",
    },
  ],
  relationships: [
    // Posts will be added here
  ],
  life: [
    // Posts will be added here
  ],
};

const BlogCategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();

  const category = categorySlug ? categories[categorySlug] : null;
  const posts = categorySlug ? postsByCategory[categorySlug] || [] : [];

  if (!category) {
    return (
      <div className="min-h-screen bg-midnight text-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-4">Category not found</h1>
          <Link to="/blog" className="text-gold hover:underline">
            Return to Journal
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = category.icon;

  return (
    <div className="min-h-screen bg-midnight text-cream relative overflow-hidden">
      <Helmet>
        <title>{category.title} | The Cosmic Brief Journal</title>
        <meta name="description" content={category.longDescription} />
        <link rel="canonical" href={`https://cosmicbrief.com/blog/category/${categorySlug}`} />
      </Helmet>
      <StarField />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link to="/blog" className="text-cream/50 hover:text-cream text-sm">
            Journal
          </Link>
          <span className="text-cream/30 mx-2">/</span>
          <span className="text-gold text-sm">{category.title}</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gold/10 rounded-lg">
              <IconComponent className="w-6 h-6 text-gold" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-cream">
              {category.title}
            </h1>
          </div>
          <p className="text-cream/70 text-lg max-w-2xl">
            {category.longDescription}
          </p>
        </div>

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <Link
                key={index}
                to={post.link}
                className="block p-6 border border-cream/20 rounded-lg hover:bg-cream/5 hover:border-cream/30 transition-colors"
              >
                <h2 className="text-cream font-display text-xl mb-2">{post.title}</h2>
                <p className="text-cream/60 mb-3">{post.excerpt}</p>
                <div className="flex items-center gap-2">
                  <img src="/maya.png" alt="Maya G." className="w-5 h-5 rounded-full" />
                  <p className="text-cream/40 text-sm">{post.author} · {post.date}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-cream/10 rounded-lg">
            <p className="text-cream/50 mb-4">No posts in this category yet.</p>
            <p className="text-cream/40 text-sm">Check back soon — new content is on the way.</p>
          </div>
        )}

        {/* Back to Journal */}
        <div className="mt-12 pt-8 border-t border-cream/10">
          <Link to="/blog" className="text-gold hover:underline inline-flex items-center gap-2">
            ← Back to Journal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogCategoryPage;
