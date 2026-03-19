"use client";
import { useState, useCallback, useRef } from "react";

interface MicroGazeState {
    isAnomalous: boolean;
    varianceLog: number;
}

const CONSTANTS = {
    HISTORY_LIMIT: 100, // Keep rolling 100 frames
    VARIANCE_THRESHOLD: 0.08, // Tuneable threshold for unnatural bimodal variance
    COOLDOWN_MS: 300000, // 5 min
};

// Standard deviation calculation
function calculateVariance(data: number[]): number {
    if (data.length === 0) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const sqDiff = data.map(val => Math.pow(val - mean, 2));
    return sqDiff.reduce((a, b) => a + b, 0) / data.length;
}

export function useMicroGazeTracker(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<MicroGazeState>({
        isAnomalous: false,
        varianceLog: 0,
    });

    const pupilXHistory = useRef<number[]>([]);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (variance: number) => {
            const now = Date.now();
            if (now - lastViolationTime.current < CONSTANTS.COOLDOWN_MS) return;
            lastViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "MICRO_GAZE_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.85,
                        direction: `High variance bimodal gaze pattern (var: ${variance.toFixed(3)})`,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    const processGaze = useCallback(
        (landmarks: unknown) => {
            if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 478) return;

            // MediaPipe Iris specific landmarks
            // 468 = Left eye pupil center
            // 473 = Right eye pupil center
            const leftPupil = landmarks[468];
            const rightPupil = landmarks[473];

            if (!leftPupil || !rightPupil) return;

            // Normalized X coordinate average of both pupils relative to screen
            const avgPupilX = (leftPupil.x + rightPupil.x) / 2.0;

            pupilXHistory.current.push(avgPupilX);
            if (pupilXHistory.current.length > CONSTANTS.HISTORY_LIMIT) {
                pupilXHistory.current.shift();
            }

            if (pupilXHistory.current.length === CONSTANTS.HISTORY_LIMIT) {
                const variance = calculateVariance(pupilXHistory.current);

                let isAnomalous = false;

                // Normal humans looking at an exam screen have very low variance (focused).
                // If they are darting their eyes off-screen every few seconds (micro-glances),
                // the variance spikes massively compared to a focused state.
                if (variance > CONSTANTS.VARIANCE_THRESHOLD) {
                    isAnomalous = true;
                    logViolation(variance);
                }

                setState({
                    isAnomalous,
                    varianceLog: variance,
                });
            }
        },
        [logViolation]
    );

    return { ...state, processGaze };
}
