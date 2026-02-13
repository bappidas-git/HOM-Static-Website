import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from '../components/admin/ProtectedRoute';
import { PageLoader } from '../components/common/SkeletonLoaders';

// === Public Pages (lazy loaded) ===
const Home = lazy(() => import('../pages/public/Home'));
const PropertyListing = lazy(() => import('../pages/public/PropertyListing'));
const PropertyDetail = lazy(() => import('../pages/public/PropertyDetails'));
const PreLaunch = lazy(() => import('../pages/public/PreLaunch'));
const UnderConstruction = lazy(() => import('../pages/public/UnderConstruction'));
const ReadyToMove = lazy(() => import('../pages/public/ReadyToMove'));
const RentApartments = lazy(() => import('../pages/public/RentApartments'));
const RentVillas = lazy(() => import('../pages/public/RentVillas'));
const HomeLoan = lazy(() => import('../pages/public/HomeLoan'));
const LegalAssistance = lazy(() => import('../pages/public/LegalAssistance'));
const InteriorDesigning = lazy(() => import('../pages/public/InteriorDesigning'));
const Articles = lazy(() => import('../pages/public/Articles'));
const ArticleDetail = lazy(() => import('../pages/public/ArticleDetail'));
const FAQs = lazy(() => import('../pages/public/FAQs'));
const RealEstateAwareness = lazy(() => import('../pages/public/RealEstateAwareness'));
const Contact = lazy(() => import('../pages/public/Contact'));
const About = lazy(() => import('../pages/public/About'));
const SellLet = lazy(() => import('../pages/public/SellLet'));
const Careers = lazy(() => import('../pages/public/Careers'));
const Partnership = lazy(() => import('../pages/public/Partnership'));
const NotFound = lazy(() => import('../pages/public/NotFound'));

// === Admin Pages (lazy loaded) ===
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminProperties = lazy(() => import('../pages/admin/AdminProperties'));
const AddProperty = lazy(() => import('../pages/admin/AddProperty'));
const EditProperty = lazy(() => import('../pages/admin/EditProperty'));
const AdminLeads = lazy(() => import('../pages/admin/AdminLeads'));
const LeadDetail = lazy(() => import('../pages/admin/LeadDetail'));
const AdminSeo = lazy(() => import('../pages/admin/AdminSeo'));
const AdminArticles = lazy(() => import('../pages/admin/AdminArticles'));
const ArticleForm = lazy(() => import('../pages/admin/ArticleForm'));
const FaqManager = lazy(() => import('../pages/admin/FaqManager'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));

// Public layout wrapper
const PublicRoute = ({ children }) => (
  <MainLayout>{children}</MainLayout>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* === Public Routes (wrapped in MainLayout) === */}
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/properties" element={<PublicRoute><PropertyListing /></PublicRoute>} />
        <Route path="/properties/:slug" element={<PublicRoute><PropertyDetail /></PublicRoute>} />

        {/* Buy sub-routes */}
        <Route path="/buy/pre-launch" element={<PublicRoute><PreLaunch /></PublicRoute>} />
        <Route path="/buy/under-construction" element={<PublicRoute><UnderConstruction /></PublicRoute>} />
        <Route path="/buy/ready-to-move" element={<PublicRoute><ReadyToMove /></PublicRoute>} />

        {/* Rent sub-routes */}
        <Route path="/rent/apartments" element={<PublicRoute><RentApartments /></PublicRoute>} />
        <Route path="/rent/villas" element={<PublicRoute><RentVillas /></PublicRoute>} />

        {/* Buyer Assistance sub-routes */}
        <Route path="/buyer-assistance/home-loan" element={<PublicRoute><HomeLoan /></PublicRoute>} />
        <Route path="/buyer-assistance/legal-assistance" element={<PublicRoute><LegalAssistance /></PublicRoute>} />
        <Route path="/buyer-assistance/interior-designing" element={<PublicRoute><InteriorDesigning /></PublicRoute>} />

        {/* Insights sub-routes */}
        <Route path="/insights/articles" element={<PublicRoute><Articles /></PublicRoute>} />
        <Route path="/insights/articles/:slug" element={<PublicRoute><ArticleDetail /></PublicRoute>} />
        <Route path="/insights/faqs" element={<PublicRoute><FAQs /></PublicRoute>} />
        <Route path="/insights/real-estate-awareness" element={<PublicRoute><RealEstateAwareness /></PublicRoute>} />

        {/* Other public pages */}
        <Route path="/contact" element={<PublicRoute><Contact /></PublicRoute>} />
        <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
        <Route path="/sell-let" element={<PublicRoute><SellLet /></PublicRoute>} />
        <Route path="/careers" element={<PublicRoute><Careers /></PublicRoute>} />
        <Route path="/partnership" element={<PublicRoute><Partnership /></PublicRoute>} />

        {/* === Admin Routes === */}
        {/* Login — no layout, no auth required */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes — wrapped in AdminLayout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/add" element={<AddProperty />} />
          <Route path="properties/edit/:id" element={<EditProperty />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="seo" element={<AdminSeo />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="articles/add" element={<ArticleForm />} />
          <Route path="articles/edit/:id" element={<ArticleForm />} />
          <Route path="faqs" element={<FaqManager />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<PublicRoute><NotFound /></PublicRoute>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
