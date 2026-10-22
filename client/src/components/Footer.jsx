import React from "react";
import { Link } from "react-router-dom";
import HospitalLogo from "./HospitalLogo.jsx";

export default function Footer({ className = "" }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl text-slate-600 shadow-xs transition-colors ${className}`}
      aria-label="Hospital portal footer"
    >
      <div className="mx-auto w-full px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Accreditation (42% width) */}
          <div className="lg:col-span-5 space-y-4">
            <HospitalLogo to="/" variant="full" />
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
              Nivora Care Hospital is a mission-critical, end-to-end full-stack healthcare operating system connecting 8 specialized hospital portals into one synchronized clinical platform.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-300/80 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                NABH Accredited Hospital
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-800 border border-blue-300/80 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                ABDM &amp; Ayushman Bharat Compliant
              </span>
            </div>
          </div>

          {/* Hospital Portals Navigation */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Hospital Portals
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs">
              <li>
                <Link to="/doctor/consultation" className="hover:text-blue-700 transition">
                  Doctor Clinical EHR
                </Link>
              </li>
              <li>
                <Link to="/nurse/patients" className="hover:text-blue-700 transition">
                  Nursing Station (MAR)
                </Link>
              </li>
              <li>
                <Link to="/pharmacy/queue" className="hover:text-blue-700 transition">
                  Pharmacy Dispensing
                </Link>
              </li>
              <li>
                <Link to="/diagnostic/requests" className="hover:text-blue-700 transition">
                  Pathology &amp; Radiology PACS
                </Link>
              </li>
              <li>
                <Link to="/reception/waiting-room" className="hover:text-blue-700 transition">
                  Front Desk &amp; Registration
                </Link>
              </li>
              <li>
                <Link to="/emergency/dashboard" className="hover:text-rose-700 transition">
                  Emergency &amp; Trauma Unit
                </Link>
              </li>
            </ul>
          </div>

          {/* Patient Services */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Patient Care
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs">
              <li>
                <Link to="/patient/dashboard" className="hover:text-blue-700 transition">
                  Patient Health Hub
                </Link>
              </li>
              <li>
                <Link to="/patient/appointments/book" className="hover:text-blue-700 transition">
                  Book Specialist Visit
                </Link>
              </li>
              <li>
                <Link to="/patient/prescriptions" className="hover:text-blue-700 transition">
                  Digital Prescriptions (Rx)
                </Link>
              </li>
              <li>
                <Link to="/patient/lab-reports" className="hover:text-blue-700 transition">
                  Diagnostic Reports
                </Link>
              </li>
              <li>
                <Link to="/patient/billings" className="hover:text-blue-700 transition">
                  Invoices &amp; UPI Payments
                </Link>
              </li>
              <li>
                <Link to="/ward-map" className="hover:text-blue-700 transition">
                  Wayfinding &amp; Floor Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* 24/7 Helplines & Direct Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              24/7 Helplines
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="text-rose-600 font-bold">Ambulance:</span>
                <a
                  href="tel:108"
                  className="font-mono font-bold text-rose-600 hover:underline"
                  title="Call Emergency Ambulance"
                >
                  108
                </a>
                <span className="text-slate-400">/</span>
                <a
                  href="tel:102"
                  className="font-mono font-bold text-rose-600 hover:underline"
                  title="Call National Ambulance"
                >
                  102
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-slate-800 font-semibold">National:</span>
                <a
                  href="tel:112"
                  className="font-mono font-bold text-slate-900 hover:underline"
                  title="Call National Emergency"
                >
                  112
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-slate-800 font-semibold">Health Desk:</span>
                <a
                  href="tel:+919876543210"
                  className="font-mono font-bold text-slate-900 hover:underline"
                  title="Call Hospital Desk"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-slate-800 font-semibold">Pharmacy:</span>
                <a
                  href="tel:+919876543219"
                  className="font-mono font-bold text-slate-900 hover:underline"
                  title="Call 24/7 Pharmacy"
                >
                  +91 98765 43219
                </a>
              </li>
              <li className="pt-2">
                <span className="block text-slate-500 text-[11px] mb-0.5">Support Email:</span>
                <a
                  href="mailto:support@nivoracare.com"
                  className="text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline break-all"
                  title="Email Hospital Support"
                >
                  support@nivoracare.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="mt-8 border-t border-slate-200/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            &copy; {currentYear} Nivora Care Hospital. All rights reserved. Built for unified clinical care.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-600">
            <Link to="/patient/support" className="hover:text-slate-900 transition">
              Patient Helpdesk
            </Link>
            <span className="text-slate-300 select-none">&middot;</span>
            <Link to="/ward-map" className="hover:text-slate-900 transition">
              Ward Floor Map
            </Link>
            <span className="text-slate-300 select-none">&middot;</span>
            <Link to="/login" className="hover:text-slate-900 transition">
              Staff Portal Access
            </Link>
            <span className="text-slate-300 select-none">&middot;</span>
            <a
              href="mailto:support@nivoracare.com?subject=Privacy%20and%20Data%20Compliance%20Inquiry"
              className="hover:text-slate-900 transition"
            >
              Privacy &amp; HIPAA
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
