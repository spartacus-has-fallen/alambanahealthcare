import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, BrainCircuit, Calendar, FileHeart, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const LandingPage = () => {
  const specialties = [
    { name: 'Ayurveda', icon: '🌿' },
    { name: 'Allopathy', icon: '💊' },
    { name: 'Nutrition', icon: '🥗' },
    { name: 'Cardiology', icon: '❤️' },
    { name: 'Dermatology', icon: '🧔' },
    { name: 'Mental Health', icon: '🧠' },
  ];

  const features = [
    {
      icon: <Stethoscope className="h-8 w-8 text-primary" />,
      title: 'Verified Doctors',
      description: 'Connect with licensed healthcare professionals across multiple specialties'
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: 'AI Health Assistant',
      description: 'Get instant preliminary health assessments powered by advanced AI'
    },
    {
      icon: <FileHeart className="h-8 w-8 text-primary" />,
      title: 'Health Records',
      description: 'Track vitals, upload reports, and maintain complete health history'
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: 'Easy Booking',
      description: 'Schedule online consultations or offline appointments seamlessly'
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: 'Data Security',
      description: 'Your health data is encrypted and stored with bank-level security'
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'Referral Rewards',
      description: 'Earn points by referring friends and redeem for health services'
    },
  ];

  const howItWorks = [
    { step: 1, title: 'Create Account', description: 'Sign up in seconds with basic details' },
    { step: 2, title: 'Find Doctor', description: 'Search by specialty or use AI symptom checker' },
    { step: 3, title: 'Book Consultation', description: 'Choose online or offline appointment' },
    { step: 4, title: 'Get Care', description: 'Receive prescription and track health records' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4" data-testid="hero-section">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
                Your Health,
                <span className="text-primary"> Simplified</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                AI-integrated multi-specialty healthcare platform connecting you with verified doctors. 
                Consultations, health records, and AI assessments in one secure ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" data-testid="hero-cta-register">
                  <Button className="h-12 px-8 rounded-full bg-primary text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/ai-checker" data-testid="hero-cta-ai-checker">
                  <Button variant="outline" className="h-12 px-8 rounded-full border-primary text-primary hover:bg-primary/5">
                    Try AI Symptom Checker
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span>Free Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span>Verified Doctors</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBkb2N0b3IlMjBjb25zdWx0YXRpb24lMjBwYXRpZW50fGVufDB8fHx8MTc3MjE3MjcyNXww&ixlib=rb-4.1.0&q=85"
                alt="Professional Indian Doctor"
                className="rounded-2xl shadow-2xl w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white" data-testid="features-section">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Comprehensive Healthcare Platform</h2>
            <p className="text-slate-600 text-lg">Everything you need for better health in one place</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-8 card-hover border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300" data-testid={`feature-card-${idx}`}>
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16 px-4" data-testid="specialties-section">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Multi-Specialty Care</h2>
            <p className="text-slate-600 text-lg">Expert doctors across various medical fields</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((specialty, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 text-center card-hover border border-slate-100" data-testid={`specialty-${idx}`}>
                <div className="text-4xl mb-3">{specialty.icon}</div>
                <p className="font-medium text-slate-700">{specialty.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white" data-testid="how-it-works-section">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">How It Works</h2>
            <p className="text-slate-600 text-lg">Get started in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="text-center" data-testid={`step-${idx}`}>
                <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-sky-500 text-white" data-testid="cta-section">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Healthcare Experience?</h2>
          <p className="text-lg mb-8 text-white/90">Join thousands of users trusting Alambana Healthcare</p>
          <Link to="/register" data-testid="cta-register">
            <Button size="lg" className="h-14 px-10 rounded-full bg-white text-primary hover:bg-slate-50 font-bold">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
