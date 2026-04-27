"use client";
import { useEffect, useState, useCallback, useRef } from "react";

// Type declarations for Web Speech API (not in lib.dom.d.ts)
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
    error: string;
    message: string;
}

interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

interface VoiceActivityState {
    speechDetected: boolean;
    available: boolean;
    isAnomalous: boolean;
}

const SPEECH_WINDOW_MS = 5000;   // Speech flag stays active for 5 seconds
// Raised from 15s → 45s: a single Web Speech API detection event is ~50% likely
// to be ambient noise. Requiring 45s cooldown means genuine multi-detection
// patterns get flagged but one-off noisy-room events do not repeat-fire.
const COOLDOWN_MS = 45000;

/**
 * Detects if recognizable words are being spoken near the candidate.
 * Uses Web Speech API (Chrome/Edge) to detect speech *presence* only.
 * 
 * PRIVACY: We NEVER store transcripts. Only a boolean "speech detected" flag.
 * 
 * Cross-reference with lip-sync: if speech is detected but candidate's
 * lips aren't moving, someone else is dictating answers.
 * 
 * Graceful degradation: in Firefox/Safari, returns { available: false }.
 */
export function useVoiceActivityDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<VoiceActivityState>({
        speechDetected: false,
        available: false,
        isAnomalous: false,
    });

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastViolationTime = useRef<number>(0);
    const shouldRestart = useRef(true);
    // Require 2 cross-reference hits before logging — one-off ambient noise
    // routinely triggers a single false detection.
    const crossRefHitCount = useRef<number>(0);
    // Refs mirror state so checkCrossReference can read live values even when
    // it is captured inside a stale FaceMesh closure (initAiDetection only runs once)
    const speechDetectedRef = useRef(false);
    const availableRef = useRef(false);

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
                        type: "VOICE_ACTIVITY_ANOMALY",
                        timestamp: new Date().toISOString(),
                        confidence: 0.7,
                        direction: "SPEECH_DETECTED",
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled) return;

        // Check browser support
        const SpeechRecognitionClass =
            (typeof window !== "undefined" &&
                ((window as unknown as Record<string, unknown>)["SpeechRecognition"] ||
                    (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"])) as
            (new () => SpeechRecognitionInstance) | undefined;

        if (!SpeechRecognitionClass) {
            setTimeout(() => setState((prev) => ({ ...prev, available: false })), 0);
            availableRef.current = false;
            return;
        }

        availableRef.current = true;
        setTimeout(() => setState((prev) => ({ ...prev, available: true })), 0);

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognitionRef.current = recognition;
        shouldRestart.current = true;

        recognition.onresult = () => {
            // Speech detected — set flag for 5 seconds
            speechDetectedRef.current = true;
            setState((prev) => ({ ...prev, speechDetected: true }));

            if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
            speechTimerRef.current = setTimeout(() => {
                speechDetectedRef.current = false;
                setState((prev) => ({ ...prev, speechDetected: false }));
            }, SPEECH_WINDOW_MS);
        };

        // Chrome stops recognition after silence — auto-restart
        recognition.onend = () => {
            if (shouldRestart.current) {
                try {
                    recognition.start();
                } catch {
                    // Already started or not allowed
                }
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                shouldRestart.current = false;
                setState((prev) => ({ ...prev, available: false }));
            }
            // Other errors: let onend handle restart
        };

        try {
            recognition.start();
        } catch {
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setState((prev) => ({ ...prev, available: false })), 0);
        }

        return () => {
            shouldRestart.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    // Already stopped
                }
            }
            if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
        };
    }, [enabled]);

    // Track previous isAnomalous in a ref so we only setState when it actually changes
    const prevIsAnomalousRef = useRef(false);

    /**
     * Call from the exam page to cross-reference with lip-sync.
     * Reads live speechDetected/available from refs — safe to call from
     * a stale FaceMesh closure that captured this at mount time.
     */
    const checkCrossReference = useCallback(
        (lipsMoving: boolean) => {
            // Read from refs — always current even in stale closures
            const isAnomalous = speechDetectedRef.current && !lipsMoving && availableRef.current;

            // Only update state when the value actually changes (avoids 30fps setState spam)
            if (isAnomalous !== prevIsAnomalousRef.current) {
                prevIsAnomalousRef.current = isAnomalous;
                setState((prev) => ({ ...prev, isAnomalous }));
            }

            if (isAnomalous) {
                crossRefHitCount.current++;
                // Only log after 2 consecutive hits — filters single ambient-noise events
                if (crossRefHitCount.current >= 2) {
                    logViolation();
                    crossRefHitCount.current = 0;
                }
            } else {
                crossRefHitCount.current = 0;
            }
        },
        [logViolation]
    );

    return { ...state, checkCrossReference };
}
