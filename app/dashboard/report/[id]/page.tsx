"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import IntegrityScoreBadge from "@/components/features/IntegrityScoreBadge";
import ViolationTimeline from "@/components/features/ViolationTimeline";
import { useViolationLog } from "@/hooks/useViolationLog";
import { useSessionDetail } from "@/hooks/useSessionDetail";
import { IViolation } from "@/types/violation";

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
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const { session, loading: sessionLoading, error: sessionError } = useSessionDetail(sessionId as string);
    const { violations, loading: vlLoading } = useViolationLog(sessionId as string, activeFilter);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) queueMicrotask(() => setUser(JSON.parse(stored)));
    }, []);

    const loading = sessionLoading;
    const fetchError = sessionError;

    const filteredViolations = activeFilter
        ? violations.filter((v: IViolation) => v.type === activeFilter)
        : violations;

    if (loading) {
        return (
            <DashboardShell userName={user?.name} userRole={user?.role}>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </DashboardShell>
        );
    }

    if (!session) {
        return (
            <DashboardShell userName={user?.name} userRole={user?.role}>
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
            </DashboardShell>
        );
    }

    if (!session) return null;

    // Use type casting for populated fields
    const candidate = session.candidateId as unknown as { name: string; email: string };
    const exam = session.examId as unknown as { title: string };

    return (
        <DashboardShell userName={user?.name} userRole={user?.role}>
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
        </DashboardShell>
    );
}
