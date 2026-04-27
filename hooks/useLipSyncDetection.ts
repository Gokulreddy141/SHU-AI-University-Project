"use client";
import { useState, useCallback, useRef } from "react";

interface LipSyncState {
    lipMovement: number;
    isSuspicious: boolean;
}

const LIP_MOVEMENT_THRESHOLD = 0.008; // lip distance variation threshold
// Raised from 3s → 10s: candidates reading silently will have still lips
// while ambient noise (HVAC, street) is above threshold. 3s was far too short
// to distinguish background noise from someone dictating answers to them.
const SUSPICIOUS_DURATION_MS = 10000;
const COOLDOWN_MS = 30000;            // Raised from 10s to reduce noise in quiet rooms

// FaceMesh landmark indices for lip detection
const UPPER_LIP_CENTER = 13;
const LOWER_LIP_CENTER = 14;

/**
 * Detects lip-sync mismatch: audio is heard but lips aren't moving.
 * 
 * ARCHITECTURE: This hook does NOT create its own FaceMesh or mic stream.
 * It receives landmarks via processLandmarks() (piggybacked from main FaceMesh)
 * and audio level via setAudioLevel() (shared from useAmbientNoiseDetection).
 * 
 * This eliminates the previous DRY violation: duplicate FaceMesh + duplicate mic.
 */
export function useLipSyncDetection(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<LipSyncState>({
        lipMovement: 0,
        isSuspicious: false,
    });

    const lipDistanceHistory = useRef<number[]>([]);
    const mismatchStart = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);
    const currentAudioLevel = useRef<number>(0);

    const logViolation = useCallback(
        async (duration: number) => {
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
                        type: "LIP_SYNC_MISMATCH",
                        timestamp: new Date().toISOString(),
                        duration: Math.round(duration / 1000),
                        confidence: 0.75,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    /**
     * Call from the ambient noise hook's audio sampling loop.
     * Keeps the audio level in sync without a second mic stream.
     */
    const setAudioLevel = useCallback((rms: number) => {
        currentAudioLevel.current = rms;
    }, []);

    /**
     * Call from the FaceMesh onResults callback with raw landmarks.
     * Same pattern as useHeadPoseEstimation.processLandmarks().
     */
    const processLandmarks = useCallback(
        (landmarks: { x: number; y: number; z: number }[]) => {
            if (!landmarks || landmarks.length < 468) return;

            const upperLip = landmarks[UPPER_LIP_CENTER];
            const lowerLip = landmarks[LOWER_LIP_CENTER];
            const lipDist = Math.sqrt(
                Math.pow(upperLip.x - lowerLip.x, 2) +
                Math.pow(upperLip.y - lowerLip.y, 2)
            );

            // Track lip movement variation (sliding window of 30 frames)
            lipDistanceHistory.current.push(lipDist);
            if (lipDistanceHistory.current.length > 30) {
                lipDistanceHistory.current.shift();
            }

            // Calculate lip variation (standard deviation of recent distances)
            const history = lipDistanceHistory.current;
            const avg = history.reduce((a, b) => a + b, 0) / history.length;
            const variance = history.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / history.length;
            const lipVariation = Math.sqrt(variance);

            // Raised from 0.02 → 0.06 to match NOISE_THRESHOLD in useAmbientNoiseDetection.
            // 0.02 caught every environmental hum; 0.06 means audible speech-level sound.
            const hasAudio = currentAudioLevel.current > 0.06;
            const hasLipMovement = lipVariation > LIP_MOVEMENT_THRESHOLD;
            const isSuspicious = hasAudio && !hasLipMovement;

            setState({ lipMovement: lipVariation, isSuspicious });

            // Flag after sustained mismatch
            if (isSuspicious) {
                if (!mismatchStart.current) {
                    mismatchStart.current = Date.now();
                } else {
                    const elapsed = Date.now() - mismatchStart.current;
                    if (elapsed >= SUSPICIOUS_DURATION_MS) {
                        logViolation(elapsed);
                        mismatchStart.current = null;
                    }
                }
            } else {
                mismatchStart.current = null;
            }
        },
        [logViolation]
    );

    return { ...state, processLandmarks, setAudioLevel };
}
