import React from 'react';
import { AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const DisclaimerPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12">
        <div className="flex items-center gap-4 mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h1 className="text-4xl font-bold">Medical Disclaimer</h1>
        </div>
        
        <div className="prose prose-lg max-w-none space-y-6 text-slate-700">
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-lg font-semibold text-red-700 mb-4">
              IMPORTANT: Please Read Carefully
            </p>
            <p className="text-red-600">
              The information provided on Alambana Healthcare is for general informational and educational purposes only. 
              It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">No Professional Medical Advice</h2>
            <p>
              The platform does not replace professional medical advice from qualified healthcare providers. 
              Always seek the advice of your physician or other qualified health provider with any questions 
              you may have regarding a medical condition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">AI Assessments Are Informational Only</h2>
            <p>
              Our AI-powered symptom checker provides preliminary health information based on the symptoms you describe. 
              This is NOT a medical diagnosis. The AI assessment:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Cannot replace a doctor's examination</li>
              <li>May not account for your complete medical history</li>
              <li>Should not be used for self-diagnosis or self-treatment</li>
              <li>Is based on general medical knowledge, not your specific case</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">No Diagnosis Guarantee</h2>
            <p>
              Neither the platform nor the doctors providing consultations guarantee specific diagnoses or outcomes. 
              Medical conditions can vary significantly between individuals, and diagnostic accuracy depends on many factors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">In Case of Emergency</h2>
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="font-semibold text-red-700 mb-2">MEDICAL EMERGENCY:</p>
              <p className="text-red-600">
                If you are experiencing a medical emergency, do NOT use this platform. 
                Call emergency services immediately or go to the nearest hospital emergency room.
              </p>
            </div>
            <p className="mt-4">
              Medical emergencies include but are not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Severe chest pain or difficulty breathing</li>
              <li>Severe bleeding or trauma</li>
              <li>Loss of consciousness</li>
              <li>Severe allergic reactions</li>
              <li>Signs of stroke (sudden numbness, confusion, vision problems)</li>
              <li>Severe abdominal pain</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Doctor Opinions Are Independent</h2>
            <p>
              Opinions and advice provided by doctors on this platform are their independent professional views. 
              Alambana Healthcare does not endorse or guarantee any specific medical opinions, treatments, or outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Medication and Treatment Disclaimer</h2>
            <p>
              Never disregard professional medical advice or delay seeking it because of information you read on this platform. 
              Do not start, stop, or change any medications or treatments without consulting your healthcare provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Use at Your Own Risk</h2>
            <p>
              You understand and agree that you use this platform and its services at your own risk. 
              The platform, its operators, and affiliated doctors are not liable for any adverse outcomes 
              resulting from the use of information or services provided.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Acknowledgment</h2>
            <p>
              By using Alambana Healthcare, you acknowledge that you have read, understood, and agreed to this medical disclaimer. 
              You accept full responsibility for your health decisions and agree to consult with qualified healthcare 
              professionals for medical advice and treatment.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DisclaimerPage;
