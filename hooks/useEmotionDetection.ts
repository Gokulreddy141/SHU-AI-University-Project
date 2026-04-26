"use client";

import { useCallback, useRef, useState } from "react";

export type Emotion = "neutral" | "stressed" | "confused" | "anxious";

export interface EmotionState {
    emotion: Emotion;
    stressLevel: number; // 0–1
    confidence: number;  // 0–1
}

// FaceMesh landmark indices used for AU analysis
const LM = {
    // Brow (AU4 — inner brow raise / furrow)
    leftInnerBrow: 107,
    rightInnerBrow: 336,
    // Nose bridge reference
    noseTip: 1,
    // Lip corners (AU12, AU15)
    leftLipCorner: 61,
    rightLipCorner: 291,
    // Lip center (AU20 — lip stretcher)
    upperLip: 13,
    lowerLip: 14,
    // Eye (for EAR widening — AU5)
    leftEyeTop: 159,
    leftEyeBot: 145,
    leftEyeInner: 133,
    leftEyeOuter: 33,
    rightEyeTop: 386,
    rightEyeBot: 374,
    rightEyeInner: 263,
    rightEyeOuter: 362,
};

type Landmark = { x: number; y: number; z: number };

function dist(a: Landmark, b: Landmark): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function ear(top: Landmark, bot: Landmark, inner: Landmark, outer: Landmark): number {
    return dist(top, bot) / (dist(inner, outer) + 1e-6);
}

interface AUs {
    browFurrow: number;  // brow distance to nose — low = furrowed
    lipStretch: number;  // lip corner spread — high = tension/stress
    eyeWiden: number;    // EAR — high = wide eyes (anxiety/surprise)
    mouthOpen: number;   // upper-lower lip distance — high = open mouth
}

function extractAUs(lm: Landmark[]): AUs {
    const leftBrow = lm[LM.leftInnerBrow];
    const rightBrow = lm[LM.rightInnerBrow];
    const nose = lm[LM.noseTip];
    const leftCorner = lm[LM.leftLipCorner];
    const rightCorner = lm[LM.rightLipCorner];
    const upperLip = lm[LM.upperLip];
    const lowerLip = lm[LM.lowerLip];

    // Average brow-to-nose distance (normalised by face width)
    const faceWidth = dist(lm[LM.leftEyeOuter], lm[LM.rightEyeOuter]) + 1e-6;
    const browFurrow =
        (dist(leftBrow, nose) + dist(rightBrow, nose)) / 2 / faceWidth;

    const lipStretch = dist(leftCorner, rightCorner) / faceWidth;
    const mouthOpen = dist(upperLip, lowerLip) / faceWidth;

    const leftEAR = ear(
        lm[LM.leftEyeTop], lm[LM.leftEyeBot],
        lm[LM.leftEyeInner], lm[LM.leftEyeOuter]
    );
    const rightEAR = ear(
        lm[LM.rightEyeTop], lm[LM.rightEyeBot],
        lm[LM.rightEyeInner], lm[LM.rightEyeOuter]
    );
    const eyeWiden = (leftEAR + rightEAR) / 2;

    return { browFurrow, lipStretch, eyeWiden, mouthOpen };
}

function classify(aus: AUs, baseline: AUs): { emotion: Emotion; stressLevel: number; confidence: number } {
    // Delta from personal baseline
    const browDelta = baseline.browFurrow - aus.browFurrow; // positive = more furrowed
    const lipDelta = aus.lipStretch - baseline.lipStretch;   // positive = more stretched
    const eyeDelta = aus.eyeWiden - baseline.eyeWiden;       // positive = wider eyes
    const mouthDelta = aus.mouthOpen - baseline.mouthOpen;

    // Stress: brow furrow + lip tension
    const stressSignal = Math.max(0, browDelta * 3 + lipDelta * 2);
    // Confusion: brow furrow + mouth slightly open, eyes normal
    const confusionSignal = Math.max(0, browDelta * 2 + mouthDelta * 1.5);
    // Anxiety: eye widening + lip tension
    const anxietySignal = Math.max(0, eyeDelta * 3 + lipDelta * 1.5);

    const maxSignal = Math.max(stressSignal, confusionSignal, anxietySignal, 0);

    let emotion: Emotion = "neutral";
    let confidence = 0;

    if (maxSignal > 0.05) {
        if (stressSignal >= confusionSignal && stressSignal >= anxietySignal) {
            emotion = "stressed";
            confidence = Math.min(1, stressSignal / 0.3);
        } else if (confusionSignal >= anxietySignal) {
            emotion = "confused";
            confidence = Math.min(1, confusionSignal / 0.3);
        } else {
            emotion = "anxious";
            confidence = Math.min(1, anxietySignal / 0.3);
        }
    }

    const stressLevel = Math.min(1, maxSignal / 0.3);
    return { emotion, stressLevel, confidence };
}

