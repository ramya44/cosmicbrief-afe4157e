import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { Navigation } from "./components/Navigation";
import { FEATURE_FLAGS } from "./config/feature-flags";

// Lazy-loaded pages
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const AstrologyForecast2026Page = lazy(() => import("./pages/AstrologyForecast2026Page"));
const WhyTurningPointPage = lazy(() => import("./pages/WhyTurningPointPage"));
const PoliticsGlobalEventsPage = lazy(() => import("./pages/PoliticsGlobalEventsPage"));
const CareerAstrology2026Page = lazy(() => import("./pages/CareerAstrology2026Page"));
const VedicInputPage = lazy(() => import("./pages/VedicInputPage"));
const VedicResultsPage = lazy(() => import("./pages/VedicResultsPage"));
const VedicPaymentSuccessPage = lazy(() => import("./pages/VedicPaymentSuccessPage"));
const VedicAstrologyExplainedPage = lazy(() => import("./pages/VedicAstrologyExplainedPage"));
const VedicProfilePage = lazy(() => import("./pages/VedicProfilePage"));
const WeeklyInputPage = lazy(() => import("./pages/WeeklyInputPage"));
const WeeklyResultsPage = lazy(() => import("./pages/WeeklyResultsPage"));
const YearlyForecastPage = lazy(() => import("./pages/YearlyForecastPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BackgroundPage = lazy(() => import("./pages/BackgroundPage"));
const LifeArcPage = lazy(() => import("./pages/LifeArcPage"));
const HowToReadChartPage = lazy(() => import("./pages/HowToReadChartPage"));
const VedicVsWesternPage = lazy(() => import("./pages/VedicVsWesternPage"));
const BirthChartPage = lazy(() => import("./pages/BirthChartPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const BlogCategoryPage = lazy(() => import("./pages/BlogCategoryPage"));

// Blog / Nakshatra pages
const WhatIsNakshatraPage = lazy(() => import("./pages/WhatIsNakshatraPage"));
const RohiniNakshatraPage = lazy(() => import("./pages/RohiniNakshatraPage"));
const MrigashiraNakshatraPage = lazy(() => import("./pages/MrigashiraNakshatraPage"));
const AshwiniNakshatraPage = lazy(() => import("./pages/AshwiniNakshatraPage"));
const BharaniNakshatraPage = lazy(() => import("./pages/BharaniNakshatraPage"));
const KrittikaNakshatraPage = lazy(() => import("./pages/KrittikaNakshatraPage"));
const ArdraNakshatraPage = lazy(() => import("./pages/ArdraNakshatraPage"));
const PunarvasuNakshatraPage = lazy(() => import("./pages/PunarvasuNakshatraPage"));
const PushyaNakshatraPage = lazy(() => import("./pages/PushyaNakshatraPage"));
const AshleshaNakshatraPage = lazy(() => import("./pages/AshleshaNakshatraPage"));
const MaghaNakshatraPage = lazy(() => import("./pages/MaghaNakshatraPage"));
const PurvaPhalguniNakshatraPage = lazy(() => import("./pages/PurvaPhalguniNakshatraPage"));
const UttaraPhalguniNakshatraPage = lazy(() => import("./pages/UttaraPhalguniNakshatraPage"));
const HastaNakshatraPage = lazy(() => import("./pages/HastaNakshatraPage"));
const ChitraNakshatraPage = lazy(() => import("./pages/ChitraNakshatraPage"));
const SwatiNakshatraPage = lazy(() => import("./pages/SwatiNakshatraPage"));
const PurvaBhadrapadaNakshatraPage = lazy(() => import("./pages/PurvaBhadrapadaNakshatraPage"));
const UttaraBhadrapadaNakshatraPage = lazy(() => import("./pages/UttaraBhadrapadaNakshatraPage"));
const VishakhaNakshatraPage = lazy(() => import("./pages/VishakhaNakshatraPage"));
const AnuradhaNakshatraPage = lazy(() => import("./pages/AnuradhaNakshatraPage"));
const JyeshthaNakshatraPage = lazy(() => import("./pages/JyeshthaNakshatraPage"));
const MulaNakshatraPage = lazy(() => import("./pages/MulaNakshatraPage"));
const RevatiNakshatraPage = lazy(() => import("./pages/RevatiNakshatraPage"));
const ShravanaNakshatraPage = lazy(() => import("./pages/ShravanaNakshatraPage"));
const DhanishtaNakshatraPage = lazy(() => import("./pages/DhanishtaNakshatraPage"));
const ShatabhishaNakshatraPage = lazy(() => import("./pages/ShatabhishaNakshatraPage"));
const PurvaAshadhaNakshatraPage = lazy(() => import("./pages/PurvaAshadhaNakshatraPage"));
const UttaraAshadhaNakshatraPage = lazy(() => import("./pages/UttaraAshadhaNakshatraPage"));
const PlanetaryPeriodsDashasPage = lazy(() => import("./pages/PlanetaryPeriodsDashasPage"));
const TwelveHousesPage = lazy(() => import("./pages/TwelveHousesPage"));

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

const PageLoader = () => (
  <div className="min-h-screen bg-midnight flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
          <Route path="/blog/shravana-nakshatra" element={<ShravanaNakshatraPage />} />
          <Route path="/blog/dhanishta-nakshatra" element={<DhanishtaNakshatraPage />} />
          <Route path="/blog/shatabhisha-nakshatra" element={<ShatabhishaNakshatraPage />} />
          <Route path="/blog/purva-ashadha-nakshatra" element={<PurvaAshadhaNakshatraPage />} />
          <Route path="/blog/uttara-ashadha-nakshatra" element={<UttaraAshadhaNakshatraPage />} />
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
          </Suspense>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
