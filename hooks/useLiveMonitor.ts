"use client";
import { useState, useEffect, useCallback } from "react";
import { LiveSessionFeed } from "@/types/reports";
import { getCached, setCache } from "@/lib/clientCache";

const CACHE_KEY = "live-monitor";

export function useLiveMonitor() {
    const cached = getCached<{ feeds: LiveSessionFeed[]; activeCount: number }>(CACHE_KEY);

    const [feeds, setFeeds] = useState<LiveSessionFeed[]>(cached?.feeds ?? []);
    const [activeCount, setActiveCount] = useState(cached?.activeCount ?? 0);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);

    const fetchFeeds = useCallback(async () => {
        try {
            // Filter by the logged-in recruiter's ID
            const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            const recruiterId = stored ? (JSON.parse(stored)._id || "") : "";
            const res = await fetch(`/api/live/sessions${recruiterId ? `?recruiterId=${recruiterId}` : ""}`);
            if (!res.ok) throw new Error("Failed to fetch live feeds");
            const json = await res.json();
            const feedsData = json.feeds || [];
            const count = json.activeCount || 0;

            setFeeds(feedsData);
            setActiveCount(count);
            setCache(CACHE_KEY, { feeds: feedsData, activeCount: count });
            setError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Set up polling because this is a "live" war room
    useEffect(() => {
        fetchFeeds(); // Initial fetch (shows cached data instantly if available)
        const interval = setInterval(fetchFeeds, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchFeeds]);

    return { feeds, activeCount, loading, error, refetch: fetchFeeds };
}
