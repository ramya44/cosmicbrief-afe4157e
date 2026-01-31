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
import LifeArcPage from "./pages/LifeArcPage";
import HowToReadChartPage from "./pages/HowToReadChartPage";
import VedicVsWesternPage from "./pages/VedicVsWesternPage";
import BirthChartInputPage from "./pages/BirthChartInputPage";
import BirthChartPage from "./pages/BirthChartPage";
import BlogCategoryPage from "./pages/BlogCategoryPage";
import WhatIsNakshatraPage from "./pages/WhatIsNakshatraPage";
import RohiniNakshatraPage from "./pages/RohiniNakshatraPage";
import MrigashiraNakshatraPage from "./pages/MrigashiraNakshatraPage";
import AshwiniNakshatraPage from "./pages/AshwiniNakshatraPage";
import BharaniNakshatraPage from "./pages/BharaniNakshatraPage";
import KrittikaNakshatraPage from "./pages/KrittikaNakshatraPage";
import ArdraNakshatraPage from "./pages/ArdraNakshatraPage";
import PunarvasuNakshatraPage from "./pages/PunarvasuNakshatraPage";
import PushyaNakshatraPage from "./pages/PushyaNakshatraPage";
import PlanetaryPeriodsDashasPage from "./pages/PlanetaryPeriodsDashasPage";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { Navigation } from "./components/Navigation";
import { FEATURE_FLAGS } from "./config/feature-flags";

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
        <Navigation />
        <div className="pt-14 md:pt-16 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/blog" element={<AstrologyForecast2026Page />} />
          <Route path="/blog/category/:categorySlug" element={<BlogCategoryPage />} />
          <Route path="/blog/why-2026-is-a-turning-point" element={<WhyTurningPointPage />} />
          <Route path="/blog/politics-and-global-events" element={<PoliticsGlobalEventsPage />} />
          <Route path="/blog/career-astrology-2026" element={<CareerAstrology2026Page />} />
          <Route path="/blog/what-is-nakshatra" element={<WhatIsNakshatraPage />} />
          <Route path="/blog/rohini-nakshatra" element={<RohiniNakshatraPage />} />
          <Route path="/blog/mrigashira-nakshatra" element={<MrigashiraNakshatraPage />} />
          <Route path="/blog/ashwini-nakshatra" element={<AshwiniNakshatraPage />} />
          <Route path="/blog/bharani-nakshatra" element={<BharaniNakshatraPage />} />
          <Route path="/blog/krittika-nakshatra" element={<KrittikaNakshatraPage />} />
          <Route path="/blog/ardra-nakshatra" element={<ArdraNakshatraPage />} />
          <Route path="/blog/punarvasu-nakshatra" element={<PunarvasuNakshatraPage />} />
          <Route path="/blog/pushya-nakshatra" element={<PushyaNakshatraPage />} />
          <Route path="/blog/planetary-periods-dashas" element={<PlanetaryPeriodsDashasPage />} />
          <Route path="/vedic/input" element={<VedicInputPage />} />
          <Route path="/vedic/results" element={<VedicResultsPage />} />
          <Route path="/vedic/payment-success" element={<VedicPaymentSuccessPage />} />
          <Route path="/vedic/profile" element={<VedicProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/vedic-astrology-explained" element={<VedicAstrologyExplainedPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/background" element={<BackgroundPage />} />
          <Route path="/weekly-horoscope" element={<WeeklyHoroscopePage />} />
          {FEATURE_FLAGS.LIFE_ARC_ENABLED && (
            <Route path="/life-arc" element={<LifeArcPage />} />
          )}
          <Route path="/how-to-read-vedic-chart" element={<HowToReadChartPage />} />
          <Route path="/vedic-vs-western-astrology" element={<VedicVsWesternPage />} />
          <Route path="/get-birth-chart" element={<BirthChartInputPage />} />
          <Route path="/birth-chart" element={<BirthChartPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
