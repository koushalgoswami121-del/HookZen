import React from 'react';
import { XCircle, ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react';

interface PaymentCancelViewProps {
  onReturnToPricing: () => void;
  onGoHome: () => void;
}

export const PaymentCancelView: React.FC<PaymentCancelViewProps> = ({
  onReturnToPricing,
  onGoHome,
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 p-8 sm:p-10 shadow-2xl space-y-8 text-center text-slate-900 relative overflow-hidden">
        {/* Decorative Alert Badge */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-600 border border-slate-200 shadow-md">
          <XCircle className="h-10 w-10 text-slate-500" />
        </div>

        {/* Header Message */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
            <span>Checkout Canceled</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Payment Canceled
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            Your transaction was not completed and no charges were made to your account. You can upgrade to Hookzen Pro whenever you're ready.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onReturnToPricing}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Review Pro Pricing Plans</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
