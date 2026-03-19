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

// Objects that trigger violations in a proctored exam
const SUSPICIOUS_OBJECTS: Record<string, string> = {
    "cell phone": "PHONE_DETECTED",
    "book": "UNAUTHORIZED_MATERIAL",
    "laptop": "UNAUTHORIZED_MATERIAL",
    "remote": "PHONE_DETECTED",
    "tablet": "UNAUTHORIZED_MATERIAL",
};

const CONFIDENCE_THRESHOLD = 0.6;
const DETECTION_INTERVAL_MS = 2000; // Run detection every 2 seconds to save CPU
const COOLDOWN_MS = 15000; // 15 seconds between same-type violations

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

                for (const pred of predictions) {
                    const violationType = SUSPICIOUS_OBJECTS[pred.class];
                    if (violationType && pred.score >= CONFIDENCE_THRESHOLD) {
                        suspicious.push({ class: pred.class, score: pred.score });
                        logViolation(violationType, pred.class, pred.score);
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
