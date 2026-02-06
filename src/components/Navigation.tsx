import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Calendar, Circle, BookOpen, ChevronDown, LogIn, LogOut } from 'lucide-react';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useForecastStore } from '@/store/forecastStore';
import { toast } from 'sonner';

// Primary nav items shown in bottom bar on mobile
const primaryNavItems = [
  { label: '2026 Forecast', path: '/', icon: Calendar },
  { label: 'Birth Chart', path: '/get-birth-chart', icon: Circle },
  { label: 'Journal', path: '/blog', icon: BookOpen },
];

// Blog articles
const blogArticles = [
  { label: 'Planetary Periods (Dashas) Explained', path: '/blog/planetary-periods-dashas', date: 'Jan 21, 2025' },
  { label: 'Nakshatra: Your True Cosmic DNA', path: '/blog/what-is-nakshatra', date: 'Jan 18, 2025' },
  { label: 'Why 2026 Is a Turning Point', path: '/blog/why-2026-is-a-turning-point', date: 'Jan 1, 2025' },
  { label: 'Career Transits in 2026', path: '/blog/career-astrology-2026', date: 'Jan 18, 2025' },
  { label: '2026 Political Astrology', path: '/blog/politics-and-global-events', date: 'Jan 1, 2025' },
];

// Secondary nav items shown in hamburger menu on mobile
const secondaryNavItems = [
  ...(FEATURE_FLAGS.LIFE_ARC_ENABLED ? [{ label: 'Life Arc', path: '/life-arc' }] : []),
  { label: 'What is Vedic Astrology', path: '/vedic-astrology-explained' },
];

// All nav items for desktop
const allNavItems = [
  { label: '2026 Forecast', path: '/' },
  { label: 'Birth Chart', path: '/get-birth-chart' },
  ...(FEATURE_FLAGS.LIFE_ARC_ENABLED ? [{ label: 'Life Arc', path: '/life-arc' }] : []),
  { label: 'What is Vedic Astrology', path: '/vedic-astrology-explained' },
];

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [blogDropdownOpen, setBlogDropdownOpen] = useState(false);
  const { isAuthenticated, user, openLoginModal } = useAuthContext();
  const resetStore = useForecastStore((state) => state.reset);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setBlogDropdownOpen(false);
  };

  const handleLogin = () => {
    setMenuOpen(false);
    openLoginModal();
  };

  const handleLogout = () => {
    setMenuOpen(false);

    // Clear store
    resetStore();

    // Clear Supabase auth from localStorage directly
    const localStorageKey = Object.keys(localStorage).find(key =>
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );
    if (localStorageKey) {
      localStorage.removeItem(localStorageKey);
    }

    // Try Supabase signOut in background (don't wait for it)
    supabase.auth.signOut().catch(() => {});

    toast.success('Logged out successfully');

    // Force page reload to reset all state
    window.location.href = '/#/';
  };

  const isBlogActive = location.pathname.startsWith('/blog');

  return (
    <>
      {/* Desktop Navigation - hidden on mobile */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-4 md:px-8 py-4 bg-midnight/80 backdrop-blur-sm border-b border-gold/10">
        <div className="flex items-center gap-1 md:gap-6 overflow-x-auto scrollbar-hide">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`whitespace-nowrap px-3 py-2 text-sm font-sans transition-colors rounded-md ${
                  isActive
                    ? 'text-gold bg-gold/10'
                    : 'text-cream-muted hover:text-cream hover:bg-gold/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {/* Blog Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setBlogDropdownOpen(true)}
            onMouseLeave={() => setBlogDropdownOpen(false)}
          >
            <button
              onClick={() => navigate('/blog')}
              className={`flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-sans transition-colors rounded-md ${
                isBlogActive
                  ? 'text-gold bg-gold/10'
                  : 'text-cream-muted hover:text-cream hover:bg-gold/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Journal
              <ChevronDown className={`w-3 h-3 transition-transform ${blogDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {blogDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-midnight/95 backdrop-blur-lg border border-gold/20 rounded-lg shadow-lg py-2">
                {blogArticles.map((article) => {
                  const isActive = location.pathname === article.path;
                  return (
                    <button
                      key={article.path}
                      onClick={() => handleNavigation(article.path)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'text-gold bg-gold/10'
                          : 'text-cream-muted hover:text-cream hover:bg-gold/5'
                      }`}
                    >
                      <span className="block">{article.label}</span>
                      <span className="block text-xs text-cream/40">Maya G. · {article.date}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Auth buttons - desktop */}
        <div className="flex items-center gap-3 ml-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-cream/60 truncate max-w-[150px]">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-cream-muted hover:text-cream hover:bg-gold/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogin}
              className="text-gold hover:text-gold-light hover:bg-gold/10"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile Top Bar - hamburger menu only */}
      <div className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center justify-between px-4 py-3 bg-midnight/80 backdrop-blur-sm border-b border-gold/10">
        <span className="text-gold font-display text-lg">Cosmic Brief</span>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-cream-muted hover:text-cream hover:bg-gold/10"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-midnight/95 backdrop-blur-lg border-gold/20 w-72">
            <div className="flex flex-col gap-2 mt-8">
              {/* Auth section - mobile */}
              <div className="mb-4 pb-4 border-b border-gold/20">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="px-4 text-sm text-cream/60 truncate">
                      {user?.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-base font-sans text-cream-muted hover:text-cream hover:bg-gold/5 rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="w-full flex items-center gap-2 px-4 py-3 text-base font-sans text-gold hover:bg-gold/5 rounded-md transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Log In
                  </button>
                )}
              </div>

              {secondaryNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`text-left px-4 py-3 text-base font-sans transition-colors rounded-md ${
                      isActive
                        ? 'text-gold bg-gold/10'
                        : 'text-cream-muted hover:text-cream hover:bg-gold/5'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <div className="border-t border-gold/20 my-4" />

              {/* Journal Section */}
              <div className="px-4 py-2">
                <div className="flex items-center gap-2 text-gold text-sm font-medium mb-2">
                  <BookOpen className="w-4 h-4" />
                  Journal
                </div>
                <div className="space-y-1 pl-6">
                  {blogArticles.map((article) => {
                    const isActive = location.pathname === article.path;
                    return (
                      <button
                        key={article.path}
                        onClick={() => handleNavigation(article.path)}
                        className={`w-full text-left py-2 text-sm transition-colors rounded-md ${
                          isActive
                            ? 'text-gold'
                            : 'text-cream-muted hover:text-cream'
                        }`}
                      >
                        <span className="block">{article.label}</span>
                        <span className="block text-xs text-cream/40">Maya G. · {article.date}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-midnight/95 backdrop-blur-lg border-t border-gold/20">
        <div className="flex items-center justify-around py-2 px-4">
          {primaryNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-gold'
                    : 'text-cream-muted hover:text-cream'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-sans">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
