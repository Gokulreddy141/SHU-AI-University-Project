"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface AmbientNoiseState {
    audioLevel: number;       // Current RMS level (0..1)
    isSuspicious: boolean;    // Sustained noise detected
    isListening: boolean;     // Mic successfully initialized
}

const NOISE_THRESHOLD = 0.04;       // RMS above this = significant audio
const SUSTAINED_NOISE_MS = 8000;    // 8 seconds before flagging
const COOLDOWN_MS = 20000;          // 20 seconds between flags
const CHECK_INTERVAL_MS = 200;      // Sample audio every 200ms

/**
 * Detects sustained ambient noise (e.g. someone talking in background,
 * playing audio, or receiving dictation) without any lip movement.
 * 
 * This hook only monitors audio levels. Lip-sync cross-referencing
 * is handled by useLipSyncDetection.
 */
export function useAmbientNoiseDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<AmbientNoiseState>({
        audioLevel: 0,
        isSuspicious: false,
        isListening: false,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const noiseStart = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);
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

    // Initialize microphone and audio analysis
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                const audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;

                source.connect(analyser);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                streamRef.current = stream;
                audioDataRef.current = new Float32Array(analyser.fftSize); // Pre-allocate once

                setState((prev) => ({ ...prev, isListening: true }));
            } catch {
                // Mic access denied — degrade gracefully
            }
        };

        initAudio();

        return () => {
            cancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [enabled]);

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

            // Track sustained noise
            if (isSuspicious) {
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
