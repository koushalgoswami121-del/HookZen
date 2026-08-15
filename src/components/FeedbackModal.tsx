import React, { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquareText } from 'lucide-react';
import { saveFeedbackToFirestore } from '../lib/firebase';
import { User } from 'firebase/auth';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: (submitted: boolean) => void;
  user: User | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, user }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    await saveFeedbackToFirestore({
      rating,
      comment,
      uid: user?.uid || 'anonymous',
      email: user?.email || 'N/A',
      createdAt: new Date().toISOString()
    });

    setIsSubmitting(false);
    setIsSuccess(true);
    localStorage.setItem('hkz_feedback_given', 'true');

    setTimeout(() => {
      setIsSuccess(false);
      onClose(true);
      setRating(0);
      setComment('');
    }, 1500);
  };

  const skipFeedback = () => {
    localStorage.setItem('hkz_feedback_given', 'skipped');
    onClose(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 text-center border border-slate-100">
        {!isSuccess ? (
          <>
            <button
              onClick={skipFeedback}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-4 border border-amber-100">
              <MessageSquareText className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">How's your experience?</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">
              Your video is analyzing! While you wait, let us know how HookZen is working for you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex justify-center gap-1.5 cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${(hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-200'
                        }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any suggestions or feature requests? (Optional)"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                rows={3}
              />

              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold shadow-sm hover:bg-amber-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>

              <button
                type="button"
                onClick={skipFeedback}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Skip for now
              </button>
            </form>
          </>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-lg font-black text-slate-900">Thank You!</h3>
            <p className="text-xs font-medium text-slate-500">Your feedback helps us improve.</p>
          </div>
        )}
      </div>
    </div>
  );
};
