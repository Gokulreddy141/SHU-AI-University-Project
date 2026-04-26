"use client";
import { useState, useEffect, useCallback } from "react";
import { CandidateSummary } from "@/types/candidate";
import { getCached, setCache, isFresh } from "@/lib/clientCache";

interface CandidatesCache {
    candidates: CandidateSummary[];
    total: number;
}

export function useCandidates(recruiterId: string | undefined) {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const cacheKey = `candidates:${recruiterId}:${page}:${debouncedQuery}`;
    const cached = recruiterId ? getCached<CandidatesCache>(cacheKey) : null;

    const [candidates, setCandidates] = useState<CandidateSummary[]>(cached?.candidates ?? []);
    const [total, setTotal] = useState(cached?.total ?? 0);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);

    // Debounce the search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1); // Reset to page 1 on new search
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchCandidates = useCallback(async (silent = false) => {
        if (!recruiterId) return;

        if (!silent) setLoading(true);
        setError(null);
        try {
            const url = new URL("/api/candidates", window.location.origin);
            url.searchParams.set("recruiterId", recruiterId);
            url.searchParams.set("page", page.toString());
            url.searchParams.set("limit", limit.toString());
            if (debouncedQuery) {
                url.searchParams.set("query", debouncedQuery);
            }

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error("Failed to fetch candidates");

            const data = await res.json();
            const candidatesList = data.candidates || [];
            const candidatesTotal = data.total || 0;

            setCandidates(candidatesList);
            setTotal(candidatesTotal);
            setCache(cacheKey, { candidates: candidatesList, total: candidatesTotal });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [recruiterId, page, limit, debouncedQuery, cacheKey]);

    useEffect(() => {
        // On parameter change, check cache first
        const freshCached = recruiterId ? getCached<CandidatesCache>(cacheKey) : null;
        if (freshCached) {
            setCandidates(freshCached.candidates);
            setTotal(freshCached.total);
            setLoading(false);
        }
        if (freshCached && isFresh(cacheKey)) return;
        fetchCandidates(!!freshCached);
    }, [fetchCandidates, cacheKey, recruiterId]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
        candidates,
        total,
        limit,
        page,
        totalPages,
        setPage,
        searchQuery,
        setSearchQuery,
        loading,
        error,
        refetch: () => fetchCandidates(false),
    };
}
