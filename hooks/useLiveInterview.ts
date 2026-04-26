"use client";

import { useState, useEffect, useCallback } from "react";
export const useLiveInterview = (sessionId: string) => {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async () => {
        if (!sessionId) return;

        try {
            setLoading(true);
            setError(null);

            // Adjust the fetch headers appropriately if your app requires Auth Bearer tokens
            const res = await fetch(`/api/interview/token?sessionId=${sessionId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch LiveKit token");
            }

            setToken(data.token);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    return { token, loading, error, refetch: fetchToken };
};
