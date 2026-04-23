"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import type { SharedMic } from "./useSharedMic";

interface AudioSpoofingState {
    isAudioSpoofed: boolean;
    reason: string | null;
}

const CONSTANTS = {
    COOLDOWN_MS: 120000,
    ANALYSIS_INTERVAL_MS: 2000, // Analyze every 2s
    HISTORY_SIZE: 15,           // Keep 30 seconds of FFT data
    STARTUP_GRACE_MS: 15000,    // 15s before any violation can fire
};

/**
 * Detects synthetic / virtual-cable audio using amplitude heuristics:
 * 1. Perfect silence (virtual cable deadzone)
 * 2. Constant amplitude (TTS / looped audio)
 *
 * Accepts an optional SharedMic — when provided, skips getUserMedia and
 * attaches its own AnalyserNode to the shared source.
 */
export function useAudioSpoofingDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean,
    sharedMic?: SharedMic | null
) {
    const [state, setState] = useState<AudioSpoofingState>({
        isAudioSpoofed: false,
        reason: null,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const volumeHistory = useRef<number[]>([]);
    const lastViolationTime = useRef<number>(0);
    const isRunning = useRef<boolean>(false);
    const initTime = useRef<number>(0);

    const logViolation = useCallback(
        async (reason: string) => {
            const now = Date.now();
            if (now - initTime.current < CONSTANTS.STARTUP_GRACE_MS) return;
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

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;

        volumeHistory.current.push(avgVolume);
        if (volumeHistory.current.length > CONSTANTS.HISTORY_SIZE) {
            volumeHistory.current.shift();
        }

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

            // Heuristic 1: Perfect Silence — virtual cable deadzone
            if (numZeroes > CONSTANTS.HISTORY_SIZE * 0.8) {
                isSpoofed = true;
                spoofReason = "Unnatural absolute silence (Virtual Cable Deadzone)";
            }

            // Heuristic 2: Constant amplitude — TTS / looped audio
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

        const intervalRef = { id: undefined as ReturnType<typeof setInterval> | undefined };
        let cancelled = false;

        const setupAudio = async () => {
            let analyser: AnalyserNode;

            if (sharedMic?.isReady && sharedMic.audioContext && sharedMic.sourceNode) {
                analyser = sharedMic.audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.8;
                sharedMic.sourceNode.connect(analyser);
                analyserRef.current = analyser;
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    if (cancelled) {
                        stream.getTracks().forEach(t => t.stop());
                        return;
                    }
                    mediaStreamRef.current = stream;

                    const audioCtx = new AudioContext();
                    audioContextRef.current = audioCtx;

                    analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 256;
                    analyser.smoothingTimeConstant = 0.8;
                    analyserRef.current = analyser;

                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                } catch (err) {
                    console.warn("Audio Spoofing hook failed to get mic:", err);
                    return;
                }
            }

            if (cancelled) {
                analyser.disconnect();
                return;
            }

            initTime.current = Date.now();
            isRunning.current = true;
            intervalRef.id = setInterval(analyzeAudio, CONSTANTS.ANALYSIS_INTERVAL_MS);
        };

        setupAudio();

        return () => {
            cancelled = true;
            isRunning.current = false;
            if (intervalRef.id !== undefined) clearInterval(intervalRef.id);
            analyserRef.current?.disconnect();
            analyserRef.current = null;
            if (!sharedMic) {
                if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                    audioContextRef.current.close().catch(() => {});
                }
                mediaStreamRef.current?.getTracks().forEach(track => track.stop());
                audioContextRef.current = null;
                mediaStreamRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, analyzeAudio, sharedMic?.isReady]);

    return state;
}
