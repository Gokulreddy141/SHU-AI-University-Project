"use client";
import { useState, useCallback, useEffect } from "react";
import { DashboardMetrics } from "@/types/dashboard";
import { getCached, setCache, isFresh } from "@/lib/clientCache";

export interface DashboardSession {
    _id: string;
    status: string;
    integrityScore: number;
    totalViolations: number;
    createdAt: string;
    startTime?: string;
    candidateId: { _id: string; name: string; email: string };
    examId: { _id: string; title: string; duration: number };
    violationSummary: Record<string, number>;
}

interface DashboardCache {
    metrics: DashboardMetrics;
    sessions: DashboardSession[];
}

export function useDashboardData(recruiterId: string | undefined) {
    const cacheKey = `dashboard:${recruiterId}`;
    const cached = recruiterId ? getCached<DashboardCache>(cacheKey) : null;

    const [fetchedMetrics, setFetchedMetrics] = useState<DashboardMetrics | null>(null);
    const [fetchedSessions, setFetchedSessions] = useState<DashboardSession[] | null>(null);
    const [isNetworkFetching, setIsNetworkFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived State (The core of the optimized pattern)
    // Synchronously grab cache. If it exists, we are NOT loading, even if the network is fetching.
    const activeMetrics = fetchedMetrics || cached?.metrics || null;
    const activeSessions = fetchedSessions || cached?.sessions || [];

    // We are only "loading" if we have absolutely no data to show yet, AND we are actively fetching
    const loading = !cached && isNetworkFetching;

    const fetchData = useCallback(async () => {
        if (!recruiterId) return;
        setIsNetworkFetching(true);
        setError(null);
        try {
            const [metricsRes, sessionsRes] = await Promise.all([
                fetch(`/api/dashboard/metrics?recruiterId=${recruiterId}`),
                fetch(`/api/session?recruiterId=${recruiterId}&limit=30`)
            ]);

            if (!metricsRes.ok || !sessionsRes.ok) {
                throw new Error("Failed to fetch dashboard data");
            }

            const metricsData = await metricsRes.json();
            const sessionsData = await sessionsRes.json();

            setFetchedMetrics(metricsData);
            setFetchedSessions(sessionsData.items || []);
            setCache(cacheKey, { metrics: metricsData, sessions: sessionsData.items || [] });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setIsNetworkFetching(false);
        }
    }, [recruiterId, cacheKey]);

    useEffect(() => {
        if (!recruiterId) return;

        // TIER 1: Hot cache (30s)
        if (cached && isFresh(cacheKey, 30000)) {
            return;
        }

        // TIER 2/3: Fetch silently in background if cached
        fetchData();
    }, [fetchData, cached, cacheKey, recruiterId]);

    return {
        metrics: activeMetrics,
        sessions: activeSessions,
        loading,
        error,
        refetch: fetchData
    };
}
