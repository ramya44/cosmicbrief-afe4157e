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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirect helper for legacy non-hash URLs (e.g., /results?forecastId=... or /?forecastId=...)
// This runs once on app load to handle cases where users have old bookmarks or the 404.html redirect
const LegacyUrlRedirectHelper = () => {
  useEffect(() => {
    // Only run on initial page load, not within hash router
    if (window.location.hash) return;

    const params = new URLSearchParams(window.location.search);
    const forecastId = params.get('forecastId') || params.get('id');
    const guestToken = params.get('guestToken') || params.get('guest_token');

    // If we have forecast params on the root or a non-hash path, redirect to hash route
    if (forecastId) {
      const tokenPart = guestToken ? `&guestToken=${encodeURIComponent(guestToken)}` : '';
      const hashUrl = `${window.location.origin}/#/results?forecastId=${encodeURIComponent(forecastId)}${tokenPart}`;
      window.location.replace(hashUrl);
      return;
    }

    // Check for SPA redirect from 404.html
    const savedPath = sessionStorage.getItem('spa_redirect');
    if (savedPath) {
      sessionStorage.removeItem('spa_redirect');
      // Convert path like /results?forecastId=... to hash format
      const hashPath = `/#${savedPath}`;
      window.location.replace(window.location.origin + hashPath);
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
