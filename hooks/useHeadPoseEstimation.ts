"use client";
import { useState, useCallback, useRef } from "react";

interface HeadPose {
    yaw: number;   // Left/Right rotation (-1 to 1)
    pitch: number;  // Up/Down tilt (-1 to 1)
    roll: number;   // Head tilt (-1 to 1)
}

interface HeadPoseState {
    pose: HeadPose;
    isAnomalous: boolean;
}

// Thresholds for anomaly detection (normalized -1 to 1 scale)
// Raised from 0.35 → 0.42: slight natural head tilt while thinking or
// reading across a widescreen was crossing 0.35 and causing false positives.
const YAW_THRESHOLD = 0.42;
// Raised from 0.30 → 0.38: looking at top/bottom of screen causes ~0.32-0.35 pitch.
const PITCH_THRESHOLD = 0.38;
// Raised from 4s → 6s: brief head movements during reading should not flag.
const SUSTAINED_MS = 6000;
const COOLDOWN_MS = 12000;     // 12 seconds between violations

// MediaPipe Face Mesh landmark indices for head pose estimation
// Nose tip, chin, left eye outer corner, right eye outer corner, left ear, right ear
const POSE_LANDMARKS = {
    noseTip: 1,
    chin: 152,
    leftEyeOuter: 33,
    rightEyeOuter: 263,
    foreheadTop: 10,
    leftCheek: 234,
    rightCheek: 454,
};

/**
 * Compute yaw, pitch, roll from FaceMesh landmarks.
 * This is a geometric approximation — not a full PnP solve, but
 * sufficient for proctoring anomaly detection.
 */
function computeHeadPose(landmarks: { x: number; y: number; z: number }[]): HeadPose {
    const nose = landmarks[POSE_LANDMARKS.noseTip];
    const leftCheek = landmarks[POSE_LANDMARKS.leftCheek];
    const rightCheek = landmarks[POSE_LANDMARKS.rightCheek];
    const forehead = landmarks[POSE_LANDMARKS.foreheadTop];
    const chin = landmarks[POSE_LANDMARKS.chin];

    // Yaw: horizontal rotation (nose offset from cheek midpoint)
    const cheekMidX = (leftCheek.x + rightCheek.x) / 2;
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.001;
    const yaw = (nose.x - cheekMidX) / (faceWidth * 0.5);

    // Pitch: vertical tilt (nose position relative to forehead-chin axis)
    const faceHeight = Math.abs(chin.y - forehead.y) || 0.001;
    const faceMidY = (forehead.y + chin.y) / 2;
    const pitch = (nose.y - faceMidY) / (faceHeight * 0.5);

    // Roll: head tilt (angle between eye corners, normalized)
    const leftEye = landmarks[POSE_LANDMARKS.leftEyeOuter];
    const rightEye = landmarks[POSE_LANDMARKS.rightEyeOuter];
    const roll = (rightEye.y - leftEye.y) / (Math.abs(rightEye.x - leftEye.x) || 0.001);

    return {
        yaw: Math.max(-1, Math.min(1, yaw)),
        pitch: Math.max(-1, Math.min(1, pitch)),
        roll: Math.max(-1, Math.min(1, roll)),
    };
}

export function useHeadPoseEstimation(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<HeadPoseState>({
        pose: { yaw: 0, pitch: 0, roll: 0 },
        isAnomalous: false,
    });

    const anomalyStart = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (pose: HeadPose, duration: number) => {
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
                        type: "HEAD_POSE_ANOMALY",
                        timestamp: new Date().toISOString(),
                        duration: Math.round(duration / 1000),
                        confidence: Math.max(Math.abs(pose.yaw), Math.abs(pose.pitch)),
                        direction: `YAW:${pose.yaw.toFixed(2)} PITCH:${pose.pitch.toFixed(2)}`,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    /**
     * Call this from the FaceMesh onResults callback with the raw landmarks.
     * This avoids spinning up a second FaceMesh instance.
     */
    const processLandmarks = useCallback(
        (landmarks: { x: number; y: number; z: number }[]) => {
            if (!landmarks || landmarks.length < 468) return;

            const pose = computeHeadPose(landmarks);
            const isAnomalous =
                Math.abs(pose.yaw) > YAW_THRESHOLD ||
                Math.abs(pose.pitch) > PITCH_THRESHOLD;

            setState({ pose, isAnomalous });

            if (isAnomalous) {
                if (!anomalyStart.current) {
                    anomalyStart.current = Date.now();
                } else {
                    const elapsed = Date.now() - anomalyStart.current;
                    if (elapsed >= SUSTAINED_MS) {
                        logViolation(pose, elapsed);
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
