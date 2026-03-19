"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface NetworkMonitorState {
    isOnline: boolean;
    disconnectionCount: number;
    totalOfflineMs: number;
    isAnomalous: boolean;
}

const HEARTBEAT_INTERVAL_MS = 30000;   // 30 seconds
const MAX_DISCONNECTIONS = 3;           // 3+ disconnects = suspicious
const MAX_TOTAL_OFFLINE_MS = 60000;     // 60s total offline = suspicious
const MAX_SINGLE_GAP_MS = 30000;        // 30s single gap = suspicious
const COOLDOWN_MS = 60000;              // 60 seconds between violations

/**
 * Monitors network connectivity to detect intentional disconnections.
 * Combines navigator.onLine events with a periodic heartbeat to catch
 * scenarios where the candidate drops network to buy exam time.
 */
export function useNetworkMonitor(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<NetworkMonitorState>({
        isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
        disconnectionCount: 0,
        totalOfflineMs: 0,
        isAnomalous: false,
    });

    const disconnectionCount = useRef<number>(0);
    const totalOfflineMs = useRef<number>(0);
    const offlineStartTime = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (reason: string) => {
            const now = Date.now();
            if (now - lastViolationTime.current < COOLDOWN_MS) return;
            lastViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "NETWORK_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.7,
                        direction: reason,
                    }),
                });
            } catch {
                // Silently fail — we're likely offline
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled) return;

        const handleOffline = () => {
            offlineStartTime.current = Date.now();
            disconnectionCount.current++;

            setState((prev) => ({
                ...prev,
                isOnline: false,
                disconnectionCount: disconnectionCount.current,
            }));
        };

        const handleOnline = () => {
            if (offlineStartTime.current) {
                const gap = Date.now() - offlineStartTime.current;
                totalOfflineMs.current += gap;
                offlineStartTime.current = null;

                const isAnomalous =
                    disconnectionCount.current >= MAX_DISCONNECTIONS ||
                    totalOfflineMs.current >= MAX_TOTAL_OFFLINE_MS ||
                    gap >= MAX_SINGLE_GAP_MS;

                setState({
                    isOnline: true,
                    disconnectionCount: disconnectionCount.current,
                    totalOfflineMs: totalOfflineMs.current,
                    isAnomalous,
                });

                if (isAnomalous) {
                    logViolation(
                        `DC:${disconnectionCount.current} TOTAL:${Math.round(totalOfflineMs.current / 1000)}s GAP:${Math.round(gap / 1000)}s`
                    );
                }
            } else {
                setState((prev) => ({ ...prev, isOnline: true }));
            }
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        // Heartbeat: detect silent network failures
        const heartbeat = setInterval(async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}`, {
                    method: "GET",
                    signal: AbortSignal.timeout(5000),
                });
                if (!res.ok && !navigator.onLine) {
                    handleOffline();
                }
            } catch {
                // Heartbeat failed — network may be down
                if (navigator.onLine && !offlineStartTime.current) {
                    handleOffline();
                }
            }
        }, HEARTBEAT_INTERVAL_MS);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
            clearInterval(heartbeat);
        };
    }, [enabled, sessionId, logViolation]);

    return state;
}
