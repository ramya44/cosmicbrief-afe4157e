import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface SEOBreadcrumbsProps {
  items: BreadcrumbItem[];
  currentPage: string;
}

export const SEOBreadcrumbs = ({ items, currentPage }: SEOBreadcrumbsProps) => {
  // Build JSON-LD BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      // Home is always first
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.cosmicbrief.com/"
      },
      // Intermediate items
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.name,
        "item": `https://www.cosmicbrief.com${item.href}`
      })),
      // Current page (no item URL for current page per Google guidelines)
      {
        "@type": "ListItem",
        "position": items.length + 2,
        "name": currentPage
      }
    ]
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs">
          <li>
            <Link to="/" className="text-gold/60 hover:text-gold transition-colors">
              Home
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1">
              <span className="text-gold/30 mx-1">/</span>
              <Link to={item.href} className="text-gold/60 hover:text-gold transition-colors">
                {item.name}
              </Link>
            </li>
          ))}
          <li className="flex items-center gap-1">
            <span className="text-gold/30 mx-1">/</span>
            <span className="text-gold/80" aria-current="page">
              {currentPage}
            </span>
          </li>
        </ol>
      </nav>
    </>
  );
};
