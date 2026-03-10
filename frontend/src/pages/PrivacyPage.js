import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Effective Date: March 10, 2026 &nbsp;·&nbsp; Last Updated: March 10, 2026</p>

        <div className="prose prose-lg max-w-none space-y-6 text-slate-700">

          <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            This Privacy Policy explains how <strong>Sejal Engitech Pvt Ltd</strong> ("Company", "we", "us") collects,
            uses, stores, shares, and protects your personal data when you use Alambana Healthcare. By using the
            platform, you consent to the practices described in this Policy.
          </div>

          {/* 1 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Legal Framework</h2>
            <p>This Policy is compliant with the following Indian laws and regulations:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> — primary data protection law</li>
              <li><strong>Information Technology Act, 2000</strong> — intermediary obligations, data security</li>
              <li><strong>IT (Reasonable Security Practices and SPDI) Rules, 2011</strong> — health data as Sensitive Personal Data</li>
              <li><strong>IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong></li>
              <li><strong>Telemedicine Practice Guidelines, 2020</strong> — for clinical data in telemedicine contexts</li>
              <li><strong>Consumer Protection Act, 2019 &amp; E-Commerce Rules, 2020</strong></li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Data We Collect</h2>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Identity data:</strong> Full name, date of birth, gender</li>
              <li><strong>Contact data:</strong> Email address, phone number</li>
              <li><strong>Health data (Sensitive Personal Data):</strong> Symptoms, medical history, vital signs (BP, blood sugar, oxygen saturation, heart rate, weight), uploaded medical reports, consultation notes, prescriptions, AI assessment results</li>
              <li><strong>Professional data (Doctors):</strong> Medical registration number, qualifications, specialization, bank account details for payouts</li>
              <li><strong>Payment data:</strong> Transaction IDs, payment status (we do not store card/UPI credentials — processed by Razorpay)</li>
              <li><strong>User-generated content:</strong> Blog posts, reviews, ratings, questions, grievance submissions</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Automatically Collected Data</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>IP address, browser type, device type, operating system</li>
              <li>Pages visited, time spent, clickstream data</li>
              <li>Cookies and similar tracking technologies (see Section 8)</li>
              <li>Log data (access times, errors, API usage)</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.3 Data We Do NOT Collect</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Credit/debit card numbers or CVV (handled entirely by Razorpay)</li>
              <li>Biometric data</li>
              <li>Precise real-time GPS location (unless voluntarily provided)</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Sensitive Personal Data — Health Information</h2>
            <p>
              Health data constitutes <strong>Sensitive Personal Data or Information (SPDI)</strong> under the IT (SPDI) Rules, 2011
              and is a special category under the DPDP Act, 2023. We handle it with heightened care:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Health data is collected only with your <strong>explicit informed consent</strong>.</li>
              <li>Health data is accessible only to you, the consulting doctor for a specific appointment, and our authorized technical staff under strict access controls.</li>
              <li>We do not sell, rent, or monetize your health data for advertising profiling.</li>
              <li>AI symptom checker inputs are processed by a third-party AI provider (OpenAI) under data processing agreements that prohibit use of your data for model training.</li>
              <li>You may withdraw consent for health data processing at any time by contacting us. Withdrawal may affect your ability to use certain features.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Use Your Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left p-3 border border-slate-200">Purpose</th>
                    <th className="text-left p-3 border border-slate-200">Legal Basis (DPDP Act)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Providing consultation and booking services', 'Performance of contract'],
                    ['Processing payments and settlements', 'Performance of contract'],
                    ['Maintaining electronic health records', 'Explicit consent + legitimate interest'],
                    ['AI-powered symptom assessment', 'Explicit consent'],
                    ['Platform security and fraud prevention', 'Legitimate interest / legal obligation'],
                    ['Sending appointment reminders and service communications', 'Performance of contract'],
                    ['Displaying third-party advertisements (non-personalized based on health data)', 'Legitimate interest'],
                    ['Improving platform features using anonymized analytics', 'Legitimate interest'],
                    ['Compliance with legal obligations and court orders', 'Legal obligation'],
                    ['Grievance resolution and customer support', 'Legal obligation / contract'],
                  ].map(([purpose, basis], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-3 border border-slate-200">{purpose}</td>
                      <td className="p-3 border border-slate-200 text-slate-500 text-xs">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Advertisements &amp; Your Data</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>We display third-party advertisements on the platform. These ads are served based on <strong>contextual factors</strong> (page content, general location) — <strong>not</strong> based on your health data or medical history.</li>
              <li>We do not share your health data with advertisers.</li>
              <li>Advertisers receive aggregated, anonymized metrics (impressions, clicks) only — never individually identifiable data.</li>
              <li>Third-party ad networks, if integrated in the future, will be governed by their own privacy policies, and we will update this section accordingly.</li>
              <li>You may see ads relevant to general health topics based on the page you visit (e.g., doctor search page) without us sharing any personal or health data to enable such targeting.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Sharing</h2>
            <p><strong>We do not sell your personal data. Ever.</strong></p>
            <p className="mt-2">We share your data only in these specific, limited circumstances:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Consulting doctors:</strong> Your appointment details and relevant health information shared with the doctor you book.</li>
              <li><strong>Payment processor (Razorpay):</strong> Transaction data for payment processing. Razorpay is PCI-DSS compliant.</li>
              <li><strong>AI service provider (OpenAI):</strong> Symptom descriptions processed for AI assessment under data processing terms.</li>
              <li><strong>Cloud infrastructure:</strong> Our hosting provider (Railway) for data storage; subject to their data processing terms.</li>
              <li><strong>Legal authorities:</strong> When required by a valid court order, law enforcement request, or to comply with applicable Indian law.</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or asset sale, user data may be transferred. You will be notified 30 days in advance of such transfer.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Retention</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left p-3 border border-slate-200">Data Type</th>
                    <th className="text-left p-3 border border-slate-200">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Account information (active accounts)', 'Duration of account + 3 years'],
                    ['Health records and consultation history', '7 years (medical records standard under Indian law)'],
                    ['Payment records', '8 years (tax/accounting compliance)'],
                    ['AI assessment logs', '1 year'],
                    ['Server and access logs', '90 days'],
                    ['Deleted account data', 'Purged within 90 days of deletion request, except where retention required by law'],
                    ['Grievance records', '3 years after resolution'],
                  ].map(([type, period], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-3 border border-slate-200">{type}</td>
                      <td className="p-3 border border-slate-200 text-slate-500 text-xs">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies &amp; Tracking</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Essential cookies:</strong> Required for login sessions, security, and basic functionality. Cannot be disabled.</li>
              <li><strong>Analytics cookies:</strong> Used to understand how users interact with the platform (aggregated, anonymous). You may opt out via browser settings.</li>
              <li><strong>No advertising tracking cookies:</strong> We do not use cookies to track your behavior across other websites for advertising purposes.</li>
              <li>You can manage cookie preferences in your browser. Disabling essential cookies will impair platform functionality.</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Data Security</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Passwords are hashed using bcrypt (never stored in plain text).</li>
              <li>All data transmission uses TLS/HTTPS encryption.</li>
              <li>Access to health data is role-based and logged.</li>
              <li>We conduct periodic security reviews of our infrastructure.</li>
              <li>In the event of a data breach affecting your personal data, we will notify you and the relevant authorities within 72 hours of discovery, as required under applicable law.</li>
              <li>Despite best efforts, no system is 100% secure. You use the platform at your own risk regarding network-level security.</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Children's Privacy</h2>
            <p>
              The platform is not directed at children under 18. Under the DPDP Act, 2023, processing personal data of
              children requires verifiable parental consent. If you are a parent or guardian and believe your minor child
              has registered without consent, please contact us immediately at the address below and we will delete the
              data promptly.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Your Rights (Data Principal Rights under DPDP Act)</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of personal data we hold about you.</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your account and associated data (subject to legal retention obligations).</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for specific processing activities without affecting prior lawful processing.</li>
              <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint with our Data Protection Officer.</li>
              <li><strong>Right to Nominate:</strong> Under the DPDP Act, nominate another individual to exercise your data rights in the event of death or incapacity.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email: <a href="mailto:privacy@alambanahealthcare.com" className="text-primary hover:underline">privacy@alambanahealthcare.com</a>.
              We will respond within <strong>30 days</strong>. Identity verification may be required.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Data Protection Officer / Grievance Officer</h2>
            <div className="p-4 bg-slate-100 rounded-lg text-sm">
              <p><strong>Data Protection &amp; Grievance Officer</strong></p>
              <p>Sejal Engitech Pvt Ltd</p>
              <p>Email: <a href="mailto:privacy@alambanahealthcare.com" className="text-primary hover:underline">privacy@alambanahealthcare.com</a></p>
              <p>Phone: 8084161465</p>
              <p className="text-slate-500 mt-1">Grievances under the IT Act / DPDP Act will be acknowledged within 24 hours and addressed within 30 days.</p>
            </div>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Cross-Border Data Transfers</h2>
            <p>
              Some of our service providers (including OpenAI for AI processing) may process your data outside India.
              Such transfers occur only to countries notified by the Indian Government as having adequate data protection
              standards, or under Standard Contractual Clauses ensuring equivalent protection. Health data is stored
              within India on Railway infrastructure.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Changes to This Policy</h2>
            <p>
              We will notify you of material changes to this Privacy Policy via email or platform notice at least
              <strong> 15 days before</strong> changes take effect. Continued use after the effective date constitutes acceptance.
              Archived versions of this policy are available on request.
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
