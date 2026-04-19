"use client";

import { useState, useEffect, useCallback } from "react";

export const useSessionResponses = (sessionId: string | null) => {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchResponses = useCallback(async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            setError(null);

            // Build auth headers from localStorage (same pattern as useWebRTC)
            const authHeaders: Record<string, string> = {};
            try {
                const stored = localStorage.getItem("user");
                if (stored) {
                    const u = JSON.parse(stored);
                    if (u._id) authHeaders["x-user-id"] = u._id;
                    if (u.role) authHeaders["x-user-role"] = u.role;
                }
            } catch { /* ignore */ }

            const res = await fetch(`/api/session/${sessionId}/responses`, {
                headers: authHeaders,
            });
            const data = await res.json();
            if (data.success) {
                setResponses(data.items || []);
            } else {
                setError(data.error || "Failed to fetch responses");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Network error";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchResponses();
    }, [fetchResponses]);

    return { responses, loading, error, refetch: fetchResponses };
};
