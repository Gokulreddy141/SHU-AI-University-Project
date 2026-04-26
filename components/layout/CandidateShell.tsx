"use client";
import React from "react";

interface CandidateShellProps {
    children: React.ReactNode;
    examTitle?: string;
    candidateName?: string;
}

export default function CandidateShell({
    children,
    examTitle,
    candidateName,
}: CandidateShellProps) {
    return (
        <div className="min-h-screen bg-background text-white">
            {/* Minimal top bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto h-12 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-[10px] font-bold">
                            II
                        </div>
                        <span className="text-sm font-semibold text-gray-300">
                            {examTitle || "Interview Integrity AI"}
                        </span>
                    </div>

                    {candidateName && (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                {candidateName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-400">{candidateName}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="pt-12">{children}</main>
        </div>
    );
}
