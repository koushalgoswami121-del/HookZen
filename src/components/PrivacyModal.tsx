import React from 'react';
import { X, ShieldCheck, Lock, Eye, FileText, Sparkles, UserCheck } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Privacy &amp; Data Protection</h2>
              <p className="text-xs text-slate-500">HookZen Guarantee • Your data is 100% private and protected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Privacy Policy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed">
          {/* Trust Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-1">
              <p className="font-bold text-sm">We Never Sell, Share, or Misuse Your Personal Data</p>
              <p className="text-emerald-800">
                Your video ideas, scripts, and content belong entirely to you. We use end-to-end security protocols to ensure your creative work remains strictly private and protected at all times.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Lock className="h-4 w-4 text-amber-600" />
              <h3>1. Absolute Content Ownership &amp; Privacy</h3>
            </div>
            <p>
              Every video title, transcript, and creative Hook analyzed in our system is processed securely and remains <strong>100% your property</strong>. We do not store, publish, train, or share your proprietary scripts with any third party.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Eye className="h-4 w-4 text-amber-600" />
              <h3>2. Data Collection &amp; Minimal Usage</h3>
            </div>
            <p>
              We only collect essential information required to deliver instant viral analysis and sync your account credits:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>
                <strong>Account Identity:</strong> Basic account profile details (email address and name) when you sign in, used exclusively to save your credits and preferences.
              </li>
              <li>
                <strong>Script Analysis:</strong> Your input text is processed in real time solely to generate your 0–100 viral score and engagement suggestions.
              </li>
              <li>
                <strong>Usage Protection:</strong> Automated credit verification to ensure fair access and prevent system abuse.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <h3>3. Bank-Grade Encryption &amp; Security</h3>
            </div>
            <p>
              All communication between your device and our servers is protected by modern SSL/TLS encryption. Your saved script history is isolated and strictly accessible only by your authenticated account.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <UserCheck className="h-4 w-4 text-amber-600" />
              <h3>4. You Are Always In Control</h3>
            </div>
            <p>
              You have complete control over your data. You can clear your analysis history or delete saved records at any time directly within the application. For any questions or data requests, reach out to our team at <a href="mailto:support@hookzen.ai" className="text-amber-700 hover:underline font-medium">support@hookzen.ai</a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

