import React from 'react';
import { AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const DisclaimerPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12">
        <div className="flex items-center gap-4 mb-2">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h1 className="text-4xl font-bold">Medical &amp; Legal Disclaimer</h1>
        </div>
        <p className="text-sm text-slate-500 mb-8">Effective Date: March 10, 2026 &nbsp;·&nbsp; Last Updated: March 10, 2026</p>

        <div className="prose prose-lg max-w-none space-y-6 text-slate-700">

          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-lg font-bold text-red-700 mb-2">IMPORTANT — READ BEFORE USING THIS PLATFORM</p>
            <p className="text-red-700">
              Alambana Healthcare is a technology platform, not a medical institution, hospital, or clinic. Nothing on
              this platform — including AI assessments, doctor consultations, blog articles, or health records features —
              constitutes a substitute for in-person professional medical examination, diagnosis, or treatment.
              By using this platform you acknowledge and accept all disclaimers below.
            </p>
          </div>

          {/* 1 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Platform Is Not a Medical Provider</h2>
            <p>
              Sejal Engitech Pvt Ltd, operating as Alambana Healthcare, is a technology intermediary registered under
              the Companies Act, 2013. We are not a healthcare provider, nursing home, diagnostic centre, pharmacy, or
              any entity regulated under the Clinical Establishments (Registration and Regulation) Act, 2010. We do not
              employ doctors. Doctors on our platform are independent registered medical practitioners.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Telemedicine Scope &amp; Limitations</h2>
            <p>
              Telemedicine consultations on this platform are governed by the <strong>Telemedicine Practice Guidelines,
              2020</strong> issued by the Board of Governors in supersession of the Medical Council of India. Patients
              and doctors must note:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Telemedicine cannot replace physical examination. Certain conditions require in-person evaluation that telemedicine cannot adequately address.</li>
              <li>Doctors may decline to provide diagnosis or prescription if they determine that an in-person examination is necessary for safe medical practice.</li>
              <li>First consultation prescriptions are limited to the drug categories permitted under the 2020 Guidelines. Schedule X and certain other drugs cannot be prescribed for first-time patients via telemedicine.</li>
              <li>Electronic prescriptions issued via the platform are valid under applicable law but are subject to individual pharmacist verification.</li>
              <li>The platform cannot verify whether a patient's symptoms accurately reflect their actual condition. Misrepresentation of symptoms to obtain prescriptions may violate Indian law.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. AI Symptom Checker — Not a Diagnosis</h2>
            <p>
              Our AI-powered symptom checker is an <strong>informational tool only</strong>. It is powered by a
              third-party large language model and provides probabilistic, general health information based on
              symptom descriptions you input. Specifically:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>AI outputs are <strong>not a medical diagnosis</strong> under any applicable law or medical standard.</li>
              <li>The AI does not have access to your complete medical history, physical examination findings, lab results, or clinical context — all of which are essential for a real diagnosis.</li>
              <li>AI may be incorrect, incomplete, or misinterpret your symptoms. Do not rely on it for any medical decision.</li>
              <li>The AI is not a substitute for consulting a qualified registered medical practitioner (RMP).</li>
              <li>Results are not stored as a medical record and should not be shared with emergency services as a diagnostic report.</li>
              <li>The Company expressly disclaims all liability for any harm, including misdiagnosis, delayed treatment, or adverse health outcomes, resulting from reliance on AI outputs.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Doctor Opinions Are Independent</h2>
            <p>
              Medical advice, diagnosis, prescriptions, referrals, and treatment plans provided by doctors through
              this platform are the <strong>sole professional responsibility of the individual doctor</strong>.
              The Company does not direct, supervise, or control the clinical judgment of any doctor on the platform.
              The Company:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Does not guarantee the accuracy, completeness, or appropriateness of any medical advice given.</li>
              <li>Does not endorse any specific treatment, drug, procedure, or opinion expressed by a doctor.</li>
              <li>Is not liable for any adverse medical outcome, misdiagnosis, or injury resulting from consultations.</li>
              <li>Verifies doctor registration but does not independently assess clinical competence, subspecialty expertise, or quality of care.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Blog Content Disclaimer</h2>
            <p>
              Blog articles published on the platform are written by registered doctors and are their independent
              professional opinions. Such content:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Is for <strong>general informational and educational purposes only</strong>.</li>
              <li>Does not constitute personalised medical advice for any individual reader.</li>
              <li>May not reflect the most current medical research or guidelines at the time of reading.</li>
              <li>Is not reviewed or endorsed by the Company for clinical accuracy.</li>
              <li>Should not replace consultation with your personal healthcare provider.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Advertisement Disclaimer</h2>
            <p>
              Advertisements displayed on this platform are submitted by third-party advertisers. The Company:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Does not endorse, verify, or take responsibility for the accuracy, safety, efficacy, or legality of any advertised product or service.</li>
              <li>Is not liable for any loss, damage, or harm arising from your reliance on or purchase of any advertised product or service.</li>
              <li>Encourages users to independently verify any health product claims before purchase or use.</li>
              <li>Reminds users that advertised health products are not clinical recommendations from the platform or its associated doctors.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Health Records &amp; Data Disclaimer</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Health records stored on the platform are maintained for your personal convenience and may not meet the evidentiary standards of official medical records maintained by licensed clinical establishments.</li>
              <li>The platform is not certified as a Medical Records Management System under any applicable Indian health records regulation.</li>
              <li>You are responsible for maintaining your own copies of critical medical records. We recommend downloading your records regularly using the Export PDF feature.</li>
              <li>The Company is not liable for data loss due to technical failures, though we implement reasonable backup procedures.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. No Second Opinion Guarantee</h2>
            <p>
              The "Ask Before You Book" feature and any pre-consult questions answered by doctors are brief, informal
              responses based on limited information. They do not constitute a formal second opinion, medical consultation,
              or clinical assessment. Always book a full consultation for any matter requiring medical judgment.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Emergency Medical Situations</h2>
            <div className="p-5 bg-red-100 border-2 border-red-400 rounded-xl">
              <p className="font-bold text-red-800 text-lg mb-2">DO NOT USE THIS PLATFORM IN A MEDICAL EMERGENCY</p>
              <p className="text-red-700">
                If you or someone near you is experiencing a medical emergency, immediately call
                <strong> 112 (National Emergency Number)</strong> or proceed to the nearest hospital emergency room.
                This platform is not equipped to provide emergency medical care and any delay in contacting emergency
                services could be life-threatening.
              </p>
            </div>
            <p className="mt-4 font-medium">Signs that require immediate emergency services (not this platform):</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Chest pain, pressure, or tightness (possible heart attack)</li>
              <li>Sudden difficulty breathing or severe shortness of breath</li>
              <li>Suspected stroke: sudden face drooping, arm weakness, speech difficulty</li>
              <li>Severe bleeding or trauma</li>
              <li>Loss of consciousness or unresponsiveness</li>
              <li>Severe allergic reaction (anaphylaxis)</li>
              <li>Suicidal thoughts or self-harm — call <strong>iCall: 9152987821</strong> or Vandrevala Foundation: <strong>1860-2662-345</strong> (24×7)</li>
              <li>Suspected poisoning or drug overdose</li>
              <li>Severe burns</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Sejal Engitech Pvt Ltd, its directors, employees,
              affiliates, doctors, and partners shall not be liable for any direct, indirect, incidental, special,
              consequential, or punitive damages including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>Adverse medical outcomes or misdiagnosis resulting from consultations</li>
              <li>Harm arising from reliance on AI-generated assessments</li>
              <li>Loss or corruption of health data</li>
              <li>Harm from advertised products or services</li>
              <li>Actions or omissions of independent doctors on the platform</li>
              <li>Platform unavailability due to maintenance, cyberattacks, or force majeure</li>
            </ul>
            <p className="mt-3">
              Our aggregate liability in any circumstance shall not exceed the amount paid by you for the specific
              transaction giving rise to the claim, or ₹5,000, whichever is lower.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Acknowledgment</h2>
            <div className="p-4 bg-slate-100 rounded-xl text-sm">
              <p>
                By using Alambana Healthcare, you confirm that you have read, understood, and unconditionally accepted
                this entire disclaimer. You understand that you use this platform at your own risk and that the Company
                serves only as a technology intermediary. You agree to seek qualified in-person medical care for any
                condition that may be serious, urgent, or life-threatening. You release the Company, its operators,
                employees, and affiliated doctors from all liability arising from your use of the platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact</h2>
            <p>For clarifications on this disclaimer, contact:</p>
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

export default DisclaimerPage;
