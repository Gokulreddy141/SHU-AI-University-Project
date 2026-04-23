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

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
    const r = (size / 2) - 10;
    const circ = 2 * Math.PI * r;
    const fill = Math.max(0, Math.min(1, score / 100));
    const color =
        score >= 80 ? "#4ade80" :
        score >= 50 ? "#facc15" :
        "#f87171";

    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="#1f1f1f" strokeWidth={8} />
            <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={8}
                strokeDasharray={`${fill * circ} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease" }} />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
                fill="white" fontSize={size / 5} fontWeight="bold"
                className="rotate-90" style={{ transform: `rotate(90deg)`, transformOrigin: "center" }}>
                {score}
            </text>
        </svg>
    );
}

function emotionColor(e: string) {
    if (e === "stressed")  return "bg-red-500/15 text-red-400 border-red-500/20";
    if (e === "confused")  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
    if (e === "anxious")   return "bg-orange-500/15 text-orange-400 border-orange-500/20";
    return "bg-white/5 text-gray-500 border-white/10";
}

function attentionColor(s: number) {
    if (s >= 70) return "bg-green-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-red-500";
}

function riskColor(r?: string) {
    if (r === "critical") return "text-red-400 bg-red-500/10 border-red-500/30";
    if (r === "high")     return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (r === "moderate") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
}

function formatDuration(startStr?: string, endStr?: string): string {
    if (!startStr || !endStr) return "—";
    const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
}

export default function ExamCompletePage() {
    const { id: sessionId } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<SessionResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) return;
        // Poll until the session shows as completed (Gemini report may take a moment)
        let attempts = 0;
        const poll = async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}`);
                if (!res.ok) return;
                const data: SessionResult = await res.json();
                setSession(data);
                setLoading(false);

                // If AI report not yet ready and status is completed, retry up to 5 times
                if (!data.aiReport?.summary && data.status === "completed" && attempts < 5) {
                    attempts++;
                    setTimeout(poll, 3000);
                }
            } catch {
                setLoading(false);
            }
        };
        poll();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-[#e67e5c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Finalising your session…</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-gray-400">
                <p>Session not found.</p>
            </div>
        );
    }

    const isFlagged = session.status === "flagged";
    const examTitle = session.examId?.title ?? "Exam";
    const candidateName = session.candidateId?.name;
    const timeTaken = formatDuration(session.startTime, session.endTime);
    const avgAttention = session.attentionData && session.attentionData.length > 0
        ? Math.round(session.attentionData.reduce((s, d) => s + d.attentionScore, 0) / session.attentionData.length)
        : null;

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            {/* Top bar */}
            <header className="border-b border-white/10 bg-[#111]/80 backdrop-blur-xl px-6 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-gradient-to-br from-[#e67e5c] to-[#c96a4c] flex items-center justify-center text-[11px] font-bold">
                    II
                </div>
                <span className="text-sm font-semibold text-white">InterviewIntegrity</span>
                <span className="text-white/20 mx-1">·</span>
                <span className="text-sm text-gray-400">Session Report</span>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-12">

                {/* Hero — camera stopped confirmation */}
                <div className="text-center mb-12">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl
                        ${isFlagged ? "bg-red-500/10 ring-2 ring-red-500/30" : "bg-green-500/10 ring-2 ring-green-500/30"}`}>
                        {isFlagged ? "⚠" : "✓"}
                    </div>

                    <h1 className="text-3xl font-bold mb-2">
                        {isFlagged ? "Session Flagged" : "Exam Complete"}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {candidateName && <span className="text-white">{candidateName} · </span>}
                        {examTitle}
                    </p>

                    {/* Camera stopped badge */}
                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-gray-600" />
                        Camera &amp; microphone stopped
                    </div>
                </div>

                {/* Score cards */}
                <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
                    {/* Integrity score */}
                    <div className="col-span-2 p-6 rounded-2xl bg-[#1a1a1a] border border-[#3b3b3b] flex items-center gap-6">
                        <ScoreRing score={session.integrityScore} size={96} />
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Integrity Score</p>
                            <p className="text-3xl font-bold">{session.integrityScore}<span className="text-gray-500 text-lg">/100</span></p>
                            <p className={`text-xs mt-1 font-semibold ${
                                session.integrityScore >= 80 ? "text-green-400" :
                                session.integrityScore >= 50 ? "text-yellow-400" : "text-red-400"
                            }`}>
                                {session.integrityScore >= 80 ? "Clean session" :
                                 session.integrityScore >= 50 ? "Some concerns" : "High risk"}
                            </p>
                        </div>
                    </div>

                    {/* Exam score */}
                    <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#3b3b3b]">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Exam Score</p>
                        {session.maxScore ? (
                            <>
                                <p className="text-2xl font-bold">{session.examScore ?? 0}<span className="text-gray-500 text-sm">/{session.maxScore}</span></p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {session.gradingStatus === "auto_graded" ? "Auto-graded" :
                                     session.gradingStatus === "manual_review_required" ? "Pending review" : "—"}
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-600 text-sm mt-2">Pending</p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#3b3b3b] space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Time Taken</p>
                            <p className="text-sm font-semibold">{timeTaken}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Violations</p>
                            <p className={`text-sm font-semibold ${session.totalViolations > 0 ? "text-red-400" : "text-green-400"}`}>
                                {session.totalViolations}
                            </p>
                        </div>
                    </div>
                </div>

                {/* AI Integrity Report */}
                {session.aiReport?.summary ? (
                    <div className="mb-8 p-5 rounded-2xl bg-[#1a1a1a] border border-[#3b3b3b]">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <span className="text-purple-400">✦</span>
                                AI Integrity Report
                            </h2>
                            {session.aiReport.riskLevel && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskColor(session.aiReport.riskLevel)}`}>
                                    {session.aiReport.riskLevel.toUpperCase()} RISK
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed mb-3">{session.aiReport.summary}</p>
                        {session.aiReport.flags && session.aiReport.flags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {session.aiReport.flags.map((f, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    session.status === "completed" && (
                        <div className="mb-8 p-4 rounded-2xl bg-[#1a1a1a] border border-dashed border-white/10 text-center">
                            <div className="w-5 h-5 border border-purple-500/50 border-t-purple-400 rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs text-gray-500">AI report generating…</p>
                        </div>
                    )
                )}

                {/* Attention per question */}
                {session.attentionData && session.attentionData.length > 0 && (
                    <div className="mb-8 p-5 rounded-2xl bg-[#1a1a1a] border border-[#3b3b3b]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <span className="text-blue-400">◎</span>
                                Attention &amp; Focus per Question
                            </h2>
                            {avgAttention !== null && (
                                <span className="text-xs text-gray-500 font-mono">avg {avgAttention}/100</span>
                            )}
                        </div>
                        <div className="space-y-3">
                            {session.attentionData.map((d, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-6 shrink-0 font-mono">Q{i + 1}</span>
                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${attentionColor(d.attentionScore)}`}
                                            style={{ width: `${d.attentionScore}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-gray-400 w-8 text-right shrink-0">{d.attentionScore}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${emotionColor(d.dominantEmotion)}`}>
                                        {d.dominantEmotion}
                                    </span>
                                    <span className="text-[10px] text-gray-600 shrink-0">{d.timeSpentSeconds}s</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* What happens next */}
                <div className="mb-10 p-5 rounded-2xl bg-white/[0.03] border border-white/8">
                    <h2 className="text-sm font-bold mb-3 text-gray-300">What happens next</h2>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-[#e67e5c] mt-0.5 shrink-0">→</span>
                            The recruiter will review your session and integrity report.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#e67e5c] mt-0.5 shrink-0">→</span>
                            {session.gradingStatus === "manual_review_required"
                                ? "Coding answers require manual review — results will be shared soon."
                                : "Your exam score has been automatically calculated."}
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#e67e5c] mt-0.5 shrink-0">→</span>
                            You will be notified of the outcome via email or the dashboard.
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => router.push("/candidate/dashboard")}
                        className="flex-1 py-3 rounded-xl bg-[#e67e5c] hover:bg-[#eb9478] font-semibold text-white transition-colors"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => router.push("/candidate/verify")}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition-colors border border-white/10"
                    >
                        Take Another Exam
                    </button>
                </div>
            </div>
        </div>
    );
}
