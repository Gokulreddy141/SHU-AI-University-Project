"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface AudioSpoofingState {
    isAudioSpoofed: boolean;
    reason: string | null;
}

const CONSTANTS = {
    COOLDOWN_MS: 120000, 
    ANALYSIS_INTERVAL_MS: 2000, // Analyze every 2s
    HISTORY_SIZE: 15, // Keep 30 seconds of FFT data
};

export function useAudioSpoofingDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<AudioSpoofingState>({
        isAudioSpoofed: false,
        reason: null,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Store sum of frequency bins over time
    const volumeHistory = useRef<number[]>([]);
    const lastViolationTime = useRef<number>(0);
    const isRunning = useRef<boolean>(false);

    const logViolation = useCallback(
        async (reason: string) => {
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
                        type: "SYNTHETIC_AUDIO_DETECTED",
                        timestamp: new Date().toISOString(),
                        confidence: 0.85,
                        direction: reason,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    const analyzeAudio = useCallback(() => {
        if (!isRunning.current || !analyserRef.current) return;

        const analyser = analyserRef.current;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume (RMS proxy)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;

        volumeHistory.current.push(avgVolume);
        if (volumeHistory.current.length > CONSTANTS.HISTORY_SIZE) {
            volumeHistory.current.shift();
        }

        // Feature extraction across the last 30 seconds
        if (volumeHistory.current.length === CONSTANTS.HISTORY_SIZE) {
            let variance = 0;
            let mean = 0;
            let numZeroes = 0;

            for (const v of volumeHistory.current) {
                mean += v;
                if (v === 0) numZeroes++;
            }
            mean /= CONSTANTS.HISTORY_SIZE;

            for (const v of volumeHistory.current) {
                variance += Math.pow(v - mean, 2);
            }
            variance /= CONSTANTS.HISTORY_SIZE;

            const stdDev = Math.sqrt(variance);

            let isSpoofed = false;
            let spoofReason = "";

            /* 
               Heuristic 1: "Perfect Silence"
               Real microphones always have a noise floor (stdDev > 0, avg > 0).
               Virtual audio cables transmitting no audio output pure 0s.
               If a candidate is "talking" (triggering other voice APIs) but
               the raw stream here drops to PERFECT 0 repeatedly, it's a virtual cable.
            */
            if (numZeroes > CONSTANTS.HISTORY_SIZE * 0.8) {
                isSpoofed = true;
                spoofReason = "Unnatural absolute silence (Virtual Cable Deadzone)";
            }

            /* 
               Heuristic 2: "Perfect Static / Low Variance Loop"
               TTS or looped audio often has an exact constant volume level when active,
               unlike the massive dynamic range of human speech.
               If mean > 20 (they are "speaking") but stdDev < 1, it's suspiciously static.
            */
            if (mean > 20 && stdDev < 1.0) {
                isSpoofed = true;
                spoofReason = `Unnatural constant amplitude pattern (stdDev: ${stdDev.toFixed(2)})`;
            }

            if (isSpoofed) {
                setState({ isAudioSpoofed: true, reason: spoofReason });
                logViolation(spoofReason);
            } else {
                setState({ isAudioSpoofed: false, reason: null });
            }
        }
    }, [logViolation]);

    useEffect(() => {
        if (!enabled) return;

        // Use ref so cleanup can reliably cancel even if unmount races the async setup
        const intervalRef = { id: undefined as NodeJS.Timeout | undefined };
        let cancelled = false;

        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                if (cancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                mediaStreamRef.current = stream;

                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContext();
                audioContextRef.current = audioCtx;

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.8;
                analyserRef.current = analyser;

                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                isRunning.current = true;
                intervalRef.id = setInterval(analyzeAudio, CONSTANTS.ANALYSIS_INTERVAL_MS);

            } catch (err) {
                console.warn("Audio Spoofing hook failed to get mic:", err);
            }
        };

        setupAudio();

        return () => {
            cancelled = true;
            isRunning.current = false;
            if (intervalRef.id !== undefined) clearInterval(intervalRef.id);

            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => { });
            }

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [enabled, analyzeAudio]);

    return state;
}
