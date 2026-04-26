"use client";
import { useEffect, useState } from "react";

/**
 * Hook to persist candidate exam state (status, end state) to localStorage.
 * Ensures that accidental refreshes or network failures don't lose the "Exam Ended" state.
 */
export function useCandidatePersistence(sessionId: string | undefined) {
    const storageKey = `candidate_exam:${sessionId}`;

    const [persistedState, setPersistedState] = useState<{
        examEnded: boolean;
        lastStartTime?: string;
    } | null>(null);

    // Initial load
    useEffect(() => {
        if (!sessionId) return;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setPersistedState(JSON.parse(stored)), 0);
        }
    }, [sessionId, storageKey]);

    const saveState = (state: { examEnded: boolean; lastStartTime?: string }) => {
        if (!sessionId) return;
        localStorage.setItem(storageKey, JSON.stringify(state));
        setPersistedState(state);
    };

    const clearPersistedState = () => {
        if (!sessionId) return;
        localStorage.removeItem(storageKey);
    };

    return { persistedState, saveState, clearPersistedState };
}
