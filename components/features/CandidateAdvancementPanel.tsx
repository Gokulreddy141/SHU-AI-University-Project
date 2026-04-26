"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CandidateAdvancementPanelProps {
    sessionId: string;
    sessionStatus: string;
    examScore?: number;
    maxScore?: number;
    integrityScore: number;
    advancedToSessionId?: string;
    hasNextStage: boolean;
}

export function CandidateAdvancementPanel({
    sessionId,
    sessionStatus,
    examScore,
    maxScore,
    integrityScore,
    advancedToSessionId,
    hasNextStage,
}: CandidateAdvancementPanelProps) {
    const router = useRouter();
    const [scheduledAt, setScheduledAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newSessionId, setNewSessionId] = useState<string | null>(advancedToSessionId || null);

    const isCompleted = sessionStatus === "completed" || sessionStatus === "flagged";

    // Don't render if exam isn't finished, or if there's no next stage
    if (!isCompleted) return null;
    if (!hasNextStage && !newSessionId) return null;

    const handleAdvance = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/session/${sessionId}/advance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scheduledAt: scheduledAt || new Date().toISOString(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to advance candidate");
                return;
            }
            setNewSessionId(data.newSession._id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setLoading(false);
        }
    };

    // Already advanced state
    if (newSessionId) {
        return (
            <div className="bg-green-900/20 border border-green-700/50 rounded-2xl p-6 mt-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-green-400">Candidate Advanced</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                    This candidate has been moved to the live interview round.
                </p>
                <button
                    onClick={() => router.push(`/dashboard/session/${newSessionId}`)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                >
                    View Interview Session →
                </button>
            </div>
        );
    }

    // Advancement form
    const percentage = maxScore && maxScore > 0 ? Math.round(((examScore || 0) / maxScore) * 100) : null;

    return (
        <div className="bg-indigo-900/20 border border-indigo-700/50 rounded-2xl p-6 mt-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Advance to Interview Round</h3>
                    <p className="text-gray-400 text-sm">
                        {percentage !== null
                            ? `This candidate scored ${percentage}% with an integrity score of ${integrityScore}.`
                            : `Integrity score: ${integrityScore}.`}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex items-end gap-4">
                <div className="flex-1 max-w-xs">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        Schedule Interview (optional)
                    </label>
                    <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                    />
                </div>
                <button
                    onClick={handleAdvance}
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-900/30 disabled:opacity-50 transition whitespace-nowrap"
                >
                    {loading ? "Advancing..." : "🚀 Advance Candidate"}
                </button>
            </div>

            {error && (
                <p className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}
        </div>
    );
}
