"use client";
import { useState, useCallback, useRef } from "react";

interface IrisFocusState {
    gazeOnScreen: boolean;
    pupilOffset: number; // 0 = centered, 1 = fully off-screen
    isAnomalous: boolean;
}

// MediaPipe iris landmark indices (available when refineLandmarks: true)
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;

// Raised from 0.30 → 0.42: reading text at the edges of a wide monitor
// shifts pupils ~35-38% from center — 0.30 was generating false positives.
const OFFSET_THRESHOLD = 0.42;
// Raised from 3s → 6s: a 3-second glance during normal reading is not suspicious.
const SUSTAINED_MS = 6000;
const COOLDOWN_MS = 10000;      // 10 seconds between violations

/**
 * Tracks iris/pupil position to detect when candidate's eyes
 * are reading off-screen (second monitor, phone, notes) even if
 * head remains straight.
 *
 * Piggybacks on existing FaceMesh via processLandmarks().
 * Uses iris landmarks 468-477 (available with refineLandmarks: true).
 */
export function useIrisFocusTracking(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<IrisFocusState>({
        gazeOnScreen: true,
        pupilOffset: 0,
        isAnomalous: false,
    });

    const offScreenStart = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (offset: number) => {
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
                        type: "PUPIL_FOCUS_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.75,
                        direction: `OFFSET:${offset.toFixed(2)}`,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    /**
     * Call from the FaceMesh onResults callback with raw landmarks.
     */
    const processLandmarks = useCallback(
        (landmarks: { x: number; y: number; z: number }[]) => {
            if (!landmarks || landmarks.length < 478) return;

            // Left eye: compute normalized iris position within eye width
            const leftIris = landmarks[LEFT_IRIS_CENTER];
            const leftInner = landmarks[LEFT_EYE_INNER];
            const leftOuter = landmarks[LEFT_EYE_OUTER];
            const leftEyeWidth = Math.abs(leftOuter.x - leftInner.x) || 0.001;
            const leftIrisPos = (leftIris.x - leftOuter.x) / leftEyeWidth;

            // Right eye: same computation
            const rightIris = landmarks[RIGHT_IRIS_CENTER];
            const rightInner = landmarks[RIGHT_EYE_INNER];
            const rightOuter = landmarks[RIGHT_EYE_OUTER];
            const rightEyeWidth = Math.abs(rightInner.x - rightOuter.x) || 0.001;
            const rightIrisPos = (rightIris.x - rightOuter.x) / rightEyeWidth;

            // Average iris position (0.5 = centered)
            const avgPos = (leftIrisPos + rightIrisPos) / 2;
            const offset = Math.abs(avgPos - 0.5) * 2; // Normalize to 0-1

            const gazeOnScreen = offset < OFFSET_THRESHOLD;
            const isAnomalous = !gazeOnScreen;

            setState({ gazeOnScreen, pupilOffset: offset, isAnomalous });

            if (isAnomalous) {
                if (!offScreenStart.current) {
                    offScreenStart.current = Date.now();
                } else if (Date.now() - offScreenStart.current >= SUSTAINED_MS) {
                    logViolation(offset);
                    offScreenStart.current = null;
                }
            } else {
                offScreenStart.current = null;
            }
        },
        [logViolation]
    );

    return { ...state, processLandmarks };
}
