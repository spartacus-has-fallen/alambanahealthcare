import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';

// Pages
import LandingPage from '@/pages/LandingPage';
import AboutPage from '@/pages/AboutPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import DisclaimerPage from '@/pages/DisclaimerPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import PatientDashboard from '@/pages/PatientDashboard';
import DoctorDashboard from '@/pages/DoctorDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import DoctorSearch from '@/pages/DoctorSearch';
import AISymptomChecker from '@/pages/AISymptomChecker';
import HealthRecords from '@/pages/HealthRecords';
import ReferralPage from '@/pages/ReferralPage';
import BlogPage from '@/pages/BlogPage';
import IntegrationControlPanel from '@/pages/IntegrationControlPanel';
import ContactPage from '@/pages/ContactPage';

// Components
import WhatsAppButton from '@/components/WhatsAppButton';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/ai-checker" element={<AISymptomChecker />} />
          
          {/* Protected Routes */}
          <Route path="/patient/dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/doctors" element={<ProtectedRoute><DoctorSearch /></ProtectedRoute>} />
          <Route path="/health-records" element={<ProtectedRoute><HealthRecords /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
          <Route path="/admin/integrations" element={<ProtectedRoute><IntegrationControlPanel /></ProtectedRoute>} />
        </Routes>
        
        <WhatsAppButton />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
