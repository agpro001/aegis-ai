import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Sentinels from "./pages/Sentinels";
import BlackBox from "./pages/BlackBox";
import AiChat from "./pages/AiChat";
import SettingsPage from "./pages/SettingsPage";
import DemoPage from "./pages/DemoPage";
import AlertsPage from "./pages/AlertsPage";
import ThreatMap from "./pages/ThreatMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sentinels" element={<Sentinels />} />
              <Route path="/blackbox" element={<BlackBox />} />
              <Route path="/chat" element={<AiChat />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/threat-map" element={<ThreatMap />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
