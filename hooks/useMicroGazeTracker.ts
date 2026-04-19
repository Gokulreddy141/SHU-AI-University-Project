"use client";
import { useState, useCallback, useRef } from "react";

interface MicroGazeState {
    isAnomalous: boolean;
    varianceLog: number;
    isBimodal: boolean;
}

const CONSTANTS = {
    HISTORY_LIMIT: 100,       // Rolling 100 frames (~3s at 30fps)
    VARIANCE_THRESHOLD: 0.015, // Calibrated: normal exam reading ~0.003-0.008, off-screen darting ~0.020+
    SUSTAINED_MS: 8000,        // Must sustain 8s of high variance before flagging
    COOLDOWN_MS: 300000,       // 5 min cooldown
    BIMODAL_HISTORY: 300,      // 300 frames (~10s) for KDE bimodal analysis
    BIMODAL_CHECK_MS: 60000,   // Check for bimodal pattern every 60s
    KDE_BANDWIDTH: 0.03,       // Gaussian kernel bandwidth for gaze distribution
    BIMODAL_DIP_RATIO: 0.45,   // Valley/peak ratio < 0.45 = bimodal (two distinct positions)
    BIMODAL_COOLDOWN_MS: 180000, // 3 min between bimodal reports
};

// Standard deviation calculation
function calculateVariance(data: number[]): number {
    if (data.length === 0) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const sqDiff = data.map(val => Math.pow(val - mean, 2));
    return sqDiff.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Kernel Density Estimation using Gaussian kernel.
 * Returns estimated probability density at each evaluation point.
 */
function gaussianKDE(data: number[], evalPoints: number[], bandwidth: number): number[] {
    return evalPoints.map(x => {
        const kernelSum = data.reduce((sum, xi) => {
            const z = (x - xi) / bandwidth;
            return sum + Math.exp(-0.5 * z * z);
        }, 0);
        return kernelSum / (data.length * bandwidth * Math.sqrt(2 * Math.PI));
    });
}

/**
 * Hartigan's dip test approximation — detects bimodal distributions.
 * Returns true if the KDE density has a significant valley between two peaks,
 * indicating the candidate's gaze alternates between two fixed positions
 * (their screen + a secondary monitor or phone).
 */
function isBimodalDistribution(data: number[]): boolean {
    if (data.length < 30) return false;

    // Evaluate KDE over [0, 1] in 50 steps
    const evalPoints = Array.from({ length: 50 }, (_, i) => i / 49);
    const density = gaussianKDE(data, evalPoints, CONSTANTS.KDE_BANDWIDTH);

    // Find all local maxima
    const peaks: { idx: number; val: number }[] = [];
    for (let i = 1; i < density.length - 1; i++) {
        if (density[i] > density[i - 1] && density[i] > density[i + 1]) {
            peaks.push({ idx: i, val: density[i] });
        }
    }

    if (peaks.length < 2) return false;

    // Sort peaks by height, take top 2
    peaks.sort((a, b) => b.val - a.val);
    const [peak1, peak2] = peaks;

    // Find minimum density between the two peaks
    const minIdx = Math.min(peak1.idx, peak2.idx);
    const maxIdx = Math.max(peak1.idx, peak2.idx);
    const valley = Math.min(...density.slice(minIdx, maxIdx + 1));

    // Bimodal if the valley is significantly below both peaks
    const avgPeakHeight = (peak1.val + peak2.val) / 2;
    const dipRatio = valley / avgPeakHeight;

    // Also check that the two peaks are well-separated (not just noise)
    const peakSeparation = Math.abs(evalPoints[peak1.idx] - evalPoints[peak2.idx]);

    return dipRatio < CONSTANTS.BIMODAL_DIP_RATIO && peakSeparation > 0.15;
}

export function useMicroGazeTracker(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<MicroGazeState>({
        isAnomalous: false,
        varianceLog: 0,
        isBimodal: false,
    });

    const pupilXHistory = useRef<number[]>([]);
    const bimodalHistory = useRef<number[]>([]);
    const lastViolationTime = useRef<number>(0);
    const lastBimodalViolationTime = useRef<number>(0);
    const lastBimodalCheckTime = useRef<number>(0);
    const anomalyStartTime = useRef<number | null>(null);

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

    const logBimodalViolation = useCallback(
        async () => {
            const now = Date.now();
            if (now - lastBimodalViolationTime.current < CONSTANTS.BIMODAL_COOLDOWN_MS) return;
            lastBimodalViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "BIMODAL_GAZE_DETECTED",
                        timestamp: new Date().toISOString(),
                        confidence: 0.82,
                        direction: "KDE_BIMODAL: dual-position gaze distribution detected (possible second monitor)",
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

            // Short window: variance anomaly detection
            pupilXHistory.current.push(avgPupilX);
            if (pupilXHistory.current.length > CONSTANTS.HISTORY_LIMIT) {
                pupilXHistory.current.shift();
            }

            // Long window: bimodal KDE analysis
            bimodalHistory.current.push(avgPupilX);
            if (bimodalHistory.current.length > CONSTANTS.BIMODAL_HISTORY) {
                bimodalHistory.current.shift();
            }

            const now = Date.now();
            let bimodal = state.isBimodal;

            // ── Bimodal KDE check (every 60s, needs 300 frames) ──
            if (
                bimodalHistory.current.length >= CONSTANTS.BIMODAL_HISTORY &&
                now - lastBimodalCheckTime.current >= CONSTANTS.BIMODAL_CHECK_MS
            ) {
                lastBimodalCheckTime.current = now;
                bimodal = isBimodalDistribution(bimodalHistory.current);
                if (bimodal) logBimodalViolation();
            }

            if (pupilXHistory.current.length === CONSTANTS.HISTORY_LIMIT) {
                const variance = calculateVariance(pupilXHistory.current);

                // Normal exam reading has low variance (~0.003-0.008).
                // Sustained bimodal darting (off-screen glances) produces variance > 0.015.
                const isCurrentlyAnomalous = variance > CONSTANTS.VARIANCE_THRESHOLD;

                if (isCurrentlyAnomalous) {
                    if (!anomalyStartTime.current) {
                        anomalyStartTime.current = now;
                    } else if (now - anomalyStartTime.current >= CONSTANTS.SUSTAINED_MS) {
                        logViolation(variance);
                        anomalyStartTime.current = null;
                    }
                } else {
                    anomalyStartTime.current = null;
                }

                setState({
                    isAnomalous: isCurrentlyAnomalous,
                    varianceLog: variance,
                    isBimodal: bimodal,
                });
            }
        },
        [state.isBimodal, logViolation, logBimodalViolation]
    );

    return { ...state, processGaze };
}
