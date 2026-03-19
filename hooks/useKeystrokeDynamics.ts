"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface KeystrokeProfile {
    avgHoldDuration: number;    // Average key hold time (ms)
    avgFlightTime: number;      // Average time between key releases and next key press (ms)
    typingSpeed: number;        // Characters per minute
    burstCount: number;         // Number of rapid-fire bursts (paste-like behavior)
}

interface KeystrokeDynamicsState {
    profile: KeystrokeProfile;
    isAnomalous: boolean;
    totalKeystrokes: number;
}

// Thresholds for anomaly detection
const MIN_KEYSTROKES_FOR_ANALYSIS = 30;      // Need at least 30 keystrokes to build a profile
const HOLD_DURATION_VARIANCE_THRESHOLD = 0.1; // Suspiciously low variance = bot
const BURST_THRESHOLD_MS = 15;                // Keys pressed < 15ms apart = paste/macro
const BURST_COUNT_THRESHOLD = 5;              // 5+ burst events = suspicious
const COOLDOWN_MS = 30000;                    // 30 seconds between violation reports

/**
 * Monitors keystroke timing patterns to detect:
 * 1. Pasted AI-generated text (unnaturally even timing or instant bursts)
 * 2. Different person typing (sudden rhythm change)
 * 3. Macro/automation tools (perfectly consistent hold durations)
 */
export function useKeystrokeDynamics(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<KeystrokeDynamicsState>({
        profile: { avgHoldDuration: 0, avgFlightTime: 0, typingSpeed: 0, burstCount: 0 },
        isAnomalous: false,
        totalKeystrokes: 0,
    });

    const keyDownTimes = useRef<Map<string, number>>(new Map());
    const holdDurations = useRef<number[]>([]);
    const flightTimes = useRef<number[]>([]);
    const lastKeyUpTime = useRef<number>(0);
    const burstCount = useRef<number>(0);
    const sessionStartTime = useRef<number>();
    const lastViolationTime = useRef<number>(0);
    const totalKeystrokes = useRef<number>(0);

    // Initialize session start time in useEffect to avoid purity violation
    useEffect(() => {
        if (!sessionStartTime.current) {
            sessionStartTime.current = Date.now();
        }
    }, []);

    const logViolation = useCallback(
        async (profile: KeystrokeProfile) => {
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
                        type: "TYPING_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.8,
                        direction: `CPM:${Math.round(profile.typingSpeed)} BURSTS:${profile.burstCount}`,
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

        sessionStartTime.current = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore modifier keys and navigation keys
            if (e.key.length > 1 && !["Backspace", "Delete", "Enter"].includes(e.key)) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            if (!keyDownTimes.current.has(e.key)) {
                keyDownTimes.current.set(e.key, performance.now());
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key.length > 1 && !["Backspace", "Delete", "Enter"].includes(e.key)) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const downTime = keyDownTimes.current.get(e.key);
            if (downTime === undefined) return;

            const now = performance.now();
            const holdDuration = now - downTime;
            keyDownTimes.current.delete(e.key);

            // Record hold duration
            holdDurations.current.push(holdDuration);
            if (holdDurations.current.length > 200) holdDurations.current.shift();

            // Record flight time (time since last key release)
            if (lastKeyUpTime.current > 0) {
                const flight = now - lastKeyUpTime.current;
                flightTimes.current.push(flight);
                if (flightTimes.current.length > 200) flightTimes.current.shift();

                // Detect burst typing (paste-like rapid-fire)
                if (flight < BURST_THRESHOLD_MS) {
                    burstCount.current++;
                }
            }
            lastKeyUpTime.current = now;
            totalKeystrokes.current++;

            // Analyze after enough keystrokes
            if (totalKeystrokes.current % 10 === 0 && totalKeystrokes.current >= MIN_KEYSTROKES_FOR_ANALYSIS) {
                analyzeProfile();
            }
        };

        const analyzeProfile = () => {
            const holds = holdDurations.current;
            const flights = flightTimes.current;

            if (holds.length < MIN_KEYSTROKES_FOR_ANALYSIS) return;

            // Calculate averages
            const avgHold = holds.reduce((a, b) => a + b, 0) / holds.length;
            const avgFlight = flights.length > 0 ? flights.reduce((a, b) => a + b, 0) / flights.length : 0;

            // Calculate hold duration variance (normalized)
            const holdVariance = holds.reduce((sum, h) => sum + Math.pow(h - avgHold, 2), 0) / holds.length;
            const holdCV = Math.sqrt(holdVariance) / (avgHold || 1); // Coefficient of variation

            // Typing speed (characters per minute)
            const elapsedMinutes = (Date.now() - sessionStartTime.current) / 60000;
            const cpm = totalKeystrokes.current / (elapsedMinutes || 1);

            const profile: KeystrokeProfile = {
                avgHoldDuration: Math.round(avgHold),
                avgFlightTime: Math.round(avgFlight),
                typingSpeed: Math.round(cpm),
                burstCount: burstCount.current,
            };

            // Anomaly: suspiciously consistent timing (bot/macro) OR too many bursts (paste masking)
            const isAnomalous =
                holdCV < HOLD_DURATION_VARIANCE_THRESHOLD ||
                burstCount.current >= BURST_COUNT_THRESHOLD;

            setState({
                profile,
                isAnomalous,
                totalKeystrokes: totalKeystrokes.current,
            });

            if (isAnomalous) {
                logViolation(profile);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [enabled, logViolation]);

    return state;
}
