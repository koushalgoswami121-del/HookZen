import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Crown,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FreemiumState } from '../utils/freemiumManager';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  freemiumState: FreemiumState;
  onCancelSubscription: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  freemiumState,
  onCancelSubscription,
  onDeleteAccount,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancelSubscription();
      setCancelSuccessMsg('Your subscription cancellation has been processed. You will revert to the Free tier.');
      setShowCancelConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteInput.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await onDeleteAccount();
      onClose();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-2xs">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Account Settings</h2>
              <p className="text-xs text-slate-500">Manage profile, subscription &amp; data privacy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close settings modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-2xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 font-black text-slate-950 text-lg shadow-2xs">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 truncate">
                  {user?.displayName || 'Signed In User'}
                </h3>
                {freemiumState.isPro ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300">
                    <Crown className="h-3 w-3 fill-amber-500 text-amber-600" />
                    PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
                    <Zap className="h-3 w-3 fill-slate-500 text-slate-600" />
                    FREE
                  </span>
                )}
              </div>
              <p className="text-slate-500 truncate font-medium mt-0.5">
                {user?.email || 'Local Guest Account'}
              </p>
            </div>
          </div>

          {/* Subscription & Billing Section */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              Subscription &amp; Billing Status
            </h4>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {freemiumState.isPro
                      ? `HookZen Pro (${freemiumState.planType?.toUpperCase() || 'ACTIVE'})`
                      : 'HookZen Free Tier'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {freemiumState.isPro
                      ? 'Unlimited Video Audits & AI Script Optimizations'
                      : '50 Free Credits (Refresh monthly)'}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      freemiumState.isPro
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {freemiumState.isPro ? 'Active' : 'Free'}
                  </span>
                </div>
              </div>

              {/* Pro Feature & Account Protection Info */}
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-[11px] text-slate-600 leading-tight">
                <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Account &amp; Plan Protection</span>
                </p>
                <span>
                  Your active subscription and credit usage are managed securely. You can manage or cancel your plan at any time.
                </span>
              </div>

              {cancelSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{cancelSuccessMsg}</span>
                </div>
              )}

              {/* Discreet Cancel Subscription Trigger */}
              {freemiumState.isPro && !cancelSuccessMsg && (
                <div className="pt-2 border-t border-slate-100">
                  {!showCancelConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-slate-400 hover:text-slate-600 text-[11px] font-medium underline transition-colors cursor-pointer"
                    >
                      Cancel Subscription Plan
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 space-y-2.5 animate-fadeIn">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-950 text-xs">
                            Cancel Subscription?
                          </p>
                          <p className="text-[11px] text-amber-900 font-medium">
                            Your Pro unlimited credits will be cancelled and your account will revert to the 50 daily credit limit (10 credits per analysis).
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-600 font-bold hover:bg-amber-100 transition-colors cursor-pointer text-[11px]"
                        >
                          Keep My Subscription
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmCancel}
                          disabled={isCancelling}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer text-[11px] shadow-2xs disabled:opacity-50"
                        >
                          {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="space-y-3 pt-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-500">
              Danger Zone
            </h4>

            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    <span>Delete Account &amp; Erase Cloud Data</span>
                  </p>
                  <p className="text-[11px] text-rose-800 font-medium mt-0.5">
                    Permanently delete your profile, saved video script history, and credits from our servers.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Delete My Account
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border border-rose-300 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-rose-900 font-semibold leading-normal">
                      This action is permanent and cannot be undone. To confirm, type <strong className="text-rose-700 uppercase">DELETE</strong> below:
                    </p>
                  </div>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-3 py-1.5 border border-rose-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={deleteInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer text-[11px] shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
