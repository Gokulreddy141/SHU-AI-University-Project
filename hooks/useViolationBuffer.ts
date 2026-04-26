"use client";
import { useCallback, useRef } from "react";

interface ViolationPayload {
    sessionId: string;
    candidateId: string;
    type: string;
    direction?: string;
    timestamp: string;
    duration?: number;
    confidence?: number;
}

export function useViolationBuffer() {
    const queue = useRef<ViolationPayload[]>([]);
    const flushing = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const flush = useCallback(async () => {
        if (flushing.current || queue.current.length === 0) return;
        flushing.current = true;

        const batch = [...queue.current];
        const failed: ViolationPayload[] = [];

        for (const payload of batch) {
            try {
                const res = await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    failed.push(payload);
                }
            } catch {
                failed.push(payload);
            }
        }

        queue.current = failed;
        flushing.current = false;
    }, []);

    // Start auto-flush timer
    const startAutoFlush = useCallback(() => {
        if (timerRef.current) return;
        timerRef.current = setInterval(() => {
            if (queue.current.length > 0) flush();
        }, 5000);
    }, [flush]);

    const stopAutoFlush = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const logViolation = useCallback(
        async (payload: ViolationPayload) => {
            try {
                const res = await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed");
                return true;
            } catch {
                queue.current.push(payload);
                startAutoFlush();
                return false;
            }
        },
        [startAutoFlush]
    );

    return {
        logViolation,
        flush,
        stopAutoFlush,
        get pendingCount() {
            return queue.current.length;
        },
    };
}
