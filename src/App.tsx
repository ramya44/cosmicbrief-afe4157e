import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LoginModal } from "@/components/LoginModal";
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
import WeeklyInputPage from "./pages/WeeklyInputPage";
import WeeklyResultsPage from "./pages/WeeklyResultsPage";
import YearlyForecastPage from "./pages/YearlyForecastPage";
import ContactPage from "./pages/ContactPage";
import BackgroundPage from "./pages/BackgroundPage";
import LifeArcPage from "./pages/LifeArcPage";
import HowToReadChartPage from "./pages/HowToReadChartPage";
import VedicVsWesternPage from "./pages/VedicVsWesternPage";
import BirthChartInputPage from "./pages/BirthChartInputPage";
import BirthChartPage from "./pages/BirthChartPage";
import ChatPage from "./pages/ChatPage";
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
import AshleshaNakshatraPage from "./pages/AshleshaNakshatraPage";
import MaghaNakshatraPage from "./pages/MaghaNakshatraPage";
import PurvaPhalguniNakshatraPage from "./pages/PurvaPhalguniNakshatraPage";
import UttaraPhalguniNakshatraPage from "./pages/UttaraPhalguniNakshatraPage";
import HastaNakshatraPage from "./pages/HastaNakshatraPage";
import ChitraNakshatraPage from "./pages/ChitraNakshatraPage";
import SwatiNakshatraPage from "./pages/SwatiNakshatraPage";
import PurvaBhadrapadaNakshatraPage from "./pages/PurvaBhadrapadaNakshatraPage";
import UttaraBhadrapadaNakshatraPage from "./pages/UttaraBhadrapadaNakshatraPage";
import VishakhaNakshatraPage from "./pages/VishakhaNakshatraPage";
import AnuradhaNakshatraPage from "./pages/AnuradhaNakshatraPage";
import JyeshthaNakshatraPage from "./pages/JyeshthaNakshatraPage";
import MulaNakshatraPage from "./pages/MulaNakshatraPage";
import RevatiNakshatraPage from "./pages/RevatiNakshatraPage";
import PlanetaryPeriodsDashasPage from "./pages/PlanetaryPeriodsDashasPage";
import TwelveHousesPage from "./pages/TwelveHousesPage";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { Navigation } from "./components/Navigation";
import { FEATURE_FLAGS } from "./config/feature-flags";

const queryClient = new QueryClient();

// Redirect helper for:
// 1. Legacy hash-based URLs (old bookmarks with #/)
// 2. 404.html redirects (SPA fallback with ?redirect= param)
const RedirectHelper = () => {
  useEffect(() => {
    // Handle legacy hash URLs (e.g., /#/blog -> /blog)
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.slice(1); // Remove the #
      window.history.replaceState(null, '', window.location.origin + cleanPath);
      window.location.reload();
      return;
    }

    // Handle 404.html redirects (e.g., /?redirect=/blog -> /blog)
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get('redirect');
    if (redirectPath) {
      window.history.replaceState(null, '', redirectPath);
      window.location.reload();
    }
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RedirectHelper />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Navigation />
          <LoginModal />
          <div className="pt-14 md:pt-16 pb-16 md:pb-0">
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/weekly/input" element={<WeeklyInputPage />} />
          <Route path="/weekly/results" element={<WeeklyResultsPage />} />
          <Route path="/2026" element={<YearlyForecastPage />} />
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
          <Route path="/blog/ashlesha-nakshatra" element={<AshleshaNakshatraPage />} />
          <Route path="/blog/magha-nakshatra" element={<MaghaNakshatraPage />} />
          <Route path="/blog/purva-phalguni-nakshatra" element={<PurvaPhalguniNakshatraPage />} />
          <Route path="/blog/uttara-phalguni-nakshatra" element={<UttaraPhalguniNakshatraPage />} />
          <Route path="/blog/hasta-nakshatra" element={<HastaNakshatraPage />} />
          <Route path="/blog/chitra-nakshatra" element={<ChitraNakshatraPage />} />
          <Route path="/blog/swati-nakshatra" element={<SwatiNakshatraPage />} />
          <Route path="/blog/purva-bhadrapada-nakshatra" element={<PurvaBhadrapadaNakshatraPage />} />
          <Route path="/blog/uttara-bhadrapada-nakshatra" element={<UttaraBhadrapadaNakshatraPage />} />
          <Route path="/blog/vishakha-nakshatra" element={<VishakhaNakshatraPage />} />
          <Route path="/blog/anuradha-nakshatra" element={<AnuradhaNakshatraPage />} />
          <Route path="/blog/jyeshtha-nakshatra" element={<JyeshthaNakshatraPage />} />
          <Route path="/blog/mula-nakshatra" element={<MulaNakshatraPage />} />
          <Route path="/blog/revati-nakshatra" element={<RevatiNakshatraPage />} />
          <Route path="/blog/planetary-periods-dashas" element={<PlanetaryPeriodsDashasPage />} />
          <Route path="/blog/12-houses-vedic-astrology" element={<TwelveHousesPage />} />
          <Route path="/vedic/input" element={<VedicInputPage />} />
          <Route path="/vedic/results" element={<VedicResultsPage />} />
          <Route path="/vedic/payment-success" element={<VedicPaymentSuccessPage />} />
          <Route path="/vedic/profile" element={<VedicProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/vedic-astrology-explained" element={<VedicAstrologyExplainedPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/background" element={<BackgroundPage />} />
          {FEATURE_FLAGS.LIFE_ARC_ENABLED && (
            <Route path="/life-arc" element={<LifeArcPage />} />
          )}
          <Route path="/how-to-read-vedic-chart" element={<HowToReadChartPage />} />
          <Route path="/vedic-vs-western-astrology" element={<VedicVsWesternPage />} />
          <Route path="/get-birth-chart" element={<Navigate to="/" replace />} />
          <Route path="/birth-chart" element={<BirthChartPage />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
