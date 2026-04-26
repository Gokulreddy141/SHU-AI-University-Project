"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface MultiTabState {
    isDuplicate: boolean;
}

const COOLDOWN_MS = 60000; // 60 seconds between violations

/**
 * Detects if the candidate has the same exam open in multiple browser tabs.
 * 
 * Primary: BroadcastChannel API (Chrome, Firefox, Edge, Safari 15.4+)
 * Fallback: localStorage + storage event (all browsers)
 */
export function useMultiTabDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<MultiTabState>({ isDuplicate: false });
    const tabId = useRef<string>(crypto.randomUUID());
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async () => {
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
                        type: "DUPLICATE_TAB",
                        timestamp: new Date().toISOString(),
                        confidence: 1.0,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled || !sessionId) return;

        const channelName = `exam-session-${sessionId}`;

        // Try BroadcastChannel first (modern browsers)
        if (typeof BroadcastChannel !== "undefined") {
            const channel = new BroadcastChannel(channelName);

            // Announce this tab
            channel.postMessage({ type: "PING", tabId: tabId.current });

            channel.onmessage = (event: MessageEvent) => {
                const data = event.data as { type: string; tabId: string };
                if (data.type === "PING" && data.tabId !== tabId.current) {
                    // Another tab with the same session detected
                    setState({ isDuplicate: true });
                    logViolation();

                    // Reply so the other tab also knows
                    channel.postMessage({ type: "PONG", tabId: tabId.current });
                }
                if (data.type === "PONG" && data.tabId !== tabId.current) {
                    setState({ isDuplicate: true });
                    logViolation();
                }
            };

            return () => {
                channel.close();
            };
        }

        // Fallback: localStorage polling for Safari < 15.4
        const storageKey = `exam-tab-${sessionId}`;
        localStorage.setItem(storageKey, tabId.current);

        const handleStorage = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue && e.newValue !== tabId.current) {
                setState({ isDuplicate: true });
                logViolation();
            }
        };

        window.addEventListener("storage", handleStorage);

        // Heartbeat: re-write our tab ID periodically so new tabs detect us
        const heartbeat = setInterval(() => {
            localStorage.setItem(storageKey, tabId.current);
        }, 3000);

        return () => {
            window.removeEventListener("storage", handleStorage);
            clearInterval(heartbeat);
            localStorage.removeItem(storageKey);
        };
    }, [enabled, sessionId, logViolation]);

    return state;
}
