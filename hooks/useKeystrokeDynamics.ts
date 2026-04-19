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
    identityMismatch: boolean;
}

// Thresholds for anomaly detection
const MIN_KEYSTROKES_FOR_ANALYSIS = 30;      // Need at least 30 keystrokes to build a profile
const HOLD_DURATION_VARIANCE_THRESHOLD = 0.1; // Suspiciously low variance = bot
const BURST_THRESHOLD_MS = 15;                // Keys pressed < 15ms apart = paste/macro
const BURST_COUNT_THRESHOLD = 5;              // 5+ burst events = suspicious
const COOLDOWN_MS = 30000;                    // 30 seconds between violation reports

// Typing Identity (Mahalanobis distance)
const IDENTITY_BASELINE_SAMPLES = 50;        // Build baseline over 50 keystrokes
const IDENTITY_CHECK_INTERVAL = 30;          // Check every 30 keystrokes after baseline
const MAHALANOBIS_THRESHOLD = 3.5;           // z-score > 3.5 = likely different typist
const IDENTITY_COOLDOWN_MS = 120000;         // 2 minutes between identity mismatch reports

/**
 * Computes the Mahalanobis distance of a new sample against a baseline distribution.
 * Features: [avgHold, holdCV, avgFlight, flightCV]
 * A distance > 3.5 means the current typing is statistically very different from baseline.
 */
function mahalanobisDistance(
    sample: number[],
    mean: number[],
    stdDev: number[]
): number {
    return Math.sqrt(
        sample.reduce((sum, val, i) => {
            const normalized = stdDev[i] > 0.001 ? (val - mean[i]) / stdDev[i] : 0;
            return sum + normalized * normalized;
        }, 0)
    );
}

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
        identityMismatch: false,
    });

    const keyDownTimes = useRef<Map<string, number>>(new Map());
    const holdDurations = useRef<number[]>([]);
    const flightTimes = useRef<number[]>([]);
    const lastKeyUpTime = useRef<number>(0);
    const burstCount = useRef<number>(0);
    const sessionStartTime = useRef<number>(0);
    const lastViolationTime = useRef<number>(0);
    const lastIdentityViolationTime = useRef<number>(0);
    const totalKeystrokes = useRef<number>(0);

    // Identity baseline: feature vectors [avgHold, holdCV, avgFlight, flightCV]
    const identityBaseline = useRef<{ mean: number[]; std: number[] } | null>(null);
    const baselineSamples = useRef<number[][]>([]);

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

    const logIdentityViolation = useCallback(
        async (distance: number) => {
            const now = Date.now();
            if (now - lastIdentityViolationTime.current < IDENTITY_COOLDOWN_MS) return;
            lastIdentityViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "TYPING_IDENTITY_MISMATCH",
                        timestamp: new Date().toISOString(),
                        confidence: Math.min(0.95, 0.6 + (distance - MAHALANOBIS_THRESHOLD) / 10),
                        direction: `MAHALANOBIS:${distance.toFixed(2)}`,
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

        const buildFeatureVector = (holds: number[], flights: number[]): number[] => {
            const avgHold = holds.reduce((a, b) => a + b, 0) / holds.length;
            const holdVar = holds.reduce((s, h) => s + (h - avgHold) ** 2, 0) / holds.length;
            const holdCV = Math.sqrt(holdVar) / (avgHold || 1);

            const avgFlight = flights.length > 0 ? flights.reduce((a, b) => a + b, 0) / flights.length : 0;
            const flightVar = flights.length > 0
                ? flights.reduce((s, f) => s + (f - avgFlight) ** 2, 0) / flights.length
                : 0;
            const flightCV = Math.sqrt(flightVar) / (avgFlight || 1);

            return [avgHold, holdCV, avgFlight, flightCV];
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
            const holdCV = Math.sqrt(holdVariance) / (avgHold || 1);

            // Typing speed (characters per minute)
            const elapsedMinutes = (Date.now() - sessionStartTime.current) / 60000;
            const cpm = totalKeystrokes.current / (elapsedMinutes || 1);

            const profile: KeystrokeProfile = {
                avgHoldDuration: Math.round(avgHold),
                avgFlightTime: Math.round(avgFlight),
                typingSpeed: Math.round(cpm),
                burstCount: burstCount.current,
            };

            // ── Typing identity check (Mahalanobis distance) ──
            const featureVec = buildFeatureVector(holds, flights);
            let identityMismatch = false;

            if (!identityBaseline.current) {
                // Build baseline: collect first IDENTITY_BASELINE_SAMPLES feature vectors
                baselineSamples.current.push(featureVec);
                if (baselineSamples.current.length >= IDENTITY_BASELINE_SAMPLES) {
                    const n = baselineSamples.current.length;
                    const mean = featureVec.map((_, i) =>
                        baselineSamples.current.reduce((s, v) => s + v[i], 0) / n
                    );
                    const std = featureVec.map((_, i) => {
                        const variance = baselineSamples.current.reduce((s, v) => s + (v[i] - mean[i]) ** 2, 0) / n;
                        return Math.sqrt(variance);
                    });
                    identityBaseline.current = { mean, std };
                }
            } else if (totalKeystrokes.current % IDENTITY_CHECK_INTERVAL === 0) {
                const dist = mahalanobisDistance(featureVec, identityBaseline.current.mean, identityBaseline.current.std);
                if (dist > MAHALANOBIS_THRESHOLD) {
                    identityMismatch = true;
                    logIdentityViolation(dist);
                }
            }

            // Anomaly: suspiciously consistent timing (bot/macro) OR too many bursts (paste masking)
            const isAnomalous =
                holdCV < HOLD_DURATION_VARIANCE_THRESHOLD ||
                burstCount.current >= BURST_COUNT_THRESHOLD;

            setState({
                profile,
                isAnomalous,
                totalKeystrokes: totalKeystrokes.current,
                identityMismatch,
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
    }, [enabled, logViolation, logIdentityViolation]);

    return state;
}
