"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface MouseBehaviorState {
    secondsSinceLastInteraction: number;
    isInactive: boolean;
}

const INACTIVITY_THRESHOLD_MS = 60000; // 60 seconds
const CHECK_INTERVAL_MS = 10000;       // Check every 10 seconds
const COOLDOWN_MS = 60000;             // 60 seconds between violations

/**
 * Detects prolonged mouse/keyboard inactivity during an active exam.
 * If no mousemove, click, scroll, or keydown occurs for 60+ seconds,
 * the candidate may be alt-tabbed or receiving remote assistance.
 */
export function useMouseBehaviorAnalysis(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<MouseBehaviorState>({
        secondsSinceLastInteraction: 0,
        isInactive: false,
    });

    const lastInteraction = useRef<number>(0);
    const lastViolationTime = useRef<number>(0);

    // Initialize last interaction time in useEffect to avoid purity violation
    useEffect(() => {
        if (lastInteraction.current === 0) {
            lastInteraction.current = Date.now();
        }
    }, []);

    const logViolation = useCallback(
        async (inactiveSeconds: number) => {
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
                        type: "MOUSE_INACTIVITY",
                        timestamp: new Date().toISOString(),
                        duration: inactiveSeconds,
                        confidence: 0.6,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled) return;

        lastInteraction.current = Date.now();

        const updateInteraction = () => {
            lastInteraction.current = Date.now();
        };

        // Track all user interaction events
        document.addEventListener("mousemove", updateInteraction);
        document.addEventListener("click", updateInteraction);
        document.addEventListener("scroll", updateInteraction);
        document.addEventListener("keydown", updateInteraction);
        document.addEventListener("touchstart", updateInteraction);

        // Periodic inactivity check
        const interval = setInterval(() => {
            const elapsed = Date.now() - lastInteraction.current;
            const seconds = Math.round(elapsed / 1000);
            const isInactive = elapsed >= INACTIVITY_THRESHOLD_MS;

            setState({ secondsSinceLastInteraction: seconds, isInactive });

            if (isInactive) {
                logViolation(seconds);
            }
        }, CHECK_INTERVAL_MS);

        return () => {
            document.removeEventListener("mousemove", updateInteraction);
            document.removeEventListener("click", updateInteraction);
            document.removeEventListener("scroll", updateInteraction);
            document.removeEventListener("keydown", updateInteraction);
            document.removeEventListener("touchstart", updateInteraction);
            clearInterval(interval);
        };
    }, [enabled, logViolation]);

    return state;
}
