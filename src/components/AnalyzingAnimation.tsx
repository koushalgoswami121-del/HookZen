import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export const AnalyzingAnimation: React.FC = () => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStep, setLoadingStep] = useState(0);

    useEffect(() => {
        setLoadingProgress(0);
        setLoadingStep(0);

        const interval = setInterval(() => {
            setLoadingProgress((prev) => {
                const next = prev + (Math.random() * 5 + 2);
                if (next >= 100) clearInterval(interval);
                return Math.min(next, 95); // hold at 95% until real API resolves
            });
        }, 100);

        const stepInterval = setInterval(() => {
            setLoadingStep((prev) => (prev + 1) % 3);
        }, 1300);

        return () => {
            clearInterval(interval);
            clearInterval(stepInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fff8eb] backdrop-blur-sm">
            <div className="relative w-full max-w-md p-6 sm:p-10 flex flex-col items-center justify-center">
                {/* Glow Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-400/20 blur-[100px] rounded-full pointer-events-none" />

                {/* Floating Particles */}
                <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-amber-300 rounded-full animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-amber-500 rounded-full animate-ping" />

                {/* Center Icon Composition */}
                <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-white shadow-xl rounded-2xl rotate-3 border border-slate-100 flex items-start justify-center pt-5">
                        <div className="space-y-2 w-full px-5">
                            <div className="h-2.5 w-3/4 bg-slate-200 rounded-full" />
                            <div className="h-2.5 w-full bg-slate-100 rounded-full" />
                            <div className="h-2.5 w-5/6 bg-slate-100 rounded-full" />
                            <div className="h-2.5 w-3/4 bg-slate-100 rounded-full pt-4" />
                        </div>
                    </div>

                    <div className="absolute -bottom-4 -right-4 bg-slate-900 rounded-full p-2.5 shadow-2xl z-10 flex items-center justify-center transform hover:scale-105 transition-transform duration-700 animate-pulse">
                        <div className="relative flex items-center justify-center w-12 h-12 bg-white rounded-full border-4 border-slate-900 shadow-inner">
                            <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
                        </div>
                        {/* Magnifying Handle */}
                        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-4 border-slate-900 bg-slate-800 rotate-45 rounded-sm" />
                    </div>
                </div>

                {/* Text */}
                <h2 className="text-2xl font-black tracking-tight text-slate-800 mb-6 z-10">
                    Analyzing your script...
                </h2>

                {/* Capsule Progress Bar */}
                <div className="w-full max-w-sm h-3 relative bg-slate-200/60 rounded-full overflow-hidden mb-6 shadow-inner z-10">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${loadingProgress}%` }}
                    />
                </div>

                {/* Steps */}
                <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold transition-all duration-500 max-w-[280px] sm:max-w-none text-center z-10">
                    <span className={loadingStep === 0 ? "text-amber-600" : "text-slate-400"}>Extracting insights</span>
                    <span className="text-amber-400 text-[10px] hidden sm:inline-block">●</span>
                    <span className={loadingStep === 1 ? "text-amber-600" : "text-slate-400"}>Checking patterns</span>
                    <span className="text-amber-400 text-[10px] hidden sm:inline-block">●</span>
                    <span className={loadingStep === 2 ? "text-amber-600" : "text-slate-400"}>Calculating score</span>
                </div>
            </div>
        </div>
    );
};
