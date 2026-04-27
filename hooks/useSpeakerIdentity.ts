"use client";
import { useEffect, useRef, useCallback } from "react";
import type { SharedMic } from "./useSharedMic";

// Raised from 15s → 25s: 15s provides only ~5 usable speech frames in a quiet
// exam environment. 25s yields a far more stable voice fingerprint baseline.
const BASELINE_DURATION_MS = 25000;
const CHECK_INTERVAL_MS = 30000;    // Check every 30 seconds
const MFCC_BINS = 13;               // 13 MFCCs — standard for speaker ID
// Lowered from 0.78 → 0.72: candidate voice shifts 5-10% under exam stress
// (pitch rise, throat tension). 0.78 was flagging genuine same-speaker drift.
const SIMILARITY_THRESHOLD = 0.72;
const MIN_ENERGY_DB = -45;          // Only analyze frames with speech (not silence)
const COOLDOWN_MS = 90000;          // Raised from 60s — voice checks are noisy signals

/**
 * Speaker Voice Identity Verification
 *
 * Builds a spectral voice fingerprint at exam start using MFCC-like features:
 * 1. Log-mel filterbank coefficients (approximated via Web Audio FFT)
 * 2. Averaged over the first 15s of speech to create a stable baseline
 *
 * Every 30s, compares the current voice against the baseline using cosine
 * similarity. A significant drop = different speaker is present.
 *
 * Accepts an optional SharedMic — when provided, skips getUserMedia and
 * attaches its own AnalyserNode to the shared source.
 */
export function useSpeakerIdentity(
    sessionId: string,
    candidateId: string,
    enabled: boolean,
    sharedMic?: SharedMic | null
) {
    const baselineRef = useRef<number[] | null>(null);
    const baselineFrames = useRef<number[][]>([]);
    const isBuilding = useRef<boolean>(true);
    const lastCheckTime = useRef<number>(0);
    const lastViolationTime = useRef<number>(0);
    const buildStart = useRef<number>(0);
    // Require 2 consecutive low-similarity checks before flagging.
    // A single check drop (mic repositioned, throat clear) is not a proxy swap.
    const lowSimilarityStreak = useRef<number>(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const logViolation = useCallback(
        async (similarity: number) => {
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
                        type: "VOICE_IDENTITY_MISMATCH",
                        direction: `SIMILARITY:${similarity.toFixed(3)}`,
                        timestamp: new Date().toISOString(),
                        confidence: Math.max(0.7, 1 - similarity),
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    /**
     * Extracts MFCC-approximated features from the frequency domain.
     * Uses triangular filterbank over mel scale (0-8000 Hz, 13 filters).
     */
    const extractFeatures = useCallback(
        (freqData: Float32Array, sampleRate: number): number[] | null => {
            const nyquist = sampleRate / 2;
            const binCount = freqData.length;

            const avgDb = freqData.reduce((sum, v) => sum + v, 0) / freqData.length;
            if (avgDb < MIN_ENERGY_DB) return null;

            const melMin = 2595 * Math.log10(1 + 0 / 700);
            const melMax = 2595 * Math.log10(1 + nyquist / 700);
            const melPoints = Array.from({ length: MFCC_BINS + 2 }, (_, i) =>
                melMin + (i * (melMax - melMin)) / (MFCC_BINS + 1)
            );
            const hzPoints = melPoints.map((m) => 700 * (Math.pow(10, m / 2595) - 1));
            const binPoints = hzPoints.map((hz) => Math.round((hz / nyquist) * binCount));

            const filterbank: number[] = [];
            for (let m = 1; m <= MFCC_BINS; m++) {
                let energy = 0;
                for (let k = binPoints[m - 1]; k < binPoints[m]; k++) {
                    energy += Math.pow(10, freqData[k] / 10) * ((k - binPoints[m - 1]) / (binPoints[m] - binPoints[m - 1]));
                }
                for (let k = binPoints[m]; k < binPoints[m + 1]; k++) {
                    energy += Math.pow(10, freqData[k] / 10) * ((binPoints[m + 1] - k) / (binPoints[m + 1] - binPoints[m]));
                }
                filterbank.push(Math.log(energy + 1e-10));
            }

            return filterbank;
        },
        []
    );

    const cosineSimilarity = useCallback((a: number[], b: number[]): number => {
        const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
        const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
        const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
        return dot / (magA * magB + 1e-8);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        let mounted = true;

        const start = async () => {
            let analyser: AnalyserNode;
            let sampleRate = 16000;

            if (sharedMic?.isReady && sharedMic.audioContext && sharedMic.sourceNode) {
                sampleRate = sharedMic.audioContext.sampleRate;
                analyser = sharedMic.audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0;
                sharedMic.sourceNode.connect(analyser);
                analyserRef.current = analyser;
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { sampleRate: 16000, channelCount: 1 },
                        video: false,
                    });
                    if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

                    streamRef.current = stream;
                    const ctx = new AudioContext({ sampleRate: 16000 });
                    audioContextRef.current = ctx;
                    sampleRate = ctx.sampleRate;

                    analyser = ctx.createAnalyser();
                    analyser.fftSize = 2048;
                    analyser.smoothingTimeConstant = 0;
                    analyserRef.current = analyser;

                    const source = ctx.createMediaStreamSource(stream);
                    source.connect(analyser);
                } catch {
                    return; // Mic unavailable
                }
            }

            if (!mounted) {
                analyser.disconnect();
                return;
            }

            const freqData = new Float32Array(analyser.frequencyBinCount);
            buildStart.current = Date.now();

            const analyze = () => {
                if (!mounted) return;
                analyser.getFloatFrequencyData(freqData);

                const features = extractFeatures(freqData, sampleRate);

                if (features) {
                    const now = Date.now();

                    // Phase 1: Build baseline
                    if (isBuilding.current) {
                        if (now - buildStart.current < BASELINE_DURATION_MS) {
                            baselineFrames.current.push(features);
                        } else if (baselineFrames.current.length >= 5) {
                            const avg = features.map((_, i) =>
                                baselineFrames.current.reduce((sum, f) => sum + f[i], 0) / baselineFrames.current.length
                            );
                            baselineRef.current = avg;
                            isBuilding.current = false;
                            lastCheckTime.current = now;
                        }
                    }

                    // Phase 2: Periodic comparison
                    if (!isBuilding.current && baselineRef.current && now - lastCheckTime.current >= CHECK_INTERVAL_MS) {
                        lastCheckTime.current = now;
                        const sim = cosineSimilarity(baselineRef.current, features);
                        if (sim < SIMILARITY_THRESHOLD) {
                            lowSimilarityStreak.current++;
                            if (lowSimilarityStreak.current >= 2) {
                                logViolation(sim);
                                lowSimilarityStreak.current = 0;
                            }
                        } else {
                            lowSimilarityStreak.current = 0;
                        }
                    }
                }

                animFrameRef.current = requestAnimationFrame(analyze);
            };

            animFrameRef.current = requestAnimationFrame(analyze);
        };

        start();

        return () => {
            mounted = false;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            analyserRef.current?.disconnect();
            analyserRef.current = null;
            if (!sharedMic) {
                streamRef.current?.getTracks().forEach(t => t.stop());
                audioContextRef.current?.close().catch(() => {});
                streamRef.current = null;
                audioContextRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, extractFeatures, cosineSimilarity, logViolation, sharedMic?.isReady]);
}
