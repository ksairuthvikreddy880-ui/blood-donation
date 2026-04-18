import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { isProfileComplete } from "@/lib/eligibility";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BloodRequests from "./pages/BloodRequests";
import BloodCentres from "./pages/BloodCentres";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import CompleteProfile from "./pages/CompleteProfile";
import FindDonors from "./pages/FindDonors";
import HospitalLogin from "./pages/HospitalLogin";
import HospitalDashboard from "./pages/HospitalDashboard";
import DonateBlood from "./pages/DonateBlood";
import RequestDetail from "./pages/RequestDetail";
import BloodExchange from "./pages/BloodExchange";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="loader"><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/></div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;

  // If profile is loaded and incomplete, redirect to complete-profile
  // (skip if already on /complete-profile or /profile to avoid loops)
  const skipCheck = ["/complete-profile", "/profile"].includes(location.pathname);
  if (!skipCheck && profile && !isProfileComplete(profile)) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/find-donors" element={<ProtectedRoute><FindDonors /></ProtectedRoute>} />
            <Route path="/hospital-login" element={<HospitalLogin />} />
            <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
            <Route path="/donate-blood" element={<ProtectedRoute><DonateBlood /></ProtectedRoute>} />
            <Route path="/request/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
            <Route path="/blood-requests" element={<ProtectedRoute><BloodRequests /></ProtectedRoute>} />
            <Route path="/blood-centres" element={<ProtectedRoute><BloodCentres /></ProtectedRoute>} />
            <Route path="/blood-exchange" element={<ProtectedRoute><BloodExchange /></ProtectedRoute>} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
