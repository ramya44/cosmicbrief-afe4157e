/**
 * Route completeness tests
 *
 * Verifies that every lazy-loaded page in App.tsx has a corresponding file,
 * and that prerender routes in vite.config.ts map to actual routes.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PAGES_DIR = path.resolve(__dirname, '../pages');

// All page files that exist on disk
const pageFiles = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.tsx'));

// Routes defined in App.tsx (extracted statically)
// We read App.tsx and parse the route paths and component names
const appTsxPath = path.resolve(__dirname, '../App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf-8');

// Extract lazy imports: lazy(() => import("./pages/FooPage"))
const lazyImportRegex = /lazy\(\(\) => import\("\.\/pages\/(\w+)"\)\)/g;
const lazyImports: string[] = [];
let match: RegExpExecArray | null;
while ((match = lazyImportRegex.exec(appTsxContent)) !== null) {
  lazyImports.push(match[1]);
}

// Extract direct imports: import Foo from "./pages/Foo"
const directImportRegex = /import\s+\w+\s+from\s+["']\.\/pages\/(\w+)["']/g;
while ((match = directImportRegex.exec(appTsxContent)) !== null) {
  lazyImports.push(match[1]);
}

// Extract Route paths: <Route path="/foo"
const routePathRegex = /path="([^"]+)"/g;
const routePaths: string[] = [];
while ((match = routePathRegex.exec(appTsxContent)) !== null) {
  routePaths.push(match[1]);
}

describe('Route completeness', () => {
  it('every lazy-imported page has a corresponding .tsx file', () => {
    const missing: string[] = [];
    for (const pageName of lazyImports) {
      const fileName = `${pageName}.tsx`;
      if (!pageFiles.includes(fileName)) {
        missing.push(pageName);
      }
    }
    expect(missing, `Missing page files: ${missing.join(', ')}`).toEqual([]);
  });

  it('has at least 30 routes defined', () => {
    // Sanity check that we parsed routes correctly
    expect(routePaths.length).toBeGreaterThanOrEqual(30);
  });

  it('all routes start with /', () => {
    for (const p of routePaths) {
      if (p === '*') continue; // catch-all is fine
      expect(p, `Route "${p}" should start with /`).toMatch(/^\//);
    }
  });

  it('has a catch-all 404 route', () => {
    expect(routePaths).toContain('*');
  });

  it('has key routes defined', () => {
    const requiredRoutes = [
      '/',
      '/blog',
      '/terms',
      '/privacy',
      '/contact',
      '/vedic/input',
      '/vedic/results',
      '/chat',
      '/2026',
    ];
    for (const route of requiredRoutes) {
      expect(routePaths, `Missing required route: ${route}`).toContain(route);
    }
  });
});

describe('Prerender routes', () => {
  // Read vite.config.ts and extract prerenderRoutes array
  const viteConfigPath = path.resolve(__dirname, '../../vite.config.ts');
  const viteContent = fs.readFileSync(viteConfigPath, 'utf-8');

  const prerenderMatch = viteContent.match(/const prerenderRoutes\s*=\s*\[([\s\S]*?)\];/);
  const prerenderRoutes: string[] = [];
  if (prerenderMatch) {
    const routeStringRegex = /"([^"]+)"/g;
    let rm: RegExpExecArray | null;
    while ((rm = routeStringRegex.exec(prerenderMatch[1])) !== null) {
      prerenderRoutes.push(rm[1]);
    }
  }

  it('has prerender routes defined', () => {
    expect(prerenderRoutes.length).toBeGreaterThan(0);
  });

  it('all prerender routes exist in App.tsx routes', () => {
    const missing: string[] = [];
    for (const pr of prerenderRoutes) {
      // Category routes use :categorySlug param in App.tsx
      if (pr.startsWith('/blog/category/')) {
        expect(routePaths).toContain('/blog/category/:categorySlug');
        continue;
      }
      if (!routePaths.includes(pr)) {
        missing.push(pr);
      }
    }
    expect(missing, `Prerender routes not in App.tsx: ${missing.join(', ')}`).toEqual([]);
  });

  it('homepage is prerendered', () => {
    expect(prerenderRoutes).toContain('/');
  });
});
