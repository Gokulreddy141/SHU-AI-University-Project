"use client";
import { useEffect, useRef, useCallback, useState } from "react";

interface DetectedObject {
    class: string;
    score: number;
}

interface ObjectDetectionState {
    isModelLoaded: boolean;
    detectedObjects: DetectedObject[];
}

// Objects that trigger violations in a proctored exam.
// "laptop" and "book" removed: candidates legitimately use an external monitor/keyboard
// (COCO-SSD classifies keyboards as "laptop") and have books on their desk.
// "remote" removed: TV remotes are common on desks and have near-zero cheat signal.
const SUSPICIOUS_OBJECTS: Record<string, string> = {
    "cell phone": "PHONE_DETECTED",
    "tablet": "UNAUTHORIZED_MATERIAL",
};

// Raised from 0.60 → 0.75: COCO-SSD lite_mobilenet_v2 is inaccurate at 0.60 and
// frequently misclassifies hands, laptops, and books as phones/tablets.
const CONFIDENCE_THRESHOLD = 0.75;
const DETECTION_INTERVAL_MS = 2000; // Run detection every 2 seconds to save CPU
// Raised from 15s → 45s: back-to-back frames at 0.5s intervals can fire multiple
// times from a single physical object; 45s collapses these into one report.
const COOLDOWN_MS = 45000;

export function useObjectDetection(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<ObjectDetectionState>({
        isModelLoaded: false,
        detectedObjects: [],
    });

    const modelRef = useRef<{ detect: (video: HTMLVideoElement) => Promise<Array<{ class: string; score: number }>> } | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastViolationTime = useRef<Record<string, number>>({});
    // Require 2 consecutive detection windows before flagging.
    // A single-frame detection is often a misclassification (hand partially in frame,
    // motion blur, lighting change). Two consecutive windows (~4s apart) is far more reliable.
    const detectionStreak = useRef<Record<string, number>>({});

    const logViolation = useCallback(
        async (type: string, objectClass: string, confidence: number) => {
            const now = Date.now();
            const lastTime = lastViolationTime.current[type] || 0;
            if (now - lastTime < COOLDOWN_MS) return;

            lastViolationTime.current[type] = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type,
                        timestamp: new Date().toISOString(),
                        confidence,
                        direction: objectClass, // Reuse direction field for object label
                    }),
                });
            } catch {
                // Silently fail — violation buffer handles retries
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        const loadModel = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const tf = await import("@tensorflow/tfjs");
                await tf.ready();

                const cocoSsd = await import("@tensorflow-models/coco-ssd");
                const model = await cocoSsd.load({
                    base: "lite_mobilenet_v2", // Fastest model variant
                });

                if (!cancelled) {
                    modelRef.current = model;
                    setState((prev) => ({ ...prev, isModelLoaded: true }));
                }
            } catch {
                // Model load failed — object detection degrades gracefully
            }
        };

        loadModel();

        return () => {
            cancelled = true;
            // Dispose the TF.js model to free GPU memory
            if (modelRef.current && typeof (modelRef.current as any).dispose === "function") {
                (modelRef.current as any).dispose();
                modelRef.current = null;
            }
        };
    }, [enabled]);

    // Run detection loop
    useEffect(() => {
        if (!enabled || !state.isModelLoaded || !videoRef.current) return;

        const runDetection = async () => {
            if (!modelRef.current || !videoRef.current) return;

            try {
                const predictions = await modelRef.current.detect(videoRef.current);

                const suspicious: DetectedObject[] = [];

                const detectedClasses = new Set<string>();
                for (const pred of predictions) {
                    const violationType = SUSPICIOUS_OBJECTS[pred.class];
                    if (violationType && pred.score >= CONFIDENCE_THRESHOLD) {
                        suspicious.push({ class: pred.class, score: pred.score });
                        detectedClasses.add(pred.class);

                        // Increment streak; only fire violation on second consecutive detection
                        detectionStreak.current[pred.class] = (detectionStreak.current[pred.class] || 0) + 1;
                        if (detectionStreak.current[pred.class] >= 2) {
                            logViolation(violationType, pred.class, pred.score);
                        }
                    }
                }

                // Reset streak for objects not seen this frame
                for (const cls of Object.keys(detectionStreak.current)) {
                    if (!detectedClasses.has(cls)) {
                        detectionStreak.current[cls] = 0;
                    }
                }

                setState((prev) => ({ ...prev, detectedObjects: suspicious }));
            } catch {
                // Detection frame failed — non-blocking, retry on next interval
            }
        };

        intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, state.isModelLoaded, videoRef, logViolation]);

    return state;
}
