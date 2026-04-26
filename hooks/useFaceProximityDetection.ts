"use client";
import { useState, useCallback, useRef } from "react";

type ProximityLevel = "normal" | "too_far" | "too_close";

interface FaceProximityState {
    proximity: ProximityLevel;
    interEyeDistance: number; // Normalized 0-1
    isAnomalous: boolean;
}

// Thresholds (normalized; FaceMesh landmarks are 0-1)
const TOO_FAR_THRESHOLD = 0.06;    // Inter-eye distance < 6% of frame = face is far
const TOO_CLOSE_THRESHOLD = 0.30;  // Inter-eye distance > 30% of frame = face too close
const SUSTAINED_MS = 3000;         // Must sustain anomaly for 3 seconds
const COOLDOWN_MS = 15000;         // 15 seconds between violations

// FaceMesh landmark indices
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

/**
 * Detects face proximity anomalies by measuring inter-eye distance
 * from FaceMesh landmarks. Piggybacks on the existing FaceMesh instance
 * via processLandmarks() — does NOT create a new model.
 * 
 * - Too far: phone propped up / candidate walked away
 * - Too close: intentionally blocking camera
 */
export function useFaceProximityDetection(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<FaceProximityState>({
        proximity: "normal",
        interEyeDistance: 0,
        isAnomalous: false,
    });

    const anomalyStart = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (proximity: ProximityLevel, distance: number) => {
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
                        type: "FACE_PROXIMITY_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.75,
                        direction: `${proximity.toUpperCase()} D:${distance.toFixed(3)}`,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    /**
     * Called from the FaceMesh onResults callback with raw landmarks.
     * Same pattern as useHeadPoseEstimation.processLandmarks().
     */
    const processLandmarks = useCallback(
        (landmarks: { x: number; y: number; z: number }[]) => {
            if (!landmarks || landmarks.length < 468) return;

            const leftEye = landmarks[LEFT_EYE_OUTER];
            const rightEye = landmarks[RIGHT_EYE_OUTER];

            // Euclidean distance between outer eye corners (normalized 0-1 in FaceMesh)
            const dx = rightEye.x - leftEye.x;
            const dy = rightEye.y - leftEye.y;
            const interEyeDistance = Math.sqrt(dx * dx + dy * dy);

            let proximity: ProximityLevel = "normal";
            if (interEyeDistance < TOO_FAR_THRESHOLD) {
                proximity = "too_far";
            } else if (interEyeDistance > TOO_CLOSE_THRESHOLD) {
                proximity = "too_close";
            }

            const isAnomalous = proximity !== "normal";

            setState({ proximity, interEyeDistance, isAnomalous });

            if (isAnomalous) {
                if (!anomalyStart.current) {
                    anomalyStart.current = Date.now();
                } else {
                    const elapsed = Date.now() - anomalyStart.current;
                    if (elapsed >= SUSTAINED_MS) {
                        logViolation(proximity, interEyeDistance);
                        anomalyStart.current = Date.now(); // Reset
                    }
                }
            } else {
                anomalyStart.current = null;
            }
        },
        [logViolation]
    );

    return { ...state, processLandmarks };
}
