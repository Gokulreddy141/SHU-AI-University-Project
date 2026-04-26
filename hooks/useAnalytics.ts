"use client";
import { useState, useEffect, useCallback } from "react";
import { AnalyticsData } from "@/types/reports";
import { getCached, setCache, isFresh } from "@/lib/clientCache";

const CACHE_KEY = "analytics";

export function useAnalytics() {
    const cached = getCached<AnalyticsData>(CACHE_KEY);

    const [data, setData] = useState<AnalyticsData | null>(cached);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            const recruiterId = stored ? (JSON.parse(stored)._id || "") : "";
            const res = await fetch(`/api/reports/analytics${recruiterId ? `?recruiterId=${recruiterId}` : ""}`);
            if (!res.ok) throw new Error("Failed to fetch analytics");
            const json = await res.json();
            setData(json);
            setCache(CACHE_KEY, json);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (cached && isFresh(CACHE_KEY)) return;
        fetchAnalytics(!!cached);
    }, [fetchAnalytics, cached]);

    return { data, loading, error, refetch: () => fetchAnalytics(false) };
}
