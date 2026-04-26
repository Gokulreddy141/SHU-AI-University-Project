"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface GeminiMonitoringOptions {
    sessionId: string;
    candidateId: string;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    /** Only runs when true */
    isActive: boolean;
    /** How often to send a frame for analysis. Default 30s (to respect API quotas). */
    intervalMs?: number;
    onViolation?: (type: string, description: string, confidence: number) => void;
}

// If the API tells us the daily quota is exhausted (retryAfterMs > 10 minutes),
// we stop polling for the rest of the session to avoid hammering a depleted quota.
const DAILY_QUOTA_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function useGeminiMonitoring({
    sessionId,
    candidateId,
    videoRef,
    isActive,
    intervalMs = 30_000,
    onViolation,
}: GeminiMonitoringOptions) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const consecutiveErrors = useRef(0);
    const currentInterval = useRef(intervalMs);
    // Once daily quota is confirmed exhausted, suspend for the session
    const dailyQuotaExhausted = useRef(false);

    const [status, setStatus] = useState<"idle" | "active" | "quota_exceeded" | "unavailable">("idle");

    const onViolationRef = useRef(onViolation);
    useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return null;

        const canvas = document.createElement("canvas");
        canvas.width = 320; // Smaller = fewer tokens = less quota burn
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        return dataUrl.split(",")[1];
    }, [videoRef]);

    const analyse = useCallback(async (): Promise<number> => {
        // Returns next interval in ms
        if (!isActive || dailyQuotaExhausted.current) return Infinity;

        const imageBase64 = captureFrame();
        if (!imageBase64) return currentInterval.current;

        try {
            const res = await fetch("/api/ai/monitor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64, sessionId, candidateId }),
            });

            if (res.status === 429) {
                const data = await res.json().catch(() => ({}));
                const retryAfterMs: number = data.retryAfterMs ?? 60_000;

                if (retryAfterMs >= DAILY_QUOTA_THRESHOLD_MS) {
                    // Daily quota exhausted — stop for this session
                    dailyQuotaExhausted.current = true;
                    setStatus("quota_exceeded");
                    console.warn("[GeminiMonitor] Daily quota exhausted — suspending for this session.");
                    return Infinity;
                }

                // Per-minute rate limit — wait the instructed delay + a small buffer
                consecutiveErrors.current++;
                const wait = retryAfterMs + 5_000;
                setStatus("quota_exceeded");
                console.warn(`[GeminiMonitor] Rate limited. Retrying in ${Math.round(wait / 1000)}s`);
                return wait;
            }

            if (!res.ok) {
                // 503 or other — exponential back-off, max 5 min
                consecutiveErrors.current++;
                const wait = Math.min(intervalMs * Math.pow(2, consecutiveErrors.current), 300_000);
                setStatus("unavailable");
                return wait;
            }

            // Success
            consecutiveErrors.current = 0;
            currentInterval.current = intervalMs;
            setStatus("active");

            const data = await res.json();
            if (Array.isArray(data.violations)) {
                for (const v of data.violations) {
                    // Raised from 0.70 → 0.80: Gemini's vision model can produce
                    // moderate-confidence hallucinations on ambiguous frames (shadows,
                    // reflections, low lighting). Only act on high-confidence signals.
                    if (v.confidence >= 0.80 && onViolationRef.current) {
                        onViolationRef.current(v.type, v.description || "", v.confidence);
                    }
                }
            }

            return intervalMs;
        } catch {
            // Network error — exponential back-off
            consecutiveErrors.current++;
            const wait = Math.min(intervalMs * Math.pow(2, consecutiveErrors.current), 300_000);
            setStatus("unavailable");
            return wait;
        }
    }, [isActive, captureFrame, intervalMs, sessionId, candidateId]);

    useEffect(() => {
        if (!isActive) {
            setStatus("idle");
            return;
        }

        let alive = true;

        const run = async () => {
            if (!alive || dailyQuotaExhausted.current) return;
            const nextMs = await analyse();
            if (!alive || nextMs === Infinity) return;
            timerRef.current = setTimeout(run, nextMs);
        };

        // Initial delay: let camera warm up and avoid hammering on mount
        timerRef.current = setTimeout(run, 10_000);

        return () => {
            alive = false;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    return { status };
}
