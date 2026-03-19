"use client";
import { useState, useEffect, useCallback } from "react";
import { getCached, setCache, isFresh } from "@/lib/clientCache";
import { IExamSession } from "@/types/session";

/**
 * Hook to fetch single session details with SWR caching.
 * Tier 1 (0-30s): Returns cached data instantly, no network request.
 * Tier 2 (30s-2m): Returns cached data instantly, background refresh.
 * Tier 3 (>2m): Treat as first load.
 */
export function useSessionDetail(sessionId: string | undefined) {
    const cacheKey = `session:${sessionId}`;
    const cached = sessionId ? getCached<IExamSession>(cacheKey) : null;

    const [fetchedSession, setFetchedSession] = useState<IExamSession | null>(null);
    const [isNetworkFetching, setIsNetworkFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived State (The core of the optimized pattern)
    // Synchronously grab cache. If it exists, we are NOT loading, even if the network is fetching.
    const activeSession = fetchedSession || cached || null;

    // We are only "loading" if we have absolutely no data to show yet, AND we are actively fetching
    const loading = !cached && isNetworkFetching;

    const fetchSession = useCallback(async () => {
        if (!sessionId) return;
        setIsNetworkFetching(true);
        setError(null);

        try {
            const res = await fetch(`/api/session/${sessionId}`);
            if (!res.ok) throw new Error("Failed to fetch session details");
            const data = await res.json();

            setFetchedSession(data);
            setCache(cacheKey, data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setIsNetworkFetching(false);
        }
    }, [sessionId, cacheKey]);

    useEffect(() => {
        if (!sessionId) return;

        // TIER 1: Hot cache check (30 seconds)
        if (cached && isFresh(cacheKey, 30000)) {
            // Already hot, no need to even ping the network
            return;
        }

        // TIER 2: Stale hit or Cold start
        fetchSession();
    }, [sessionId, fetchSession, cached, cacheKey]);

    return {
        session: activeSession,
        loading,
        error,
        refetch: fetchSession
    };
}
