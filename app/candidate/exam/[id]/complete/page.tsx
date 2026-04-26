"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface AttentionItem {
    questionId: string;
    attentionScore: number;
    dominantEmotion: string;
    timeSpentSeconds: number;
}

interface SessionResult {
    _id: string;
    status: string;
    startTime?: string;
    endTime?: string;
    integrityScore: number;
    totalViolations: number;
    examScore?: number;
    maxScore?: number;
    gradingStatus?: string;
    attentionData?: AttentionItem[];
    examId?: { title?: string; duration?: number };
    candidateId?: { name?: string };
    aiReport?: {
        summary?: string;
        riskLevel?: string;
        flags?: string[];
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
    const r = size / 2 - 10;
    const circ = 2 * Math.PI * r;
    const fill = Math.max(0, Math.min(1, score / 100));
    const color = score >= 80 ? "#4ade80" : score >= 50 ? "#facc15" : "#f87171";

    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="#262626" strokeWidth={8} />
            <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={8}
                strokeDasharray={`${fill * circ} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1.2s ease" }} />
            <text
                x="50%" y="50%"
                dominantBaseline="middle" textAnchor="middle"
                fill="white" fontSize={size / 4.5} fontWeight="bold"
                style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
                {score}
            </text>
        </svg>
    );
}

function emotionBadge(e: string) {
    const map: Record<string, string> = {
        stressed:  "bg-red-500/15 text-red-400 border-red-500/20",
        confused:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
        anxious:   "bg-orange-500/15 text-orange-400 border-orange-500/20",
        focused:   "bg-green-500/15 text-green-400 border-green-500/20",
        calm:      "bg-blue-500/15 text-blue-400 border-blue-500/20",
    };
    return map[e] ?? "bg-white/5 text-gray-500 border-white/10";
}

function attentionBar(s: number) {
    if (s >= 70) return "bg-green-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-red-400";
}

function formatDuration(startStr?: string, endStr?: string): string {
    if (!startStr || !endStr) return "—";
    const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
    if (ms <= 0) return "—";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
}

function formatTime(isoStr?: string): string {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoStr?: string): string {
    if (!isoStr) return "";
    return new Date(isoStr).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

// Returns true only if attention data has at least one meaningful (non-zero) entry
function hasAttentionData(data?: AttentionItem[]): boolean {
    if (!data || data.length === 0) return false;
    return data.some(d => d.attentionScore > 0 || d.timeSpentSeconds > 5);
}

function calcAvgAttention(data: AttentionItem[]): number | null {
    const valid = data.filter(d => d.attentionScore > 0);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((s, d) => s + d.attentionScore, 0) / valid.length);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamCompletePage() {
    const { id: sessionId } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<SessionResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        let attempts = 0;

        const poll = async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}`);
                if (!res.ok) {
                    setError(res.status === 404 ? "Session not found." : "Unable to load session.");
                    setLoading(false);
                    return;
                }
                const data: SessionResult = await res.json();
                setSession(data);
                setLoading(false);

                // Retry up to 5× while AI report is still generating
                if (!data.aiReport?.summary && data.status === "completed" && attempts < 5) {
                    attempts++;
                    setTimeout(poll, 3000);
                }
            } catch {
                setError("Network error — please refresh.");
                setLoading(false);
            }
        };

        poll();
    }, [sessionId]);

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-[#e67e5c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Finalising your session…</p>
                    <p className="text-gray-600 text-xs mt-1">This takes a few seconds</p>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error || !session) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 ring-2 ring-red-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <p className="text-white font-semibold mb-1">{error ?? "Session not found"}</p>
                    <p className="text-gray-500 text-sm mb-6">Please contact support if this issue persists.</p>
                    <button
                        onClick={() => router.push("/candidate/dashboard")}
                        className="px-5 py-2.5 rounded-xl bg-[#e67e5c] hover:bg-[#eb9478] text-white text-sm font-semibold transition-colors">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── Derived values ──
    const isFlagged   = session.status === "flagged";
    const isCompleted = session.status === "completed" || isFlagged;
    const examTitle   = session.examId?.title?.trim() || "Exam";
    const candidateName = session.candidateId?.name?.trim();
    const timeTaken   = formatDuration(session.startTime, session.endTime);
    const submittedAt = formatTime(session.endTime);
    const submittedDate = formatDate(session.endTime);

    const showAttention = hasAttentionData(session.attentionData);
    const avgAttention  = session.attentionData ? calcAvgAttention(session.attentionData) : null;

    const scoreLabel =
        session.integrityScore >= 80 ? "Clean session"  :
        session.integrityScore >= 60 ? "Minor concerns" :
        session.integrityScore >= 40 ? "Under review"   : "Needs review";

    const scoreColor =
        session.integrityScore >= 80 ? "text-green-400"  :
        session.integrityScore >= 60 ? "text-yellow-400" :
        session.integrityScore >= 40 ? "text-orange-400" : "text-red-400";

    const examScorePercent =
        session.maxScore && session.maxScore > 0 && session.examScore != null
            ? Math.round((session.examScore / session.maxScore) * 100)
            : null;

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">

            {/* Header */}
            <header className="border-b border-white/8 bg-[#111]/80 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-gradient-to-br from-[#e67e5c] to-[#c96a4c] flex items-center justify-center text-[10px] font-bold tracking-tight">
                    II
                </div>
                <span className="text-sm font-semibold">InterviewIntegrity</span>
                <span className="text-white/20 mx-1">·</span>
                <span className="text-sm text-gray-400">Session Report</span>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-16">

                {/* ── Hero ── */}
                <div className="text-center mb-10">
                    {/* Status icon */}
                    <div className={`w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center
                        ${isFlagged
                            ? "bg-amber-500/10 ring-2 ring-amber-500/25"
                            : "bg-green-500/10 ring-2 ring-green-500/25"}`}>
                        {isFlagged ? (
                            <svg className="w-9 h-9 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        ) : (
                            <svg className="w-9 h-9 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold mb-2">
                        {isFlagged ? "Session Under Review" : "Exam Submitted"}
                    </h1>

                    <p className="text-gray-400 text-sm">
                        {candidateName && (
                            <span className="text-white font-medium">{candidateName} · </span>
                        )}
                        {examTitle}
                    </p>

                    {/* Submitted at */}
                    {session.endTime && (
                        <p className="text-gray-600 text-xs mt-1">
                            Submitted {submittedDate} at {submittedAt}
                        </p>
                    )}

                    {/* Camera stopped badge */}
                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/5 border border-white/8 text-xs text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
                        Camera &amp; microphone stopped
                    </div>
                </div>

                {/* ── Score Cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">

                    {/* Integrity score — spans 2 cols */}
                    <div className="col-span-2 p-5 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e] flex items-center gap-5">
                        <ScoreRing score={session.integrityScore} size={96} />
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Integrity Score</p>
                            <p className="text-3xl font-bold leading-none">
                                {session.integrityScore}
                                <span className="text-gray-500 text-lg font-normal">/100</span>
                            </p>
                            <p className={`text-xs mt-1.5 font-semibold ${scoreColor}`}>{scoreLabel}</p>
                        </div>
                    </div>

                    {/* Exam score */}
                    <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e] flex flex-col justify-between">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Exam Score</p>
                        {session.maxScore != null && session.maxScore > 0 ? (
                            <>
                                <p className="text-2xl font-bold leading-none">
                                    {session.examScore ?? 0}
                                    <span className="text-gray-500 text-sm font-normal">/{session.maxScore}</span>
                                </p>
                                {examScorePercent !== null && (
                                    <div className="mt-2">
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${
                                                    examScorePercent >= 70 ? "bg-green-500" :
                                                    examScorePercent >= 40 ? "bg-yellow-500" : "bg-red-400"}`}
                                                style={{ width: `${examScorePercent}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {session.gradingStatus === "auto_graded"
                                                ? `${examScorePercent}% · Auto-graded`
                                                : session.gradingStatus === "manual_review_required"
                                                ? "Pending review"
                                                : "—"}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-600 text-sm">Pending</p>
                        )}
                    </div>

                    {/* Time & session info */}
                    <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e] space-y-3">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Time Taken</p>
                            <p className="text-sm font-semibold">{timeTaken}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                isFlagged
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-green-500/10 text-green-400 border-green-500/20"
                            }`}>
                                {isFlagged ? "Under Review" : "Completed"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── AI Integrity Report ── */}
                {session.aiReport?.summary ? (
                    <div className="mb-6 p-5 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e]">
                        <div className="flex items-center justify-between mb-3 gap-3">
                            <h2 className="text-sm font-bold flex items-center gap-2 shrink-0">
                                <span className="text-purple-400">✦</span>
                                AI Integrity Report
                            </h2>
                            {session.aiReport.riskLevel && (
                                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                    session.aiReport.riskLevel === "critical" ? "bg-red-500/10 text-red-400 border-red-500/25" :
                                    session.aiReport.riskLevel === "high"     ? "bg-orange-500/10 text-orange-400 border-orange-500/25" :
                                    session.aiReport.riskLevel === "moderate" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" :
                                    "bg-green-500/10 text-green-400 border-green-500/25"
                                }`}>
                                    {session.aiReport.riskLevel} risk
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed mb-3">{session.aiReport.summary}</p>
                        {session.aiReport.flags && session.aiReport.flags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {session.aiReport.flags.map((f, i) => (
                                    <span key={i} className="px-2.5 py-0.5 text-[11px] rounded-full bg-white/5 text-gray-400 border border-white/10">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : isCompleted && (
                    <div className="mb-6 p-4 rounded-2xl bg-[#1a1a1a] border border-dashed border-white/10 flex items-center gap-3">
                        <div className="w-4 h-4 border border-purple-500/50 border-t-purple-400 rounded-full animate-spin shrink-0" />
                        <p className="text-xs text-gray-500">AI integrity report is being generated…</p>
                    </div>
                )}

                {/* ── Attention per Question ── */}
                {showAttention && session.attentionData ? (
                    <div className="mb-6 p-5 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <span className="text-blue-400">◎</span>
                                Attention &amp; Focus per Question
                            </h2>
                            {avgAttention !== null ? (
                                <span className="text-xs text-gray-400 font-mono tabular-nums">
                                    avg <span className="text-white font-semibold">{avgAttention}</span>/100
                                </span>
                            ) : (
                                <span className="text-xs text-gray-600 font-mono">avg —</span>
                            )}
                        </div>
                        <div className="space-y-2.5">
                            {session.attentionData.map((d, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[11px] text-gray-600 w-6 shrink-0 font-mono">Q{i + 1}</span>

                                    {/* Progress bar */}
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        {d.attentionScore > 0 ? (
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${attentionBar(d.attentionScore)}`}
                                                style={{ width: `${d.attentionScore}%` }}
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-white/5 rounded-full" />
                                        )}
                                    </div>

                                    {/* Score */}
                                    <span className={`text-[11px] font-mono w-8 text-right shrink-0 tabular-nums ${
                                        d.attentionScore > 0 ? "text-gray-400" : "text-gray-600"}`}>
                                        {d.attentionScore > 0 ? d.attentionScore : "—"}
                                    </span>

                                    {/* Emotion */}
                                    {d.dominantEmotion && d.dominantEmotion !== "neutral" ? (
                                        <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${emotionBadge(d.dominantEmotion)}`}>
                                            {d.dominantEmotion}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] w-14 text-gray-700 shrink-0 text-center">—</span>
                                    )}

                                    {/* Time */}
                                    <span className="text-[10px] text-gray-600 shrink-0 w-8 text-right tabular-nums">
                                        {d.timeSpentSeconds > 0 ? `${d.timeSpentSeconds}s` : "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : session.attentionData && session.attentionData.length > 0 && (
                    // Attention data exists but all zeros — show a neutral empty state
                    <div className="mb-6 p-5 rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e]">
                        <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                            <span className="text-blue-400">◎</span>
                            Attention &amp; Focus per Question
                        </h2>
                        <p className="text-xs text-gray-600 text-center py-4">
                            Attention tracking data was not captured for this session.
                        </p>
                    </div>
                )}

                {/* ── What Happens Next ── */}
                <div className="mb-8 rounded-2xl bg-white/[0.025] border border-white/8 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/8">
                        <h2 className="text-sm font-bold text-gray-300">What happens next</h2>
                    </div>
                    <ul className="divide-y divide-white/5">
                        <li className="flex items-start gap-3 px-5 py-3.5">
                            <span className="mt-0.5 text-[#e67e5c] shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <span className="text-sm text-gray-400">
                                Your exam responses have been securely saved and submitted.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 px-5 py-3.5">
                            <span className="mt-0.5 text-[#e67e5c] shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </span>
                            <span className="text-sm text-gray-400">
                                {session.gradingStatus === "manual_review_required"
                                    ? "Your answers require manual review — results will be shared by the recruiter shortly."
                                    : session.gradingStatus === "auto_graded"
                                    ? "Your exam has been automatically graded. The recruiter will review results soon."
                                    : "The recruiter will review and grade your submission."}
                            </span>
                        </li>
                        <li className="flex items-start gap-3 px-5 py-3.5">
                            <span className="mt-0.5 text-[#e67e5c] shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </span>
                            <span className="text-sm text-gray-400">
                                You will be notified of the outcome via email or your candidate dashboard.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* ── Session ID (for support reference) ── */}
                <div className="mb-8 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/6 flex items-center justify-between gap-4">
                    <span className="text-[11px] text-gray-600">Session reference</span>
                    <span className="text-[11px] text-gray-500 font-mono truncate">{String(sessionId)}</span>
                </div>

                {/* ── Actions ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => router.push("/candidate/dashboard")}
                        className="flex-1 py-3 rounded-xl bg-[#e67e5c] hover:bg-[#eb9478] font-semibold text-white transition-colors text-sm">
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => router.push("/support")}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300 font-semibold transition-colors border border-white/10 text-sm">
                        Contact Support
                    </button>
                </div>

            </div>
        </div>
    );
}
