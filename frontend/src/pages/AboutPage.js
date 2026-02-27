import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12">
        <h1 className="text-4xl font-bold mb-6">About Us</h1>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <p className="text-lg text-slate-700 leading-relaxed">
            Alambana Healthcare is a digital healthcare initiative by <strong>Sejal Engitech Pvt Ltd</strong>. 
            We aim to simplify healthcare access through secure technology, AI-driven symptom analysis, 
            verified doctors, and structured health record management.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Platform</h2>
          <p className="text-slate-700 leading-relaxed">
            Our platform allows patients to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Book online and offline consultations</li>
            <li>Maintain weekly and monthly health reports</li>
            <li>Track weight, BP, oxygen, sugar levels</li>
            <li>Upload blood reports</li>
            <li>Use AI-based self health assessment</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="text-slate-700 leading-relaxed">
            To provide accessible, technology-driven, and reliable healthcare solutions to every individual.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
          <p className="text-slate-700 leading-relaxed">
            To build a trusted digital healthcare ecosystem integrating doctors, AI, and personal health data management.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Core Values</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Trust:</strong> Building confidence through transparent practices</li>
            <li><strong>Transparency:</strong> Clear communication at every step</li>
            <li><strong>Innovation:</strong> Leveraging technology for better healthcare</li>
            <li><strong>Patient Data Security:</strong> Your health data is protected with the highest standards</li>
            <li><strong>Ethical Healthcare Technology:</strong> Responsible use of AI and digital tools</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Focus</h2>
          <p className="text-slate-700 leading-relaxed">
            We focus on bridging the gap between patients and qualified healthcare professionals through 
            innovation and responsible technology. Whether you need a consultation, want to track your health, 
            or need an AI-powered preliminary assessment, Alambana Healthcare is here for you.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
