"use client";
import React from "react";

interface FullScreenOverlayProps {
    isVisible: boolean;
    violationCount: number;
    onRequestFullScreen: () => void;
}

export default function FullScreenOverlay({
    isVisible,
    violationCount,
    onRequestFullScreen,
}: FullScreenOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
            <div className="max-w-md w-full p-8 bg-[#0f0f0f] border border-red-500/30 rounded-2xl text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/10">
                    <span className="material-symbols-outlined text-4xl">fullscreen_exit</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-100 mb-3">
                    Full Screen Mode Required
                </h2>

                <p className="text-slate-400 mb-8 leading-relaxed">
                    You have exited full-screen mode. This has been logged as an integrity violation. To continue your exam, you must return to full-screen.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={onRequestFullScreen}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-[#0f0f0f] font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/25"
                    >
                        <span className="material-symbols-outlined">fullscreen</span>
                        Return to Full Screen
                    </button>

                    <div className="text-sm font-medium text-slate-500">
                        Total Full-Screen Violations: <span className="text-red-400 font-bold">{violationCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
