import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
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
import VedicProfilePage from "./pages/VedicProfilePage";
import AuthPage from "./pages/AuthPage";
import ContactPage from "./pages/ContactPage";
import BackgroundPage from "./pages/BackgroundPage";
import WeeklyHoroscopePage from "./pages/WeeklyHoroscopePage";
import CompatibilityPage from "./pages/CompatibilityPage";
import HowToReadChartPage from "./pages/HowToReadChartPage";
import VedicVsWesternPage from "./pages/VedicVsWesternPage";
import BirthChartInputPage from "./pages/BirthChartInputPage";
import BirthChartPage from "./pages/BirthChartPage";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// Redirect helper for legacy non-hash URLs
// This runs once on app load to handle cases where users have old bookmarks or the 404.html redirect
const LegacyUrlRedirectHelper = () => {
  useEffect(() => {
    // Only run on initial page load, not within hash router
    if (window.location.hash) return;

    const { origin, pathname, search } = window.location;

    // If we're on root path, don't redirect
    if (pathname === '/') {
      return;
    }

    // For any non-root path without a hash, convert to hash-based route
    // This handles /vedic/*, /vedic-astrology-explained, /privacy, etc.
    window.location.replace(`${origin}/#${pathname}${search}`);
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
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/2026-astrology-forecast" element={<AstrologyForecast2026Page />} />
          <Route path="/2026-astrology-forecast/why-2026-is-a-turning-point" element={<WhyTurningPointPage />} />
          <Route path="/2026-astrology-forecast/politics-and-global-events" element={<PoliticsGlobalEventsPage />} />
          <Route path="/2026-astrology-forecast/career" element={<CareerAstrology2026Page />} />
          <Route path="/vedic/input" element={<VedicInputPage />} />
          <Route path="/vedic/results" element={<VedicResultsPage />} />
          <Route path="/vedic/payment-success" element={<VedicPaymentSuccessPage />} />
          <Route path="/vedic/profile" element={<VedicProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/vedic-astrology-explained" element={<VedicAstrologyExplainedPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/background" element={<BackgroundPage />} />
          <Route path="/weekly-horoscope" element={<WeeklyHoroscopePage />} />
          <Route path="/compatibility" element={<CompatibilityPage />} />
          <Route path="/how-to-read-vedic-chart" element={<HowToReadChartPage />} />
          <Route path="/vedic-vs-western-astrology" element={<VedicVsWesternPage />} />
          <Route path="/get-birth-chart" element={<BirthChartInputPage />} />
          <Route path="/birth-chart" element={<BirthChartPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
