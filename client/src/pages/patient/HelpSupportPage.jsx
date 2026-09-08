import { useState } from "react";
import { Link } from "react-router-dom";

function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How do I book a specialist doctor visit?",
      a: "Navigate to 'Book Specialist Visit' from your sidebar or dashboard. You can select your preferred medical specialty, choose your doctor, select a convenient date, pick an open 15-minute time slot, and confirm your booking instantly. You will receive an SMS confirmation with your appointment token.",
    },
    {
      q: "How quickly are laboratory test results available online?",
      a: "Routine blood tests (CBC, Blood Sugar, Lipid Profile, LFT, KFT) are usually published to your 'My Lab Reports' section within 3 to 6 hours after sample collection. Specialized cultures and biopsies may take 24 to 48 hours. You will receive a notification when the pathologist verifies your report.",
    },
    {
      q: "Can I reschedule or cancel my appointment if my plans change?",
      a: "Yes! Visit 'My Scheduled Visits' in the Appointments menu. You can reschedule to any open slot up to 2 hours before your scheduled consultation time without any cancellation fees.",
    },
    {
      q: "How do I make payments or settle invoices online?",
      a: "You can click 'Pay Now' directly from 'My Invoices & Receipts' or your Health Hub overview. We support instant UPI payments (Google Pay, PhonePe, Paytm, BHIM) as well as credit/debit cards and net banking.",
    },
    {
      q: "What is the ABHA (Ayushman Bharat Health Account) ID on my profile?",
      a: "Your ABHA ID is your 14-digit national health identity under the Government of India's Ayushman Bharat Digital Mission (ABDM). It securely links all your digital medical records across Indian hospitals and diagnostic laboratories.",
    },
    {
      q: "How do I file an insurance cashless pre-authorization claim?",
      a: "Please visit the TPA & Medical Insurance Desk located on the Ground Floor next to Admission Counter 3. Present your Nivora Care patient UHID and insurance e-card. Pre-authorizations are typically processed within 90 minutes.",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Help & Support Desk</h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
            24/7 Assistance
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Reach our round-the-clock emergency medical helplines, hospital navigation directory, and answers to common patient questions.
        </p>
      </div>

      {/* Emergency Hotlines Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white text-lg font-black shadow-xs">
              🚨
            </div>
            <div>
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Emergency Ambulance</p>
              <p className="font-mono text-xl font-black text-rose-900 mt-0.5">108 / 112</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-rose-700 font-medium">
            24/7 Advance Life Support (ALS) Ambulance dispatch across city limits.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white text-lg font-black shadow-xs">
              🏥
            </div>
            <div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Hospital Desk</p>
              <p className="font-mono text-base font-black text-blue-950 mt-0.5">+91 98765 43210</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-700 font-medium">
            General OPD appointments, doctor availability, and patient inquiries.
          </p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white text-lg font-black shadow-xs">
              💊
            </div>
            <div>
              <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">24/7 Pharmacy Desk</p>
              <p className="font-mono text-base font-black text-teal-950 mt-0.5">+91 98765 43219</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-teal-700 font-medium">
            Medicine refill queries, home delivery service, and stock verification.
          </p>
        </div>
      </div>

      {/* Hospital Floor Directory */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Hospital Wayfinding & Floor Guide</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Find your way around the Nivora Care Hospital campus effortlessly.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Ground Floor
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-2">Emergency & Admissions</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• 24/7 Emergency & Trauma</li>
              <li>• Patient Registration Counter</li>
              <li>• Central Cashier & TPA Insurance</li>
              <li>• 24/7 Central Pharmacy</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              1st Floor
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-2">OPD Specialist Clinics</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• Cardiology & Echo Suite</li>
              <li>• General Medicine & Diabetology</li>
              <li>• Pediatrics & Child Clinic</li>
              <li>• Orthopedics & Joint Clinic</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              2nd Floor
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-2">Diagnostics & Imaging</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• NABL Pathology Laboratory</li>
              <li>• Digital X-Ray & Ultrasound</li>
              <li>• MRI & CT Scan Center</li>
              <li>• Sample Collection Booths</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="rounded-md bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              3rd & 4th Floors
            </span>
            <h3 className="font-bold text-slate-900 text-sm mt-2">Inpatient Wards & ICU</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• Intensive Care Unit (ICU)</li>
              <li>• Cardiac Care Unit (CCU)</li>
              <li>• Private & Semi-Private Suites</li>
              <li>• General Male/Female Wards</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (Accordion) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Everything you need to know about using your Nivora Care patient portal.
        </p>

        <div className="mt-4 divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3.5">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-800 hover:text-blue-600 transition"
              >
                <span>{faq.q}</span>
                <span className="ml-4 text-slate-400 font-mono text-base">
                  {openFaq === idx ? "−" : "+"}
                </span>
              </button>
              {openFaq === idx && (
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pr-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Have feedback or suggestions about our service?</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Your reviews help us improve doctor consultations, nursing care, and hospital amenities.
          </p>
        </div>
        <Link
          to="/patient/feedback"
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs transition flex-shrink-0"
        >
          ⭐ Give Hospital Feedback
        </Link>
      </div>
    </div>
  );
}

export default HelpSupportPage;
