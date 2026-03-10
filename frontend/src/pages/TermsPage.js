import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12">
        <h1 className="text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-slate-500 mb-8">Effective Date: March 10, 2026 &nbsp;·&nbsp; Last Updated: March 10, 2026</p>

        <div className="prose prose-lg max-w-none space-y-6 text-slate-700">

          <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            Please read these Terms &amp; Conditions carefully before using Alambana Healthcare. By accessing or using our
            platform in any capacity (patient, doctor, advertiser, or visitor), you agree to be bound by these Terms.
            If you do not agree, you must discontinue use immediately.
          </div>

          {/* 1 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. About the Platform</h2>
            <p>
              Alambana Healthcare is an online health-tech marketplace operated by <strong>Sejal Engitech Pvt Ltd</strong> ("Company",
              "we", "us", or "our"), a company incorporated under the Companies Act, 2013. The platform connects patients
              with registered medical practitioners and provides ancillary digital health services including AI-assisted
              symptom assessment, electronic health records, and telemedicine facilitation, accessible at
              <strong> alambanahealthcare.vercel.app</strong> and any associated mobile or web applications.
            </p>
            <p className="mt-3">
              The Company acts as an <strong>Intermediary</strong> as defined under Section 2(1)(w) of the Information Technology
              Act, 2000, and as a <strong>Data Fiduciary</strong> under the Digital Personal Data Protection Act, 2023 (DPDP Act).
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility &amp; Account Registration</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must be at least <strong>18 years of age</strong> to create an account. Users under 18 may only access the platform under the supervision and with consent of a parent or legal guardian who agrees to these Terms on their behalf.</li>
              <li>You must provide accurate, current, and complete information during registration and keep it updated.</li>
              <li>You are solely responsible for all activities conducted under your account and for maintaining the confidentiality of your credentials.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms, provide false information, or engage in fraudulent activity.</li>
              <li>One individual or entity may not maintain multiple accounts. Duplicate accounts will be permanently banned.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Telemedicine Services &amp; Regulatory Compliance</h2>
            <p>
              All telemedicine consultations conducted through Alambana Healthcare are governed by the
              <strong> Telemedicine Practice Guidelines, 2020</strong> issued by the Board of Governors in supersession of the
              Medical Council of India, under the National Medical Commission Act, 2019.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Only registered medical practitioners (RMPs) holding a valid license under the Indian Medical Council Act, 1956 or equivalent state medical council may offer consultations.</li>
              <li>Consultations are subject to the scope permitted under the 2020 Guidelines. Doctors may not prescribe Schedule X drugs via telemedicine for first-time patients.</li>
              <li>Prescriptions issued via this platform are electronic and compliant with applicable law. Patients must consult a local pharmacist for dispensing.</li>
              <li>The platform does not facilitate, store, or transmit controlled substances prescriptions outside permitted parameters.</li>
              <li>Emergency cases must be referred to the nearest physical emergency facility. Telemedicine is not a substitute for emergency medical care.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Doctor Obligations &amp; Verification</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Doctors must submit a valid Medical Registration Certificate at sign-up. We verify registration details with the respective State Medical Council or National Medical Register where accessible.</li>
              <li>Verification reduces risk but does not constitute an endorsement of clinical competence, quality of care, or specific qualifications beyond what is stated.</li>
              <li>Doctors are independent professionals. Their advice, diagnosis, and prescriptions are their sole professional responsibility and do not represent the views or recommendations of the Company.</li>
              <li>Doctors must maintain professional indemnity insurance and ensure their practice is within the scope of their registered specialty.</li>
              <li>Doctors may not use the platform to advertise or sell pharmaceutical products, supplements, or any products for personal financial gain beyond their disclosed consultation fee.</li>
              <li>Blogs and articles published by doctors represent their personal professional opinion. The Company is not liable for such content but reserves the right to remove any content that is misleading, unscientific, or harmful.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Fees, Commission &amp; Payment Policy</h2>
            <p>
              <strong>Platform Commission:</strong> The Company charges a platform service fee (commission) on each completed
              consultation. The current commission rate is configured within the platform and is visible to registered doctors.
              This fee covers technology infrastructure, payment processing, customer support, and platform operations.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Consultation fees are set by individual doctors and displayed to patients before booking.</li>
              <li>All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We do not store card details.</li>
              <li>Doctor payouts (fee minus platform commission) are settled on a regular cycle. Settlement timelines are communicated separately to registered doctors.</li>
              <li>Prices displayed include applicable GST unless stated otherwise. The Company is responsible for GST compliance on its commission income.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-5 mb-2">Refund Policy</h3>
            <p>Refunds are applicable in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Doctor cancels or fails to attend the scheduled consultation.</li>
              <li>Technical failure on the platform's side prevents the consultation from occurring.</li>
              <li>Duplicate payment charged in error.</li>
            </ul>
            <p className="mt-2">
              Refunds will be processed within <strong>7–10 business days</strong> to the original payment instrument.
              Fees are <strong>non-refundable</strong> once a consultation is completed, regardless of patient satisfaction.
              Disputes must be raised via the Grievance Tracker within <strong>7 days</strong> of the appointment date.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Advertisement Policy &amp; Advertiser Terms</h2>
            <p>
              The platform accepts third-party advertisements displayed to users. By submitting an advertisement, the
              advertiser ("Advertiser") agrees to the following:
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.1 Advertiser Eligibility</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Advertisers must be legally registered entities or individuals in India with valid GST/PAN credentials where applicable.</li>
              <li>Pharmaceutical companies, medical device manufacturers, and healthcare product advertisers must hold all required regulatory approvals (CDSCO, FSSAI, etc.) for their advertised products/services.</li>
              <li>Advertisers who are not resident in India must comply with applicable foreign exchange and advertising regulations.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.2 Prohibited Ad Content</h3>
            <p>The following content is strictly prohibited in advertisements:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Advertisements for prescription drugs (Rx) directed at consumers (violates Drugs &amp; Magic Remedies (Objectionable Advertisements) Act, 1954).</li>
              <li>Misleading health claims, unsubstantiated miracle cure claims, or content violating the Advertising Standards Council of India (ASCI) guidelines.</li>
              <li>Tobacco, alcohol, gambling, adult content, or any content illegal under Indian law.</li>
              <li>Content that discriminates based on religion, caste, gender, disability, or any other protected characteristic.</li>
              <li>Ads for unregulated or unapproved medical devices, supplements claiming to treat disease, or content promoting self-diagnosis.</li>
              <li>Comparative advertising that disparages competitors in a false or misleading manner.</li>
              <li>Any content that could constitute a violation of the Consumer Protection Act, 2019 or the Consumer Protection (E-Commerce) Rules, 2020.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.3 Ad Approval &amp; Removal</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>All ads are subject to review and approval by the Company. Approval does not guarantee compliance with all applicable laws — that remains the Advertiser's sole responsibility.</li>
              <li>We reserve the right to remove, modify, or reject any advertisement at any time without notice and without liability.</li>
              <li>Impression and click metrics are provided for informational purposes only. We do not guarantee any minimum impressions, click-through rates, or conversions.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.4 Advertiser Indemnification</h3>
            <p>
              Advertisers agree to fully indemnify, defend, and hold harmless the Company, its officers, directors, employees,
              and agents from any claims, damages, penalties, fines, or legal costs (including attorney fees) arising from:
              (a) content of their advertisements; (b) regulatory non-compliance of advertised products/services;
              (c) consumer complaints related to advertised products; or (d) any third-party intellectual property infringement
              in the ad creative.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.5 Platform Not Liable for Ad Content</h3>
            <p>
              The Company acts as an intermediary displaying advertisements submitted by third parties. In accordance with
              Section 79 of the IT Act, 2000, the Company is not responsible for the accuracy, legality, or quality of
              advertised products or services. Users engage with advertisers at their own risk.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. User-Generated Content (Blogs, Reviews &amp; Ratings)</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Content posted by users (reviews, ratings, questions, blog posts) represents the individual's views and not those of the Company.</li>
              <li>By posting content, you grant the Company a non-exclusive, royalty-free, worldwide license to display, distribute, and use such content on the platform.</li>
              <li>You must not post false, defamatory, misleading, or medically inaccurate content.</li>
              <li>We reserve the right to remove any content that violates these Terms, applicable law, or is reported as harmful.</li>
              <li>The Company is protected under Section 79 of the IT Act, 2000 as an intermediary for third-party content. We act expeditiously on valid takedown notices.</li>
              <li>Ratings and reviews must be based on genuine first-hand experience. Fake reviews or incentivised reviews without disclosure violate the Consumer Protection Act, 2019.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Referral Program Terms</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Referral points are earned when a new user registers using a valid referral code. Points have no cash value and cannot be transferred, sold, or redeemed for cash.</li>
              <li>Points may only be redeemed for platform-specific benefits (discounts, priority booking) as announced by the Company from time to time.</li>
              <li>The Company reserves the right to modify, suspend, or terminate the referral program at any time without liability.</li>
              <li>Fraudulent referrals (self-referrals, automated sign-ups, fake accounts) will result in forfeiture of all points and account termination.</li>
              <li>Points expire after 12 months of account inactivity.</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. AI Symptom Checker — Specific Limitations</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>The AI symptom assessment tool is powered by a third-party large language model (OpenAI). It is for <strong>informational purposes only</strong> and does not constitute medical advice, diagnosis, or treatment.</li>
              <li>AI outputs are probabilistic and may be inaccurate. Do not make medical decisions based solely on AI output.</li>
              <li>Usage is rate-limited to prevent misuse. Attempting to circumvent rate limits may result in account suspension.</li>
              <li>The Company is not liable for any harm resulting from reliance on AI-generated assessments.</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Platform as Intermediary &amp; Limitation of Liability</h2>
            <p>
              The Company provides a technology platform to facilitate connections between patients and independent
              healthcare providers. The Company is NOT a healthcare provider, hospital, clinic, or medical institution.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>We are not responsible for the quality, accuracy, or outcome of medical consultations, diagnoses, prescriptions, or treatments provided by doctors on the platform.</li>
              <li>We are not liable for doctor-patient disputes, malpractice claims, or adverse medical outcomes.</li>
              <li>Our maximum aggregate liability for any claim arising out of or related to the platform shall not exceed the consultation fee paid for the specific transaction giving rise to the claim.</li>
              <li>We are not liable for loss of data, indirect, incidental, consequential, or punitive damages under any circumstances.</li>
              <li>Force majeure: We are not liable for failure or delay caused by circumstances beyond our reasonable control including natural disasters, government actions, internet outages, or pandemic-related restrictions.</li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. User Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Sejal Engitech Pvt Ltd, its affiliates, officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including
              legal fees) arising from: (a) your use of the platform; (b) violation of these Terms; (c) content you post;
              (d) violation of any law or third-party rights; or (e) any transaction or dispute between you and another user.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Intellectual Property</h2>
            <p>
              All platform content, design, software, trademarks, logos, and trade names are the exclusive property of
              Sejal Engitech Pvt Ltd or are used under license. Nothing on this platform grants you any right to use our
              intellectual property without express written permission. Unauthorized use, reproduction, reverse-engineering,
              or distribution is prohibited and may attract civil and criminal liability under Indian copyright and trademark law.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Prohibited Conduct</h2>
            <p>You must not:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the platform to transmit spam, malware, or any harmful code.</li>
              <li>Impersonate any doctor, patient, or platform employee.</li>
              <li>Scrape, crawl, or harvest data from the platform without authorization.</li>
              <li>Attempt to breach or test the security of the platform.</li>
              <li>Use the platform to facilitate any unlicensed medical practice.</li>
              <li>Share prescription details for non-personal use or attempt to obtain prescriptions fraudulently.</li>
            </ul>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Grievance Redressal</h2>
            <p>
              In accordance with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong> and the
              <strong> IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, we have appointed
              a Grievance Officer:
            </p>
            <div className="mt-3 p-4 bg-slate-100 rounded-lg text-sm">
              <p><strong>Grievance Officer:</strong> [Authorised Representative]</p>
              <p><strong>Company:</strong> Sejal Engitech Pvt Ltd</p>
              <p><strong>Email:</strong> <a href="mailto:grievance@alambanahealthcare.com" className="text-primary hover:underline">grievance@alambanahealthcare.com</a></p>
              <p><strong>Phone:</strong> 8084161465</p>
              <p><strong>Response Time:</strong> Acknowledgement within 24 hours; Resolution within 30 days for grievances, 72 hours for emergency/content removal requests.</p>
            </div>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Dispute Resolution &amp; Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Republic of India. Any dispute,
              controversy, or claim arising out of or relating to these Terms shall be resolved as follows:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-3">
              <li><strong>Step 1 — Internal Grievance:</strong> Contact our Grievance Officer as above. We will attempt to resolve within 30 days.</li>
              <li><strong>Step 2 — Mediation:</strong> If unresolved, either party may refer the dispute to mediation before a mutually agreed mediator in Bengaluru.</li>
              <li><strong>Step 3 — Arbitration:</strong> If mediation fails, the dispute shall be finally settled by binding arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed by mutual agreement, seated in Bengaluru, Karnataka. The language of arbitration shall be English.</li>
            </ol>
            <p className="mt-3">
              Nothing herein prevents either party from seeking urgent injunctive relief from a competent court in Bengaluru,
              Karnataka, India, which shall have exclusive jurisdiction for such relief.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">16. Modification &amp; Termination</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>We may update these Terms at any time. Material changes will be notified via email or a prominent platform notice. Continued use after such notice constitutes acceptance.</li>
              <li>We may suspend or terminate your access without notice for violation of these Terms, applicable law, or if we reasonably believe your actions harm the platform or other users.</li>
              <li>Upon termination, your right to access the platform ceases immediately. Provisions relating to liability, indemnification, IP, and dispute resolution survive termination.</li>
            </ul>
          </section>

          {/* 17 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">17. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <p className="mt-2">
              <strong>Sejal Engitech Pvt Ltd</strong><br />
              Email: <a href="mailto:info@alambanahealthcare.com" className="text-primary hover:underline">info@alambanahealthcare.com</a><br />
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
