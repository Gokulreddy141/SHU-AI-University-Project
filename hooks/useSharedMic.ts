"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Manages ONE shared getUserMedia stream for the entire exam session.
 *
 * All audio analysis hooks (useAmbientNoiseDetection, useSileroVAD,
 * useSpeakerIdentity, useAudioSpoofingDetection) connect their own
 * AnalyserNode to this single source — no duplicate mic acquisitions.
 *
 * Usage in each hook:
 *   const analyser = sharedMic.audioContext!.createAnalyser();
 *   analyser.fftSize = MY_FFT_SIZE;
 *   sharedMic.sourceNode!.connect(analyser);
 *   // on cleanup: analyser.disconnect()
 */
export interface SharedMic {
    stream: MediaStream | null;
    audioContext: AudioContext | null;
    sourceNode: MediaStreamAudioSourceNode | null;
    isReady: boolean;
}

export function useSharedMic(enabled: boolean): SharedMic {
    const [isReady, setIsReady] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const contextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        const init = async () => {
            try {
                // Request mic at 16kHz — suitable for all speech analysis hooks.
                // Ambient noise detection only needs RMS so sample rate is irrelevant.
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: false, // Keep raw signal for spoofing detection
                        noiseSuppression: false,
                        autoGainControl: false,
                    },
                    video: false,
                });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

                const ctx = new AudioContext({ sampleRate: 16000 });
                const source = ctx.createMediaStreamSource(stream);

                streamRef.current = stream;
                contextRef.current = ctx;
                sourceRef.current = source;
                setIsReady(true);
            } catch {
                // Mic denied — hooks degrade gracefully
            }
        };

        init();

        return () => {
            cancelled = true;
            // Each hook disconnects its own analyser — we just close the stream here
            streamRef.current?.getTracks().forEach(t => t.stop());
            contextRef.current?.close().catch(() => {});
            streamRef.current = null;
            contextRef.current = null;
            sourceRef.current = null;
            setIsReady(false);
        };
    }, [enabled]);

    return {
        stream: streamRef.current,
        audioContext: contextRef.current,
        sourceNode: sourceRef.current,
        isReady,
    };
}
