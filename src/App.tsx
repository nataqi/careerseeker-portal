
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthVerify from "./pages/AuthVerify";
import AuthResetPassword from "./pages/AuthResetPassword";
import Search from "./pages/Search";
import SavedJobs from "./pages/SavedJobs";
import Tracker from "./pages/Tracker";
import NotFound from "./pages/NotFound";
import CvTailoring from "./pages/CvTailoring";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/verify" element={<AuthVerify />} />
            <Route path="/auth/reset-password" element={<Auth />} />
            <Route path="/auth/reset-confirmation" element={<AuthResetPassword />} />
            <Route path="/search" element={<Search />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/cv-tailoring" element={<CvTailoring />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
