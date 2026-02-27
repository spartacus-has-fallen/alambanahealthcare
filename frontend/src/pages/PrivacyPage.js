import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-slate-700">
          <p className="text-sm text-slate-500">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Personal information: Name, email address, phone number</li>
              <li>Health data: Medical history, symptoms, vital signs, blood reports</li>
              <li>Consultation records and prescriptions</li>
              <li>Payment information through secure payment gateways</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>Your information is used for:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Providing healthcare services and consultations</li>
              <li>AI-powered health assessments</li>
              <li>Maintaining your health records</li>
              <li>Processing payments</li>
              <li>Improving our services</li>
              <li>Communication regarding appointments and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Storage and Security</h2>
            <p>
              All health data is stored with encryption and protected with industry-standard security measures. 
              We implement strict access controls to ensure only authorized personnel can access sensitive information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Sharing Policy</h2>
            <p><strong>We do NOT sell your personal health data.</strong></p>
            <p>We may share your information only in the following cases:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>With healthcare professionals you consult</li>
              <li>With payment gateway providers for transaction processing</li>
              <li>When required by law or legal process</li>
              <li>To protect rights, safety, and security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Third-Party Integrations</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Payment gateways (Razorpay) for secure transactions</li>
              <li>Analytics tools to improve user experience</li>
              <li>AI services for symptom assessment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies</h2>
            <p>
              We use cookies to enhance your experience, maintain session information, and analyze platform usage. 
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access your personal and health data</li>
              <li>Update or correct your information</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent for data processing</li>
              <li>Download your health records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Compliance</h2>
            <p>
              We comply with applicable Indian IT laws and regulations, including the Information Technology Act, 2000 
              and related rules concerning data protection and privacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact for Privacy Concerns</h2>
            <p>For any privacy-related queries or concerns, please contact us at:</p>
            <p className="mt-2">
              Email: <a href="mailto:privacy@alambana.health" className="text-primary hover:underline">privacy@alambana.health</a><br />
              Phone: 8084161465
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this privacy policy at any time. Changes will be posted on this page 
              with an updated revision date.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
