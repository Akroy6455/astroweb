'use client';

import { useState, useEffect } from 'react';
import { Cookie, Shield, FileText, X, Check, ArrowRight, Eye } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('astro_cookie_consent_accepted');
    if (!consent) {
      // Delay showing the banner slightly for a smoother entry animation
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('astro_cookie_consent_accepted', 'true');
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Non-intrusive bottom notification bar */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
          <div className="max-w-6xl mx-auto bg-[#2E3131]/95 backdrop-blur-md border border-[#C9A86A]/30 text-stone-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] p-4 md:py-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
            <div className="flex items-center gap-3 text-left">
              <div className="hidden sm:flex items-center justify-center p-2.5 bg-[#C9A86A]/20 border border-[#C9A86A]/40 rounded-xl text-[#C9A86A] shrink-0">
                <Cookie className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-[#C9A86A] tracking-wide mb-0.5 flex items-center gap-1.5 font-serif">
                  Cookie Consent & Legal Terms
                </h4>
                <p className="text-xs md:text-sm text-stone-300 leading-relaxed max-w-3xl">
                  We use essential cookies to manage your sessions, save calculation preferences (like ayanamsha), and sync profiles. 
                  By continuing, you agree to our{' '}
                  <button 
                    onClick={() => { setShowModal(true); setActiveTab('privacy'); }}
                    className="text-[#C9A86A] hover:text-[#D4B67F] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button 
                    onClick={() => { setShowModal(true); setActiveTab('terms'); }}
                    className="text-[#C9A86A] hover:text-[#D4B67F] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={() => { setShowModal(true); }}
                className="flex items-center justify-center gap-1 px-4 py-2 text-xs md:text-sm text-stone-300 hover:text-white border border-stone-600 hover:border-stone-400 rounded-lg transition-all duration-200 w-full md:w-auto font-medium cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                Read Details
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex items-center justify-center gap-1 px-5 py-2 text-xs md:text-sm bg-gradient-to-r from-[#C9A86A] to-[#D4B67F] text-stone-950 font-bold hover:brightness-110 rounded-lg transition-all duration-200 shadow-md shadow-[#C9A86A]/10 w-full md:w-auto cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Glass Modal for Legal Documents */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e2020] border border-[#C9A86A]/40 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#2E3131]/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#C9A86A]" />
                <h3 className="text-xl font-bold text-[#C9A86A] font-serif">Legal Documentation</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-white p-1 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Document Tabs */}
            <div className="flex border-b border-stone-800 bg-stone-950/40">
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-3 px-6 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 border-b-2 transition-all duration-200 cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'border-[#C9A86A] text-[#C9A86A] bg-[#C9A86A]/5'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
                }`}
              >
                <Shield className="h-4 w-4" />
                Privacy Policy
              </button>
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex-1 py-3 px-6 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 border-b-2 transition-all duration-200 cursor-pointer ${
                  activeTab === 'terms'
                    ? 'border-[#C9A86A] text-[#C9A86A] bg-[#C9A86A]/5'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
                }`}
              >
                <FileText className="h-4 w-4" />
                Terms of Service
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 text-stone-300 space-y-6 text-sm leading-relaxed scrollbar-thin">
              {activeTab === 'privacy' ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white font-serif border-b border-stone-800 pb-2">Privacy Policy</h4>
                  <p className="text-stone-400 text-xs italic">Last Updated: May 30, 2026</p>
                  
                  <p>
                    Your privacy is of paramount importance to us. This Privacy Policy details how we handle, process, and protect your personal information on our Vedic Astrology platform.
                  </p>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">1. Information We Collect</h5>
                  <p>
                    To generate highly precise astronomical calculations and birth charts (Kundli), we collect the following inputs:
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-stone-400">
                    <li>Full Name (for profile labeling)</li>
                    <li>Date and Time of Birth</li>
                    <li>Geographical Coordinates of Birth (Latitude & Longitude)</li>
                    <li>Birth City and Time Zone</li>
                  </ul>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">2. How Data is Processed & Stored</h5>
                  <ul className="list-disc list-inside pl-4 space-y-2 text-stone-400">
                    <li>
                      <strong className="text-stone-300">Local Processing:</strong> Core planetary positions and Dasha charts are processed server-side or locally on your browser using high-precision Swiss Ephemeris calculations. Your raw data is only stored in memory during active sessions.
                    </li>
                    <li>
                      <strong className="text-stone-300">Firebase Cloud Sync (Optional):</strong> If you choose to sign in using Google, we store your saved profiles securely in a Google Cloud Firestore database. This enables you to sync your saved charts across devices.
                    </li>
                  </ul>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">3. Cookie & Local Storage Usage</h5>
                  <p>
                    We use cookies and browser local storage for essential operations:
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-stone-400">
                    <li>Authentication cookies to manage your secure Google login session.</li>
                    <li>Local storage to persist client preferences, such as custom Ayanamsha settings (Raman/Lahiri) and Net Dasha Score weight overrides.</li>
                    <li>Consent status to prevent showing this notification banner once accepted.</li>
                  </ul>
                  <p className="text-stone-400">
                    We do <strong className="text-stone-300">not</strong> use cookies for third-party advertising, commercial tracking, or behavioral targeting.
                  </p>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">4. Your Control and Rights</h5>
                  <p>
                    You retain absolute control over your data. You can delete individual saved profiles at any time directly through the UI. If you are signed in, deleting a profile removes it permanently from both your local view and the cloud database. You can also sign out or request account deletions via support.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white font-serif border-b border-stone-800 pb-2">Terms of Service</h4>
                  <p className="text-stone-400 text-xs italic">Last Updated: May 30, 2026</p>

                  <p>
                    Welcome to the Vedic Astrology Precision Kundli Generator. By accessing and using our application, you agree to comply with and be bound by the following terms and conditions.
                  </p>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">1. Calculations & Astrological Outputs</h5>
                  <p>
                    Our software implements the Swiss Ephemeris and classical Parasari principles to calculate divisional charts (Vargas), Shadbala, Ashtakavarga, and Net Dasha Scores. While we strive for extreme mathematical precision based on astronomical algorithms:
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-stone-400">
                    <li>Astrological calculations and interpretations are for educational, self-reflective, and research purposes.</li>
                    <li>Astrological outcomes do not guarantee any concrete future outcomes or events.</li>
                    <li>No content displayed should be taken as professional medical, financial, or legal advice.</li>
                  </ul>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">2. Acceptable Use</h5>
                  <p>
                    You agree to use this application for personal, non-commercial purposes. You may not scrape calculation endpoints or attempt to cause degradation of service to our servers. Any malicious attempt to exploit our database or backend systems will result in immediate termination of account access.
                  </p>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">3. User Accounts</h5>
                  <p>
                    When registering via Google Login, you are responsible for maintaining the security of your account and credentials. We cannot be held liable for unauthorized access resulting from compromised Google credentials.
                  </p>

                  <h5 className="font-semibold text-[#C9A86A] mt-4 font-serif text-base">4. Limitation of Liability</h5>
                  <p>
                    The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranty that calculations are absolute or free of anomalies due to physical limits of astronomical models. Under no circumstances shall our platform or creators be liable for any direct or indirect decision-making outcomes resulting from chart generated points or dasha calculations.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-800 bg-[#2E3131]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-stone-400 text-center sm:text-left">
                By clicking "Accept Policies", you consent to cookies, privacy terms, and terms of service.
              </span>
              <div className="flex gap-3 w-full sm:w-auto shrink-0 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs md:text-sm text-stone-300 hover:text-white border border-stone-700 hover:border-stone-500 rounded-lg transition-colors cursor-pointer w-full sm:w-auto text-center"
                >
                  Close Reader
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 text-xs md:text-sm bg-gradient-to-r from-[#C9A86A] to-[#D4B67F] text-stone-950 font-bold hover:brightness-110 rounded-lg transition-all duration-200 shadow-md shadow-[#C9A86A]/10 w-full sm:w-auto cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  Accept Policies
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind inline styling animations block */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-zoom-in {
          animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        /* Custom scrollbar styling for the policy modals */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(201, 168, 106, 0.4);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(201, 168, 106, 0.7);
        }
      `}</style>
    </>
  );
}
