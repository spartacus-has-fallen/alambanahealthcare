import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <p className="text-8xl font-extrabold text-primary mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>404</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Page not found</h1>
        <p className="text-slate-500 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate('/')}
            className="rounded-full px-8"
            data-testid="go-home-button"
          >
            Go Home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-full px-8"
            data-testid="go-back-button"
          >
            Go Back
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFoundPage;
