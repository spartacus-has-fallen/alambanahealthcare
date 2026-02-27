import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12">
        <h1 className="text-4xl font-bold mb-6">Terms & Conditions</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-slate-700">
          <p className="text-sm text-slate-500">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Platform Usage Rules</h2>
            <p>By using Alambana Healthcare, you agree to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide accurate and truthful information</li>
              <li>Use the platform for lawful purposes only</li>
              <li>Respect the privacy of other users and healthcare professionals</li>
              <li>Not misuse or abuse the platform services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. User Account Responsibility</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Doctor Verification Process</h2>
            <p>
              All doctors on our platform undergo a verification process including license validation. 
              However, we do not independently verify their medical qualifications or practice standards beyond registration requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Consultation Fee Policy</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Consultation fees are set by individual doctors</li>
              <li>Payment must be completed before the consultation</li>
              <li>Fees are non-refundable once the consultation is completed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Refund Policy</h2>
            <p>Refunds will be processed in the following cases:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Doctor cancels the appointment</li>
              <li>Technical issues prevent the consultation</li>
              <li>Duplicate payment made by error</li>
            </ul>
            <p>Refunds will be processed within 7-10 business days to the original payment method.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              Alambana Healthcare acts as a platform connecting patients and doctors. We are not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Medical advice, diagnosis, or treatment provided by doctors</li>
              <li>Outcomes of consultations or treatments</li>
              <li>Doctor-patient disputes</li>
              <li>Any damages arising from use of the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. AI Assessment Limitations</h2>
            <p>
              Our AI symptom checker is for informational purposes only and should not be considered as medical advice, 
              diagnosis, or treatment. Always consult with a qualified healthcare professional for medical concerns.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Intellectual Property Rights</h2>
            <p>
              All content, trademarks, and intellectual property on this platform are owned by Sejal Engitech Pvt Ltd. 
              Unauthorized use, reproduction, or distribution is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Governing Law</h2>
            <p>
              These terms are governed by the laws of India. Any disputes will be subject to the exclusive 
              jurisdiction of courts in [Your City], India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Modification Rights</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform after 
              changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Information</h2>
            <p>For questions about these terms, contact us at:</p>
            <p className="mt-2">
              Email: <a href="mailto:support@alambana.health" className="text-primary hover:underline">support@alambana.health</a><br />
              Phone: 8084161465
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
