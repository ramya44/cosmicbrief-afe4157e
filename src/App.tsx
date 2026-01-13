import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import InputPage from "./pages/InputPage";
import ResultsPage from "./pages/ResultsPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AstrologyForecast2026Page from "./pages/AstrologyForecast2026Page";
import WhyTurningPointPage from "./pages/WhyTurningPointPage";
import PoliticsGlobalEventsPage from "./pages/PoliticsGlobalEventsPage";
import CareerAstrology2026Page from "./pages/CareerAstrology2026Page";
import VedicInputPage from "./pages/VedicInputPage";
import VedicResultsPage from "./pages/VedicResultsPage";
import VedicPaymentSuccessPage from "./pages/VedicPaymentSuccessPage";
import VedicAstrologyExplainedPage from "./pages/VedicAstrologyExplainedPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// Redirect helper for legacy non-hash URLs (e.g., /results?forecastId=... or /?forecastId=...)
// This runs once on app load to handle cases where users have old bookmarks or the 404.html redirect
const LegacyUrlRedirectHelper = () => {
  useEffect(() => {
    // Only run on initial page load, not within hash router
    if (window.location.hash) return;

    const { origin, pathname, search } = window.location;
    const params = new URLSearchParams(search);

    // If we're on root path without any special params, don't redirect
    if (pathname === '/' && !params.get('forecastId') && !params.get('id')) {
      return;
    }

    // Handle forecast deep links with query params
    const forecastId = params.get('forecastId') || params.get('id');
    const guestToken = params.get('guestToken') || params.get('guest_token');

    // If we have forecast params on the root, redirect to hash route results
    if (pathname === '/' && forecastId) {
      const tokenPart = guestToken ? `&guestToken=${encodeURIComponent(guestToken)}` : '';
      const hashUrl = `${origin}/#/results?forecastId=${encodeURIComponent(forecastId)}${tokenPart}`;
      window.location.replace(hashUrl);
      return;
    }

    // For any non-root path without a hash, convert to hash-based route
    // This handles /vedic/*, /vedic-astrology-explained, /privacy, etc.
    if (pathname !== '/') {
      window.location.replace(`${origin}/#${pathname}${search}`);
      return;
    }

    // Generic SPA redirect fallback from 404.html
    const savedPath = sessionStorage.getItem('spa_redirect');
    if (savedPath) {
      sessionStorage.removeItem('spa_redirect');
      window.location.replace(`${origin}/#${savedPath}`);
    }
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LegacyUrlRedirectHelper />
      <Toaster />
      <Sonner />
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/input" element={<InputPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/2026-astrology-forecast" element={<AstrologyForecast2026Page />} />
          <Route path="/2026-astrology-forecast/why-2026-is-a-turning-point" element={<WhyTurningPointPage />} />
          <Route path="/2026-astrology-forecast/politics-and-global-events" element={<PoliticsGlobalEventsPage />} />
          <Route path="/2026-astrology-forecast/career" element={<CareerAstrology2026Page />} />
          <Route path="/vedic/input" element={<VedicInputPage />} />
          <Route path="/vedic/results" element={<VedicResultsPage />} />
          <Route path="/vedic/payment-success" element={<VedicPaymentSuccessPage />} />
          <Route path="/vedic-astrology-explained" element={<VedicAstrologyExplainedPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
