"use client";
import { useState, useEffect, useCallback } from "react";
import { IExam } from "@/types/exam";
import { getCached, setCache, isFresh } from "@/lib/clientCache";

interface ExamsCache {
    exams: IExam[];
    total: number;
}

export function useExamsList(recruiterId: string | undefined) {
    const cacheKey = `exams:${recruiterId}`;
    const cached = recruiterId ? getCached<ExamsCache>(cacheKey) : null;

    const [fetchedExams, setFetchedExams] = useState<IExam[] | null>(null);
    const [fetchedTotal, setFetchedTotal] = useState<number | null>(null);
    const [page] = useState(1);
    const [limit] = useState(50);
    const [isNetworkFetching, setIsNetworkFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived State (The core of the optimized pattern)
    // Synchronously grab cache. If it exists, we are NOT loading, even if the network is fetching.
    const activeExams = fetchedExams || cached?.exams || [];
    const activeTotal = fetchedTotal || cached?.total || 0;

    // We are only "loading" if we have absolutely no data to show yet, AND we are actively fetching
    const loading = !cached && isNetworkFetching;

    const fetchExams = useCallback(async () => {
        if (!recruiterId) return;

        setIsNetworkFetching(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/exam?recruiterId=${recruiterId}&page=${page}&limit=${limit}`
            );
            if (!res.ok) throw new Error("Failed to fetch exams");

            const data = await res.json();
            const examsList = data.exams || [];
            const examsTotal = data.total || 0;

            setFetchedExams(examsList);
            setFetchedTotal(examsTotal);
            setCache(cacheKey, { exams: examsList, total: examsTotal });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setIsNetworkFetching(false);
        }
    }, [recruiterId, page, limit, cacheKey]);

    useEffect(() => {
        if (cached && isFresh(cacheKey)) return;
        fetchExams();
    }, [fetchExams, cached, cacheKey]);

    const updateProctoringMode = async (examId: string, mode: "strict" | "standard" | "light") => {
        try {
            // Optimistic UI update
            if (fetchedExams) {
                setFetchedExams(prev => (prev || []).map(ex => ex._id === examId ? { ...ex, proctoringMode: mode } : ex));
            } else if (cached?.exams) {
                // If we haven't fetched yet but have cache, we need to update our fetched state to reflect the optimistic change over the cache
                setFetchedExams(cached.exams.map(ex => ex._id === examId ? { ...ex, proctoringMode: mode } : ex));
            }

            const res = await fetch(`/api/exam/${examId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proctoringMode: mode }),
            });

            if (!res.ok) throw new Error("Failed to update mode");
        } catch (err) {
            console.error("Failed optimistic update", err);
            fetchExams();
        }
    };

    return {
        exams: activeExams,
        total: activeTotal,
        loading,
        error,
        updateProctoringMode,
        refetch: fetchExams,
    };
}
