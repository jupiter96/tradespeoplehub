import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import HowItWorkProPage from "./components/HowItWorkProPage";
import HowItWorkPage from "./components/HowItWorkPage";
import ServicesPage from "./components/ServicesPage";
import ServiceDetailPage from "./components/ServiceDetailPage";
import ProfilePage from "./components/ProfilePage";
import CartPage from "./components/CartPage";
import LoginPage from "./components/LoginPage";
import AccountPage from "./components/AccountPage";
import ProfessionalProfileSetup from "./components/ProfessionalProfileSetup";
import ProfessionalAboutService from "./components/ProfessionalAboutService";
import ProfessionalRegistrationSteps from "./components/ProfessionalRegistrationSteps";
import PostJobPage from "./components/PostJobPage";
import JobDetailPage from "./components/JobDetailPage";
import AllCategoriesPage from "./components/AllCategoriesPage";
import SectorPage from "./components/SectorPage";
import DisputeDiscussionPage from "./components/DisputeDiscussionPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminDashboardPage from "./components/AdminDashboardPage";
import { CartProvider } from "./components/CartContext";
import { AccountProvider, useAccount } from "./components/AccountContext";
import { JobsProvider } from "./components/JobsContext";
import { MessengerProvider } from "./components/MessengerContext";
import { OrdersProvider } from "./components/OrdersContext";
import FloatingMessenger from "./components/FloatingMessenger";
import { Toaster } from "./components/ui/sonner";

function AppContent() {
  const { isLoggedIn } = useAccount();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/service/:id" element={<ServiceDetailPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/all-categories" element={<AllCategoriesPage />} />
        <Route path="/sector/:sectorSlug" element={<SectorPage />} />
        <Route path="/category/:categorySlug/:subCategorySlug" element={<SectorPage />} />
        <Route path="/category/:categorySlug" element={<SectorPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/professional-setup" element={<ProfessionalProfileSetup />} />
        <Route path="/professional-about" element={<ProfessionalAboutService />} />
        <Route path="/professional-registration-steps" element={<ProfessionalRegistrationSteps />} />
        <Route path="/how-it-work" element={<HowItWorkPage />} />
        <Route path="/how-it-work-pro" element={<HowItWorkProPage />} />
        <Route path="/post-job" element={<PostJobPage />} />
        <Route path="/job/:jobId" element={<JobDetailPage />} />
        <Route path="/disputes/:disputeId" element={<DisputeDiscussionPage />} />
        <Route path="/dispute/:disputeId" element={<DisputeDiscussionPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/:section" element={<AdminDashboardPage />} />
        <Route path="/preview_page.html" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      {isLoggedIn && <FloatingMessenger />}
      <Toaster position="top-right" richColors />
    </>
  );
}

export default function App() {
  return (
    <AccountProvider>
      <JobsProvider>
        <MessengerProvider>
          <OrdersProvider>
            <CartProvider>
              <Router>
                <AppContent />
              </Router>
            </CartProvider>
          </OrdersProvider>
        </MessengerProvider>
      </JobsProvider>
    </AccountProvider>
  );
}