import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuoteFormProvider } from "@/contexts/QuoteFormContext";
import { EmailConfirmationHandler } from "@/components/EmailConfirmationHandler";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import VendorDashboard from "./pages/VendorDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Tickets from "./pages/Tickets";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import AcceptableUse from "./pages/AcceptableUse";
import ResetPassword from "./pages/ResetPassword";
import QuotesHistory from "./pages/QuotesHistory";
import PaymentBilling from "./pages/PaymentBilling";
import { RoleGuard } from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <QuoteFormProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter 
            future={{ 
              v7_startTransition: true, 
              v7_relativeSplatPath: true 
            }}
          >
            <EmailConfirmationHandler />
            <div className="min-h-screen flex flex-col">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/*" element={
                  <>
                    <Header />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/cookies" element={<Cookies />} />
                        <Route path="/acceptable-use" element={<AcceptableUse />} />
                        <Route path="/dashboard" element={
                          <RoleGuard allowedUserTypes={['client']}>
                            <Dashboard />
                          </RoleGuard>
                        } />
                        <Route path="/vendor-dashboard" element={
                          <RoleGuard allowedUserTypes={['vendor']}>
                            <VendorDashboard />
                          </RoleGuard>
                        } />
                        <Route path="/profile" element={
                          <RoleGuard allowedUserTypes={['client', 'vendor']}>
                            <Profile />
                          </RoleGuard>
                        } />
                        <Route path="/tickets" element={
                          <RoleGuard allowedUserTypes={['client']}>
                            <Tickets />
                          </RoleGuard>
                        } />
                        <Route path="/quotes-history" element={
                          <RoleGuard allowedUserTypes={['client']}>
                            <QuotesHistory />
                          </RoleGuard>
                        } />
                        <Route path="/payment-billing" element={
                          <RoleGuard allowedUserTypes={['client', 'vendor']}>
                            <PaymentBilling />
                          </RoleGuard>
                        } />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                } />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QuoteFormProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;