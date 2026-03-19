"use client";
import { useState, useEffect, useCallback } from "react";
import { IViolation } from "@/types/violation";
import { getCached, setCache, isFresh } from "@/lib/clientCache";

export function useViolationLog(sessionId: string, typeFilter: string | null = null) {
    const cacheKey = `violations:${sessionId}:${typeFilter || "all"}`;
    const cached = sessionId ? getCached<IViolation[]>(cacheKey) : null;

    const [violations, setViolations] = useState<IViolation[]>(cached || []);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);

    const fetchViolations = useCallback(async (silent = false) => {
        if (!sessionId) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const url = typeFilter
                ? `/api/violation/${sessionId}?type=${typeFilter}&limit=100`
                : `/api/violation/${sessionId}?limit=100`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch violations");
            const data = await res.json();

            const logs = data.violations || [];
            setViolations(logs);
            setCache(cacheKey, logs);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [sessionId, typeFilter, cacheKey]);

    useEffect(() => {
        if (!sessionId) return;

        // TIER 1: Hot cache (30s)
        if (cached && isFresh(cacheKey, 30000)) {
            return;
        }

        fetchViolations(!!cached);
    }, [sessionId, fetchViolations, cached, cacheKey]);

    return { violations, loading, error, refetch: () => fetchViolations(false) };
}