const COOLDOWN_MS = 60_000; // log at most once per minute

export function useEmotionDetection(
    sessionId: string,
    candidateId: string,
    enabled = true
) {
    const [state, setState] = useState<EmotionState>({
        emotion: "neutral",
        stressLevel: 0,
        confidence: 0,
    });
    const [isCalibrated, setIsCalibrated] = useState(false);

    // Baseline calibration (first 60 frames)
    const CALIBRATION_FRAMES = 60;
    const calibrationSamplesRef = useRef<AUs[]>([]);
    const baselineRef = useRef<AUs | null>(null);
    const calibratedRef = useRef(false);

    // Smooth output
    const smoothRef = useRef<EmotionState>({ emotion: "neutral", stressLevel: 0, confidence: 0 });

    // Sustained-stress tracking for violation logging
    const highStressStartRef = useRef<number | null>(null);
    const lastViolationRef = useRef<number>(0);

    const processLandmarks = useCallback((landmarks: Landmark[]) => {
        if (!enabled || landmarks.length < 400) return;

        const aus = extractAUs(landmarks);

        if (!calibratedRef.current) {
            calibrationSamplesRef.current.push(aus);
            if (calibrationSamplesRef.current.length >= CALIBRATION_FRAMES) {
                const n = calibrationSamplesRef.current.length;
                const baseline: AUs = {
                    browFurrow: calibrationSamplesRef.current.reduce((s, a) => s + a.browFurrow, 0) / n,
                    lipStretch: calibrationSamplesRef.current.reduce((s, a) => s + a.lipStretch, 0) / n,
                    eyeWiden: calibrationSamplesRef.current.reduce((s, a) => s + a.eyeWiden, 0) / n,
                    mouthOpen: calibrationSamplesRef.current.reduce((s, a) => s + a.mouthOpen, 0) / n,
                };
                baselineRef.current = baseline;
                calibratedRef.current = true;
                setIsCalibrated(true);
                calibrationSamplesRef.current = [];
            }
            return;
        }

        const baseline = baselineRef.current!;
        const result = classify(aus, baseline);

        const alpha = 0.2;
        smoothRef.current = {
            emotion: result.confidence > 0.3 ? result.emotion : smoothRef.current.emotion,
            stressLevel: alpha * result.stressLevel + (1 - alpha) * smoothRef.current.stressLevel,
            confidence: alpha * result.confidence + (1 - alpha) * smoothRef.current.confidence,
        };

        setState({ ...smoothRef.current });

        // Log a violation when stress stays high for 10s and cooldown has passed
        const now = Date.now();
        if (smoothRef.current.stressLevel >= 0.65) {
            if (!highStressStartRef.current) highStressStartRef.current = now;
            if (
                now - highStressStartRef.current >= 10_000 &&
                now - lastViolationRef.current >= COOLDOWN_MS &&
                sessionId && candidateId
            ) {
                lastViolationRef.current = now;
                highStressStartRef.current = now; // reset window
                fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "STRESS_DETECTED",
                        direction: smoothRef.current.emotion,
                        confidence: smoothRef.current.confidence,
                        timestamp: new Date().toISOString(),
                    }),
                }).catch(() => { /* non-critical */ });
            }
        } else {
            highStressStartRef.current = null;
        }
    }, [enabled, sessionId, candidateId]);

    return { ...state, isCalibrated, processLandmarks };
}
