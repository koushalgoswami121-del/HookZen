import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Target, Eye, BarChart3 } from 'lucide-react';

const MESSAGES = [
    { text: 'Analyzing hook strength…', icon: Zap },
    { text: 'Checking FYP signals…', icon: TrendingUp },
    { text: 'Scoring virality triggers…', icon: Target },
    { text: 'Evaluating viewer retention…', icon: Eye },
    { text: 'Compiling your report…', icon: BarChart3 },
];

export const AnalyzingAnimation: React.FC = () => {
    const [msgIdx, setMsgIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setMsgIdx((p) => (p + 1) % MESSAGES.length), 750);
        return () => clearInterval(t);
    }, []);

    const { text, icon: Icon } = MESSAGES[msgIdx];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-lg">
            <div className="flex flex-col items-center gap-7 px-6 text-center">

                {/* Simple pulsing orb with one ring */}
                <div className="relative flex items-center justify-center">
                    {/* Single gentle ring */}
                    <div
                        className="absolute h-28 w-28 rounded-full border-2 border-amber-400/40"
                        style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }}
                    />
                    {/* Core orb */}
                    <div
                        className="relative h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl"
                        style={{ animation: 'pulse 2s ease-in-out infinite' }}
                    >
                        <Zap className="h-9 w-9 fill-white text-white" />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">Calculating Viral Score</h2>
                    <p className="text-sm text-slate-400">Running deep analysis on your content…</p>
                </div>

                {/* Cycling message — no numbers */}
                <div
                    key={msgIdx}
                    className="flex items-center gap-2.5 rounded-full bg-white/10 border border-white/10 px-5 py-2.5"
                    style={{ animation: 'fadeIn 0.3s ease' }}
                >
                    <Icon className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-sm text-slate-200 font-medium">{text}</span>
                </div>

                {/* 3 bouncing dots */}
                <div className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-2 w-2 rounded-full bg-amber-400/80"
                            style={{ animation: `bounce 1s ease-in-out ${i * 0.18}s infinite` }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      `}</style>
        </div>
    );
};
