import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Loading fallback
const PageLoader = () => (
  <Box
    sx={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress sx={{ color: 'secondary.main' }} />
  </Box>
);

// === Public Pages (lazy loaded) ===
const Home = lazy(() => import('../pages/public/Home'));
const PropertyListing = lazy(() => import('../pages/public/PropertyListing'));
const PropertyDetail = lazy(() => import('../pages/public/PropertyDetail'));
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
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* === Public Routes === */}
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<PropertyListing />} />
        <Route path="/properties/:slug" element={<PropertyDetail />} />

        {/* Buy sub-routes */}
        <Route path="/buy/pre-launch" element={<PreLaunch />} />
        <Route path="/buy/under-construction" element={<UnderConstruction />} />
        <Route path="/buy/ready-to-move" element={<ReadyToMove />} />

        {/* Rent sub-routes */}
        <Route path="/rent/apartments" element={<RentApartments />} />
        <Route path="/rent/villas" element={<RentVillas />} />

        {/* Buyer Assistance sub-routes */}
        <Route path="/buyer-assistance/home-loan" element={<HomeLoan />} />
        <Route path="/buyer-assistance/legal-assistance" element={<LegalAssistance />} />
        <Route path="/buyer-assistance/interior-designing" element={<InteriorDesigning />} />

        {/* Insights sub-routes */}
        <Route path="/insights/articles" element={<Articles />} />
        <Route path="/insights/articles/:slug" element={<ArticleDetail />} />
        <Route path="/insights/faqs" element={<FAQs />} />
        <Route path="/insights/real-estate-awareness" element={<RealEstateAwareness />} />

        {/* Other public pages */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/sell-let" element={<SellLet />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/partnership" element={<Partnership />} />

        {/* === Admin Routes === */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/properties" element={<AdminProperties />} />
        <Route path="/admin/properties/add" element={<AddProperty />} />
        <Route path="/admin/properties/edit/:id" element={<EditProperty />} />
        <Route path="/admin/leads" element={<AdminLeads />} />
        <Route path="/admin/leads/:id" element={<LeadDetail />} />
        <Route path="/admin/seo" element={<AdminSeo />} />
        <Route path="/admin/articles" element={<AdminArticles />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
