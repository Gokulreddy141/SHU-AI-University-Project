"use client";
import { useState, useCallback, useRef, useEffect } from "react";

interface BlinkPatternState {
    blinksPerMinute: number;
    isAnomalous: boolean;
}

const BLINK_THRESHOLD_EAR = 0.20;
const SLIDING_WINDOW_MS = 60000;      // 1 minute window
const CALIBRATION_PHASE_MS = 120000;  // 2 minutes to establish baseline
const SUSTAINED_MS = 120000;          // Must be anomalous for 2 minutes to flag
const COOLDOWN_MS = 120000;           // 2 minutes between violations

/**
 * Tracks blink frequency to detect abnormal stress or note-reading.
 * Normal: 15-20 blinks/min
 * Stressed/Cheating: > 50% above personal baseline
 * Note-reading: < 50% below personal baseline
 * 
 * Piggybacks on existing EAR calculation in FaceMesh.
 */
export function useBlinkFrequencyAnalysis(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<BlinkPatternState>({
        blinksPerMinute: 0,
        isAnomalous: false,
    });

    // Refs for sliding window and state machine
    const blinkTimestamps = useRef<number[]>([]);
    const isEyesClosed = useRef<boolean>(false);

    const mountTime = useRef<number>(0);
    const personalBaselineBPM = useRef<number | null>(null);
    const anomalyStartTime = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);

    // Initialize mount time in useEffect to avoid purity violation
    useEffect(() => {
        if (!mountTime.current) {
            mountTime.current = Date.now();
        }
    }, []);

    const logViolation = useCallback(
        async (bpm: number, type: "HIGH_STRESS" | "NOTE_READING") => {
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
                        type: "BLINK_PATTERN_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.65,
                        direction: `${type} BPM:${bpm}`,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    /**
     * Call from the FaceMesh callback where EAR is computed.
     */
    const processEAR = useCallback(
        (ear: number) => {
            const now = Date.now();

            // 1. Detect blink (falling edge)
            if (ear < BLINK_THRESHOLD_EAR) {
                isEyesClosed.current = true;
            } else if (ear >= BLINK_THRESHOLD_EAR && isEyesClosed.current) {
                // Blink completed!
                isEyesClosed.current = false;
                blinkTimestamps.current.push(now);
            }

            // 2. Prune old timestamps (sliding window)
            const cutoff = now - SLIDING_WINDOW_MS;
            while (blinkTimestamps.current.length > 0 && blinkTimestamps.current[0] < cutoff) {
                blinkTimestamps.current.shift();
            }

            const currentBPM = blinkTimestamps.current.length;
            const elapsedSinceMount = now - mountTime.current;

            let isCurrentlyAnomalous = false;

            // 3. Calibration vs Detection Phase
            if (elapsedSinceMount < CALIBRATION_PHASE_MS) {
                // Still calibrating... (Update baseline estimate silently)
                if (elapsedSinceMount > 60000) { // After 1 minute, we have a rough baseline
                    personalBaselineBPM.current = currentBPM;
                }
            } else if (personalBaselineBPM.current !== null) {
                // Detection phase
                const baseline = personalBaselineBPM.current;

                // Flag if > 1.5x baseline (stress) OR < 0.5x baseline (note reading)
                // Minimal thresholds to avoid flagging a 2 BPM baseline jumping to 3
                if ((currentBPM > baseline * 1.5 && currentBPM > 25) ||
                    (currentBPM < baseline * 0.5 && currentBPM < 10)) {
                    isCurrentlyAnomalous = true;
                }
            }

            setState({ blinksPerMinute: currentBPM, isAnomalous: isCurrentlyAnomalous });

            // 4. Sustained anomaly check
            if (isCurrentlyAnomalous) {
                if (!anomalyStartTime.current) {
                    anomalyStartTime.current = now;
                } else if (now - anomalyStartTime.current >= SUSTAINED_MS) {
                    const type = currentBPM > (personalBaselineBPM.current || 20) ? "HIGH_STRESS" : "NOTE_READING";
                    logViolation(currentBPM, type);
                    anomalyStartTime.current = null; // Reset
                }
            } else {
                anomalyStartTime.current = null;
            }
        },
        [logViolation]
    );

    return { ...state, processEAR };
}
