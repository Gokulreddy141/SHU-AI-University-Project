"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface HandTrackingState {
    isModelLoaded: boolean;
    handDetected: boolean;
    isAnomalous: boolean;
}

const CHECK_INTERVAL_MS = 100; // ~10fps throttle for HandLandmarker
// Raised from 5s → 8s: the "inLowerFrame + fingersCurled" heuristic also triggers
// on normal typing posture (hands resting on keyboard below camera midpoint).
// 8s sustained eliminates transient false positives from typing and chin-resting.
const SUSTAINED_ANOMALY_MS = 8000;
// Raised from 30s → 60s: hand-detection false positives cluster in time (lighting,
// angle changes); 60s prevents a single posture shift from generating many reports.
const COOLDOWN_MS = 60000;

export function useHandTracking(
    sessionId: string,
    candidateId: string,
    videoRef: React.RefObject<HTMLVideoElement | null>,
    enabled: boolean = true
) {
    const [state, setState] = useState<HandTrackingState>({
        isModelLoaded: false,
        handDetected: false,
        isAnomalous: false,
    });

    const handLandmarkerRef = useRef<any>(null); // Type 'any' used to avoid deep tasks-vision TS dependency
    const isRunning = useRef<boolean>(false);
    const lastVideoTime = useRef<number>(-1);

    const anomalyStartTime = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);
    const requestRef = useRef<number | null>(null);

    const logViolation = useCallback(
        async () => {
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
                        type: "HAND_GESTURE_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.75,
                        direction: "PHONE_HOLDING_DETECTED",
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    // Main detection loop
    const detectFrame = useCallback(() => {
        if (!isRunning.current || !videoRef.current || !handLandmarkerRef.current) return;

        const video = videoRef.current;
        const now = Date.now();

        // 10fps Throttle + Wait for new video frame
        if (
            video.currentTime !== lastVideoTime.current &&
            video.readyState >= 2
        ) {
            lastVideoTime.current = video.currentTime;

            // Tasks-vision returns results directly, unlike old FaceMesh callback
            const results = handLandmarkerRef.current.detectForVideo(video, performance.now());

            if (results.landmarks && results.landmarks.length > 0) {
                let foundAnomalousHand = false;

                // Check all detected hands
                for (const hand of results.landmarks) {
                    // Landmark indices: 0 = wrist, 8 = index tip, 12 = middle tip
                    // 5 = index MCP (knuckle), 9 = middle MCP
                    const wrist = hand[0];
                    const indexTip = hand[8];
                    const middleTip = hand[12];
                    const indexMCP = hand[5];
                    const middleMCP = hand[9];

                    // Heuristic 1: Is hand in lower 40% of the frame? (Normalized y > 0.6)
                    const inLowerFrame = wrist.y > 0.6 || indexMCP.y > 0.6;

                    // Heuristic 2: Are fingers curled (like holding a phone)?
                    // Y axis goes DOWN. Tip y > MCP y means fingers are pointing DOWN relative to camera,
                    // or curled closed into the palm.
                    const fingersCurled = indexTip.y > indexMCP.y && middleTip.y > middleMCP.y;

                    if (inLowerFrame && fingersCurled) {
                        foundAnomalousHand = true;
                        break;
                    }
                }

                setState((s) => ({
                    ...s,
                    handDetected: true,
                    isAnomalous: foundAnomalousHand,
                }));

                // Sustained anomaly check
                if (foundAnomalousHand) {
                    if (!anomalyStartTime.current) {
                        anomalyStartTime.current = now;
                    } else if (now - anomalyStartTime.current >= SUSTAINED_ANOMALY_MS) {
                        logViolation();
                        anomalyStartTime.current = null; // Reset after logging
                    }
                } else {
                    anomalyStartTime.current = null;
                }

            } else {
                setState((s) => ({ ...s, handDetected: false, isAnomalous: false }));
                anomalyStartTime.current = null;
            }
        }

        // Use setTimeout inside rAF for 10fps throttling (~100ms)
        setTimeout(() => {
            if (isRunning.current) {
                requestRef.current = requestAnimationFrame(detectFrame);
            }
        }, CHECK_INTERVAL_MS);

    }, [videoRef, logViolation]);

    // Load Tasks Vision WASM model
    useEffect(() => {
        if (!enabled) return;
        let isMounted = true;

        const loadModel = async () => {
            try {
                // Dynamic import to avoid SSR issues and separate bundle
                const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");

                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
                );

                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU", // Prefer GPU but fall back to CPU if needed
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                if (isMounted) {
                    handLandmarkerRef.current = landmarker;
                    isRunning.current = true;
                    // Setting isModelLoaded triggers the second useEffect which starts the rAF loop.
                    // Do NOT call detectFrame() here — that would create a second parallel loop.
                    setState((s) => ({ ...s, isModelLoaded: true }));
                }
            } catch (err) {
                console.warn("HandLandmarker load failed:", err);
            }
        };

        loadModel();

        return () => {
            isMounted = false;
            isRunning.current = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (handLandmarkerRef.current) {
                handLandmarkerRef.current.close();
            }
        };
    }, [detectFrame, videoRef, enabled]);

    // Start (or restart) the detection loop when the model is loaded or the video becomes ready.
    useEffect(() => {
        if (!state.isModelLoaded || !isRunning.current) return;

        const startLoop = () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(detectFrame);
        };

        startLoop();

        // Also restart when the video element starts playing (handles the case where
        // the model finishes loading before the camera stream is ready).
        const video = videoRef.current;
        if (video) {
            video.addEventListener("canplay", startLoop);
            video.addEventListener("play", startLoop);
        }

        return () => {
            if (video) {
                video.removeEventListener("canplay", startLoop);
                video.removeEventListener("play", startLoop);
            }
        };
    }, [state.isModelLoaded, detectFrame, videoRef]);

    return state;
}
