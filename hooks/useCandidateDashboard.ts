"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ICandidateSession } from "@/types/session";

export const useCandidateDashboard = (candidateId?: string) => {
    const [sessions, setSessions] = useState<ICandidateSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!candidateId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/session/candidate/${candidateId}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to fetch sessions");
            }

            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Something went wrong fetching sessions";
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [candidateId]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Categorize sessions into Pending and Completed for the UI
    const { pendingSessions, completedSessions } = useMemo(() => {
        const pending: ICandidateSession[] = [];
        const completed: ICandidateSession[] = [];

        sessions.forEach((session) => {
            // Treat anything not finalized as pending (biometric, in progress, flagged, pending)
            // But if it's explicitly completed or graded, it goes to completed.
            if (["completed", "graded", "flagged"].includes(session.status) && session.gradingStatus === "finalized") {
                completed.push(session);
            } else if (["completed"].includes(session.status)) {
                completed.push(session);
            } else {
                pending.push(session);
            }
        });

        return { pendingSessions: pending, completedSessions: completed };
    }, [sessions]);

    return {
        sessions,
        pendingSessions,
        completedSessions,
        loading,
        error,
        refetch: fetchSessions,
    };
};
