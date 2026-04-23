"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { SharedMic } from "./useSharedMic";

interface AmbientNoiseState {
    audioLevel: number;       // Current RMS level (0..1)
    isSuspicious: boolean;    // Sustained noise detected
    isListening: boolean;     // Mic successfully initialized
}

const NOISE_THRESHOLD = 0.04;       // RMS above this = significant audio
const SUSTAINED_NOISE_MS = 12000;   // 12 seconds before flagging (was 8s — reduce false positives)
const COOLDOWN_MS = 60000;          // 60 seconds between flags (was 20s)
const CHECK_INTERVAL_MS = 200;      // Sample audio every 200ms
const STARTUP_GRACE_MS = 15000;     // 15s after mic init before any violation

/**
 * Detects sustained ambient noise (e.g. someone talking in background,
 * playing audio, or receiving dictation) without any lip movement.
 *
 * Accepts an optional SharedMic — when provided, skips getUserMedia and
 * attaches its own AnalyserNode to the shared source. This prevents
 * duplicate mic acquisitions when multiple audio hooks run together.
 */
export function useAmbientNoiseDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean,
    sharedMic?: SharedMic | null
) {
    const [state, setState] = useState<AmbientNoiseState>({
        audioLevel: 0,
        isSuspicious: false,
        isListening: false,
    });

    // Own audio context/stream — only used when sharedMic is not provided
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const analyserRef = useRef<AnalyserNode | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const noiseStart = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);
    const initTime = useRef<number>(0);
    const audioDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);

    const logViolation = useCallback(
        async (duration: number, confidence: number) => {
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
                        type: "AMBIENT_NOISE",
                        timestamp: new Date().toISOString(),
                        duration: Math.round(duration / 1000),
                        confidence,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    // Initialize audio — either attach to sharedMic or open own stream
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        const initAudio = async () => {
            let analyser: AnalyserNode;

            if (sharedMic?.isReady && sharedMic.audioContext && sharedMic.sourceNode) {
                // Attach own AnalyserNode to the shared source
                analyser = sharedMic.audioContext.createAnalyser();
                analyser.fftSize = 512;
                sharedMic.sourceNode.connect(analyser);
            } else {
                // Fall back to own getUserMedia
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    if (cancelled) {
                        stream.getTracks().forEach((t) => t.stop());
                        return;
                    }

                    const audioContext = new AudioContext();
                    const source = audioContext.createMediaStreamSource(stream);
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 512;
                    source.connect(analyser);

                    audioContextRef.current = audioContext;
                    streamRef.current = stream;
                } catch {
                    // Mic access denied — degrade gracefully
                    return;
                }
            }

            if (cancelled) {
                analyser.disconnect();
                return;
            }

            analyserRef.current = analyser;
            audioDataRef.current = new Float32Array(analyser.fftSize);
            initTime.current = Date.now();
            setState((prev) => ({ ...prev, isListening: true }));
        };

        initAudio();

        return () => {
            cancelled = true;
            analyserRef.current?.disconnect();
            analyserRef.current = null;
            // Only stop own stream — shared stream is managed by useSharedMic
            if (!sharedMic) {
                streamRef.current?.getTracks().forEach((t) => t.stop());
                audioContextRef.current?.close().catch(() => {});
                streamRef.current = null;
                audioContextRef.current = null;
            }
            setState((prev) => ({ ...prev, isListening: false }));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, sharedMic?.isReady]);

    // Audio sampling loop
    useEffect(() => {
        if (!enabled || !state.isListening) return;

        intervalRef.current = setInterval(() => {
            if (!analyserRef.current || !audioDataRef.current) return;

            analyserRef.current.getFloatTimeDomainData(audioDataRef.current);

            // Calculate RMS
            let sum = 0;
            for (let i = 0; i < audioDataRef.current.length; i++) {
                sum += audioDataRef.current[i] * audioDataRef.current[i];
            }
            const rms = Math.sqrt(sum / audioDataRef.current.length);

            const isSuspicious = rms > NOISE_THRESHOLD;

            setState((prev) => ({
                ...prev,
                audioLevel: rms,
                isSuspicious,
            }));

            // Track sustained noise — skip entirely during startup grace period
            const withinGrace = Date.now() - initTime.current < STARTUP_GRACE_MS;
            if (!withinGrace && isSuspicious) {
                if (!noiseStart.current) {
                    noiseStart.current = Date.now();
                } else {
                    const elapsed = Date.now() - noiseStart.current;
                    if (elapsed >= SUSTAINED_NOISE_MS) {
                        logViolation(elapsed, Math.min(rms * 10, 1));
                        noiseStart.current = Date.now(); // Reset
                    }
                }
            } else {
                noiseStart.current = null;
            }
        }, CHECK_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, state.isListening, logViolation]);

    return state;
}
