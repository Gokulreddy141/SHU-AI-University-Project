"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import IntegrityScoreBadge from "@/components/features/IntegrityScoreBadge";
import ViolationTimeline from "@/components/features/ViolationTimeline";
import { useViolationLog } from "@/hooks/useViolationLog";
import { useSessionDetail } from "@/hooks/useSessionDetail";
import { IViolation } from "@/types/violation";

interface IntegrityReport {
    verdict: "CLEAN" | "SUSPICIOUS" | "HIGH_RISK";
    confidence: number;
    headline: string;
    riskFactors: { factor: string; severity: "low" | "medium" | "high"; explanation: string }[];
    positiveIndicators: string[];
    recommendation: "PASS" | "MANUAL_REVIEW" | "DISQUALIFY";
    reasoning: string;
}

const VERDICT_CONFIG = {
    CLEAN:      { label: "Clean",      color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20",  dot: "bg-green-400"  },
    SUSPICIOUS: { label: "Suspicious", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-400" },
    HIGH_RISK:  { label: "High Risk",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    dot: "bg-red-400"    },
};

const RECOMMENDATION_CONFIG = {
    PASS:          { label: "Pass",          color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
    MANUAL_REVIEW: { label: "Manual Review", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    DISQUALIFY:    { label: "Disqualify",    color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"    },
};

const SEVERITY_COLOR = {
    low:    "text-green-400",
    medium: "text-yellow-400",
    high:   "text-red-400",
};

const VIOLATION_TYPE_LABELS: Record<string, string> = {
    LOOKING_AWAY: "Looking Away",
    MULTIPLE_FACES: "Multiple Faces",
    NO_FACE: "No Face",
    LIP_SYNC_MISMATCH: "Lip Sync",
    FACE_MISMATCH: "Face Mismatch",
    FULLSCREEN_EXIT: "Fullscreen Exit",
    WINDOW_BLUR: "App Switch",
    KEYBOARD_SHORTCUT: "Shortcuts",
    CLIPBOARD_PASTE: "Clipboard",
};

export default function IntegrityReportPage() {
    const { id: sessionId } = useParams();
    const router = useRouter();
    const [, setUser] = useState<{ name: string; role: string } | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const { session, loading: sessionLoading, error: sessionError } = useSessionDetail(sessionId as string);
    const { violations, loading: vlLoading } = useViolationLog(sessionId as string, activeFilter);

    const [aiReport, setAiReport] = useState<IntegrityReport | null>(null);
    const [aiReportLoading, setAiReportLoading] = useState(false);
    const [aiReportError, setAiReportError] = useState<string | null>(null);
    const [aiReportGeneratedAt, setAiReportGeneratedAt] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) queueMicrotask(() => setUser(JSON.parse(stored)));
    }, []);

    const generateAiReport = useCallback(async () => {
        if (!sessionId || aiReportLoading) return;
        setAiReportLoading(true);
        setAiReportError(null);
        try {
            const res = await fetch("/api/ai/integrity-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            if (!res.ok) throw new Error("Failed to generate report");
            const data = await res.json();
            setAiReport(data.report);
            setAiReportGeneratedAt(data.generatedAt);
        } catch {
            setAiReportError("Could not generate AI report. Please try again.");
        } finally {
            setAiReportLoading(false);
        }
    }, [sessionId, aiReportLoading]);

    const loading = sessionLoading;
    const fetchError = sessionError;

    const filteredViolations = activeFilter
        ? violations.filter((v: IViolation) => v.type === activeFilter)
        : violations;

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-5xl mb-4">{fetchError ? "⚠️" : "🔍"}</p>
                <h2 className="text-xl font-bold mb-2">
                    {fetchError ? "Connection Error" : "Session Not Found"}
                </h2>
                <p className="text-gray-400">
                    {fetchError
                        ? "Failed to load the report. Please check your connection."
                        : "This session does not exist or has been removed."}
                </p>
                <div className="flex gap-3 mt-6">
                    {fetchError && (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors"
                        >
                            Retry
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!session) return null;

    // Use type casting for populated fields
    const candidate = session.candidateId as unknown as { name: string; email: string };
    const exam = session.examId as unknown as { title: string };

    return (
        <div className="p-6 md:p-10">
            {/* Header with back button */}
            <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
                ← Back to Dashboard
            </button>

            {/* Report Title */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Integrity Report</h1>
                    <p className="text-gray-400 mt-1">
                        {exam.title} • {candidate.name} ({candidate.email})
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {session.startTime && (
                            <span>
                                Started:{" "}
                                {new Date(session.startTime).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        )}
                        {session.endTime && (
                            <span>
                                Ended:{" "}
                                {new Date(session.endTime).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        )}
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${session.status === "completed"
                                ? "bg-gray-700 text-gray-300"
                                : session.status === "flagged"
                                    ? "bg-red-900/50 text-red-300"
                                    : "bg-green-900/50 text-green-300"
                                }`}
                        >
                            {session.status.replace("_", " ").toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Integrity Score */}
                <IntegrityScoreBadge score={session.integrityScore} size="lg" />
            </div>

            {/* Violation Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-8 gap-4 mb-8">
                {Object.entries(VIOLATION_TYPE_LABELS).map(([type, label]) => {
                    const summaryKeyMap: Record<string, string> = {
                        LOOKING_AWAY: "lookingAway",
                        MULTIPLE_FACES: "multipleFaces",
                        NO_FACE: "noFace",
                        LIP_SYNC_MISMATCH: "lipSyncMismatch",
                        FACE_MISMATCH: "faceMismatch",
                        TAB_SWITCH: "tabSwitch",
                        COPY_PASTE: "copyPaste",
                        VIRTUAL_CAMERA: "virtualCamera",
                        DEVTOOLS_ACCESS: "devtoolsAccess",
                        LIVENESS_FAILURE: "livenessFailure",
                        SECONDARY_MONITOR: "secondaryMonitor",
                        FULLSCREEN_EXIT: "fullscreenExit",
                        WINDOW_BLUR: "windowBlur",
                        KEYBOARD_SHORTCUT: "keyboardShortcut",
                        CLIPBOARD_PASTE: "clipboardPaste",
                    };

                    return (
                        <button
                            key={type}
                            onClick={() =>
                                setActiveFilter(activeFilter === type ? null : type)
                            }
                            className={`p-3 rounded-xl border text-center transition-all ${activeFilter === type
                                ? "border-primary bg-primary/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                                }`}
                        >
                            <p className="text-xl font-bold">{(session.violationSummary as unknown as Record<string, number>)[summaryKeyMap[type]] || 0}</p>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
                        </button>
                    );
                })}
            </div>

            {/* ── Gemini AI Integrity Analysis Panel ── */}
            <div className="mb-8 rounded-2xl border border-[#2a2a2a] bg-[#111] overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px] text-blue-400">psychology</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Gemini AI Integrity Analysis</h2>
                            <p className="text-[11px] text-slate-500">
                                {aiReportGeneratedAt
                                    ? `Generated ${new Date(aiReportGeneratedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                                    : "Pattern analysis across all recorded violations"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={generateAiReport}
                        disabled={aiReportLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                        {aiReportLoading ? (
                            <><div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />Analysing...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            {aiReport ? "Re-analyse" : "Generate AI Report"}</>
                        )}
                    </button>
                </div>

                {/* Panel body */}
                <div className="px-6 py-5">
                    {/* Not yet generated */}
                    {!aiReport && !aiReportLoading && !aiReportError && (
                        <div className="text-center py-8 text-slate-600">
                            <span className="material-symbols-outlined text-[40px] mb-2 block">smart_toy</span>
                            <p className="text-sm">Click &quot;Generate AI Report&quot; to get a Gemini-powered integrity assessment of this session.</p>
                        </div>
                    )}

                    {/* Error */}
                    {aiReportError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                            {aiReportError}
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {aiReportLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-8 bg-white/5 rounded-xl animate-pulse" style={{ width: `${70 + i * 10}%` }} />
                            ))}
                        </div>
                    )}

                    {/* Report */}
                    {aiReport && !aiReportLoading && (() => {
                        const vcfg = VERDICT_CONFIG[aiReport.verdict] || VERDICT_CONFIG.SUSPICIOUS;
                        const rcfg = RECOMMENDATION_CONFIG[aiReport.recommendation] || RECOMMENDATION_CONFIG.MANUAL_REVIEW;
                        return (
                            <div className="space-y-5">
                                {/* Verdict + recommendation row */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${vcfg.bg} ${vcfg.color} ${vcfg.border}`}>
                                        <span className={`w-2 h-2 rounded-full ${vcfg.dot}`} />
                                        {vcfg.label}
                                    </span>
                                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${rcfg.bg} ${rcfg.color} ${rcfg.border}`}>
                                        Recommendation: {rcfg.label}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-auto">
                                        Confidence: {Math.round(aiReport.confidence * 100)}%
                                    </span>
                                </div>

                                {/* Headline */}
                                <p className="text-white font-semibold text-sm leading-relaxed">{aiReport.headline}</p>

                                {/* Risk factors + positive indicators */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {aiReport.riskFactors.length > 0 && (
                                        <div className="rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Risk Factors</p>
                                            <div className="space-y-3">
                                                {aiReport.riskFactors.map((rf, i) => (
                                                    <div key={i}>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className={`text-xs font-bold ${SEVERITY_COLOR[rf.severity]}`}>{rf.factor}</span>
                                                            <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${SEVERITY_COLOR[rf.severity]} opacity-60 border border-current`}>{rf.severity}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500">{rf.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {aiReport.positiveIndicators.length > 0 && (
                                        <div className="rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Positive Indicators</p>
                                            <ul className="space-y-2">
                                                {aiReport.positiveIndicators.map((p, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                                                        <span className="material-symbols-outlined text-[14px] text-green-400 shrink-0 mt-0.5">check_circle</span>
                                                        {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Detailed reasoning */}
                                <div className="rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] p-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Analysis</p>
                                    <p className="text-[12px] text-slate-400 leading-relaxed whitespace-pre-line">{aiReport.reasoning}</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Violation Timeline */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                        Violation Timeline
                        {activeFilter && (
                            <span className="ml-2 text-sm font-normal text-primary-light">
                                (Filtered: {VIOLATION_TYPE_LABELS[activeFilter]})
                            </span>
                        )}
                    </h2>
                    {activeFilter && (
                        <button
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>

                {vlLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <ViolationTimeline
                        violations={filteredViolations}
                        startTime={session.startTime}
                    />
                )}
            </div>
        </div>
    );
}
