"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import IntegrityScoreBadge from "@/components/features/IntegrityScoreBadge";
import ViolationTimeline from "@/components/features/ViolationTimeline";
import ViolationFilterBar from "@/components/features/ViolationFilterBar";
import StatusBadge from "@/components/ui/StatusBadge";
import LiveViolationFeed from "@/components/features/LiveViolationFeed";
import { useSessionDetail } from "@/hooks/useSessionDetail";
import { useViolationLog } from "@/hooks/useViolationLog";
import { useWebRTC } from "@/hooks/useWebRTC";
import LiveVideoCall from "@/components/features/LiveVideoCall";
import { useAuth } from "@/hooks/useAuth";
import { ExamScoreBadge } from "@/components/features/ExamScoreBadge";
import { CandidateResponseViewer } from "@/components/features/CandidateResponseViewer";
import { useSessionResponses } from "@/hooks/useSessionResponses";
import { CandidateAdvancementPanel } from "@/components/features/CandidateAdvancementPanel";
import LiveCandidateSnapshot from "@/components/features/LiveCandidateSnapshot";
import LiveAISignalsPanel from "@/components/features/LiveAISignalsPanel";

export default function LiveSessionPage() {
    const { id: sessionId } = useParams();
    const router = useRouter();

    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const { session, loading: sessionLoading, refetch: refetchSession } = useSessionDetail(sessionId as string);
    const { violations } = useViolationLog(sessionId as string, activeFilter);
    const { responses } = useSessionResponses(sessionId as string);

    const { user, isHydrated } = useAuth("recruiter");


    const [elapsed, setElapsed] = useState(0);
    const [analyzingAnswers, setAnalyzingAnswers] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

    // Poll session status while active
    useEffect(() => {
        if (!session) return;
        
        // Initial set
        const startTime = session.startTime;
        if (startTime) {
            queueMicrotask(() => {
                setElapsed(Math.round((Date.now() - new Date(startTime).getTime()) / 60000));
            });
        }

        if (session.status === "completed" || session.status === "flagged") return;

        const interval = setInterval(() => {
            refetchSession();
            const currentStartTime = session.startTime;
            if (currentStartTime) {
                setElapsed(Math.round((Date.now() - new Date(currentStartTime).getTime()) / 60000));
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [session, refetchSession]);

    // ── WebRTC Live Video Interview ──
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const {
        callStatus,
        remoteStream,
        remoteTelemetry,
        initiateCall,
        acceptCall,
        endCall
    } = useWebRTC(
        sessionId as string,
        user?._id || "",
        (session?.candidateId as unknown as { _id: string })?._id || null, // We call the candidate
        localStream
    );

    const handleCallCandidate = async () => {
        try {
            // Step 1: Attempt High-Fidelity Call (Video + Audio)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: { echoCancellation: true, noiseSuppression: true } // Mitigate audio echo feedback
            });
            setLocalStream(stream);
            initiateCall();
        } catch (err) {
            console.warn("Video failed, trying audio-only fallback...", err);
            try {
                // Step 2: Graceful Degradation (Audio Only)
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true }
                });
                setLocalStream(audioStream);
                initiateCall();
            } catch (audioErr) {
                console.error("Complete media failure:", audioErr);
                alert("Microphone permission is strictly required to call the candidate.");
            }
        }
    };

    const handleEndCall = () => {
        endCall();
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }
    };

    const handleAnalyzeAnswers = async () => {
        setAnalyzingAnswers(true);
        setAnalyzeError(null);
        try {
            const res = await fetch(`/api/session/${sessionId}/analyze-answers`, { method: "POST" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as { message?: string }).message || "Analysis failed");
            }
            await refetchSession();
        } catch (err: unknown) {
            setAnalyzeError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setAnalyzingAnswers(false);
        }
    };

    const loading = !session && sessionLoading; // Only show main loader if we have NO cached session data

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                <p className="text-xl mb-2">Session not found</p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-primary-light hover:text-primary-lighter text-sm"
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    if (!isHydrated || !user) return null;

    const isLive = session.status === "in_progress";

    const candidate = session.candidateId as unknown as { name: string; email: string };
    const exam = session.examId as unknown as { title: string; sessionCode: string };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-xs text-gray-500 hover:text-gray-300 mb-2 inline-block"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {exam.title || "Exam Session"}
                            <StatusBadge status={session.status} size="md" />
                            {isLive && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                    LIVE
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Candidate: <span className="text-white">{candidate.name}</span>
                            {" · "}
                            {candidate.email}
                            {isLive && ` · ${elapsed} min elapsed`}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {isLive && (
                            <button
                                onClick={callStatus === "idle" ? handleCallCandidate : handleEndCall}
                                className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors ${callStatus === "idle"
                                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                                    }`}
                            >
                                {callStatus === "idle" ? "📞 Call Candidate" : "End Call"}
                            </button>
                        )}
                        {(session.gradingStatus && session.maxScore) ? (
                            <ExamScoreBadge
                                score={session.examScore || 0}
                                maxScore={session.maxScore || 0}
                                status={session.gradingStatus}
                            />
                        ) : null}
                        <IntegrityScoreBadge score={session.integrityScore} size="lg" />
                    </div>
                </div>

                {/* WebRTC Live Video Call PiP (draggable) */}
                <LiveVideoCall
                    callStatus={callStatus}
                    remoteStream={remoteStream}
                    remoteTelemetry={remoteTelemetry}
                    isRecruiter={true}
                    onAccept={acceptCall}
                    onDecline={handleEndCall}
                    onEndCall={handleEndCall}
                />

                {/* Stats grid */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    {[
                        { label: "Total Violations", value: session.totalViolations, color: session.totalViolations > 0 ? "text-red-400" : "text-green-400" },
                        { label: "App Switch (Blur)", value: session.violationSummary.windowBlur, color: "text-amber-400" },
                        { label: "Fullscreen Exit", value: session.violationSummary.fullscreenExit, color: "text-red-400" },
                        { label: "Shortcuts", value: session.violationSummary.keyboardShortcut, color: "text-primary-light" },
                        { label: "Clipboard", value: session.violationSummary.clipboardPaste, color: "text-blue-400" },
                    ].map((stat) => (
                        <div key={stat.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.value > 0 ? stat.color : "text-gray-600"}`}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── AI Report Card (post-session) ── */}
                {(session.aiReport?.summary || session.attentionData?.length || session.answerAnalysis?.length) && (
                    <div className="mb-8 grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Post-Session AI Report */}
                        {session.aiReport?.summary && (
                            <div className="p-5 rounded-2xl bg-[#0f0f0f] border border-[#3b3b3b]">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        <span className="text-purple-400">✦</span>
                                        AI Integrity Report
                                    </h2>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        session.aiReport.riskLevel === "critical" ? "bg-red-500/20 text-red-400" :
                                        session.aiReport.riskLevel === "high" ? "bg-orange-500/20 text-orange-400" :
                                        session.aiReport.riskLevel === "moderate" ? "bg-yellow-500/20 text-yellow-400" :
                                        "bg-green-500/20 text-green-400"
                                    }`}>
                                        {session.aiReport.riskLevel?.toUpperCase() ?? "—"} RISK
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 mb-3 leading-relaxed">{session.aiReport.summary}</p>
                                {session.aiReport.flags && session.aiReport.flags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {session.aiReport.flags.map((flag, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10">
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {session.aiReport.generatedAt && (
                                    <p className="text-xs text-gray-600 mt-3">
                                        Generated {new Date(session.aiReport.generatedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Per-Question Attention Data */}
                        {session.attentionData && session.attentionData.length > 0 && (
                            <div className="p-5 rounded-2xl bg-[#0f0f0f] border border-[#3b3b3b]">
                                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                    <span className="text-blue-400">◎</span>
                                    Attention per Question
                                </h2>
                                <div className="space-y-2">
                                    {session.attentionData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 w-6">Q{i + 1}</span>
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        d.attentionScore >= 70 ? "bg-green-500" :
                                                        d.attentionScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                                                    }`}
                                                    style={{ width: `${d.attentionScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-400 w-8 text-right">{d.attentionScore}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                d.dominantEmotion === "stressed" ? "bg-red-500/15 text-red-400" :
                                                d.dominantEmotion === "confused" ? "bg-yellow-500/15 text-yellow-400" :
                                                d.dominantEmotion === "anxious" ? "bg-orange-500/15 text-orange-400" :
                                                "bg-white/5 text-gray-500"
                                            }`}>
                                                {d.dominantEmotion}
                                            </span>
                                            <span className="text-xs text-gray-600">{d.timeSpentSeconds}s</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Main monitoring layout: Camera + AI Signals | Violations ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

                    {/* LEFT COLUMN: Camera feed + AI signals */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        {/* Live candidate camera snapshot (updates every 15s from exam page) */}
                        <LiveCandidateSnapshot
                            sessionId={sessionId as string}
                            isLive={isLive}
                        />

                        {/* AI detector status — all 26 detectors, colour-coded */}
                        <LiveAISignalsPanel
                            sessionId={sessionId as string}
                            isLive={isLive}
                        />
                    </div>

                    {/* RIGHT COLUMN: Filter bar + violation feed/timeline */}
                    <div className="xl:col-span-2 flex flex-col gap-4">
                        {/* Filter bar */}
                        <ViolationFilterBar
                            counts={{
                                LOOKING_AWAY: session.violationSummary.lookingAway,
                                MULTIPLE_FACES: session.violationSummary.multipleFaces,
                                NO_FACE: session.violationSummary.noFace,
                                LIP_SYNC_MISMATCH: session.violationSummary.lipSyncMismatch,
                                FACE_MISMATCH: session.violationSummary.faceMismatch,
                                FULLSCREEN_EXIT: session.violationSummary.fullscreenExit,
                                WINDOW_BLUR: session.violationSummary.windowBlur,
                                KEYBOARD_SHORTCUT: session.violationSummary.keyboardShortcut,
                                CLIPBOARD_PASTE: session.violationSummary.clipboardPaste,
                            }}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />

                        {/* Violation timeline / live feed */}
                        <div className="flex-1 bg-[#0f0f0f] border border-[#3b3b3b] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold">
                                    {isLive ? "Live Violation Feed" : "Violation Timeline"}
                                </h2>
                                {isLive && (
                                    <span className="text-xs text-slate-600 font-mono animate-pulse">● auto-refresh 3s</span>
                                )}
                            </div>

                            {isLive ? (
                                <LiveViolationFeed sessionId={sessionId as string} />
                            ) : violations.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <span className="material-symbols-outlined text-4xl mb-3 block">verified_user</span>
                                    <p className="text-lg mb-1">No violations recorded</p>
                                    <p className="text-xs">This candidate had a clean session</p>
                                </div>
                            ) : (
                                <ViolationTimeline
                                    violations={violations}
                                    startTime={session.startTime}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Responses Tab / Section */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">Exam Responses</h2>
                        {session.status !== "in_progress" && (
                            <div className="flex items-center gap-3">
                                {analyzeError && (
                                    <span className="text-xs text-red-400">{analyzeError}</span>
                                )}
                                <button
                                    onClick={handleAnalyzeAnswers}
                                    disabled={analyzingAnswers}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {analyzingAnswers ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Analysing…
                                        </>
                                    ) : (
                                        <>✦ Detect AI-Generated Answers</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI answer analysis results */}
                    {session.answerAnalysis && session.answerAnalysis.length > 0 && (
                        <div className="mb-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                            <p className="text-sm font-semibold text-purple-300 mb-3">AI-Generation Analysis</p>
                            <div className="space-y-2">
                                {session.answerAnalysis.map((a, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                                a.flagged ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                                            }`}>
                                                {Math.round(a.aiProbability * 100)}%
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-xs leading-relaxed">{a.reasoning}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <CandidateResponseViewer responses={responses} />
                </div>

                {/* Advancement Panel */}
                <CandidateAdvancementPanel
                    sessionId={sessionId as string}
                    sessionStatus={session.status}
                    examScore={session.examScore}
                    maxScore={session.maxScore}
                    integrityScore={session.integrityScore}
                    advancedToSessionId={session.advancedToSessionId}
                    hasNextStage={true}
                />
            </div>
    );
}
