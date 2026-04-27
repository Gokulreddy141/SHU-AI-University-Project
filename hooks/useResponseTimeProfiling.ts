"use client";
import { useState, useCallback, useRef } from "react";

interface ResponseTimeState {
    avgResponseTime: number;
    isAnomalous: boolean;
    questionsAnswered: number;
}

// Raised from 5s → 12s: expert candidates answer simple MCQs in 2-4s legitimately.
// 12s still catches pre-looked-up answers while allowing genuine fast recall.
const INSTANT_THRESHOLD_MS = 12000;
// Raised from 3min → 5min: hard coding problems genuinely take 4+ minutes.
const SLOW_THRESHOLD_MS = 300000;
const COOLDOWN_MS = 30000;            // 30 seconds between violations

/**
 * Tracks time-per-question to detect:
 * 1. Instant answers (< 5s) — pre-looked-up or AI-generated
 * 2. Abnormally slow answers (> 3 min) — getting external help
 *
 * Pure timing via performance.now(). No network calls for timing.
 */
export function useResponseTimeProfiling(
    sessionId: string,
    candidateId: string
) {
    const [state, setState] = useState<ResponseTimeState>({
        avgResponseTime: 0,
        isAnomalous: false,
        questionsAnswered: 0,
    });

    const questionStartTimes = useRef<Map<string, number>>(new Map());
    const responseTimes = useRef<number[]>([]);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (questionId: string, elapsed: number, reason: "INSTANT" | "TOO_SLOW") => {
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
                        type: "RESPONSE_TIME_ANOMALY",
                        timestamp: new Date().toISOString(),
                        // INSTANT confidence lowered from 0.85 → 0.60: fast answers are often
                // just expert recall, not pre-looked-up answers.
                confidence: reason === "INSTANT" ? 0.60 : 0.65,
                        direction: `${reason} Q:${questionId} T:${Math.round(elapsed / 1000)}s`,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    /**
     * Call when a new question is displayed to the candidate.
     */
    const recordQuestionStart = useCallback((questionId: string) => {
        questionStartTimes.current.set(questionId, performance.now());
    }, []);

    /**
     * Call when the candidate submits/selects an answer.
     * Returns the elapsed time in milliseconds.
     */
    const recordAnswer = useCallback(
        (questionId: string): number => {
            const startTime = questionStartTimes.current.get(questionId);
            if (startTime === undefined) return 0;

            const elapsed = performance.now() - startTime;
            questionStartTimes.current.delete(questionId);

            // Track for average
            responseTimes.current.push(elapsed);

            const avg =
                responseTimes.current.reduce((a, b) => a + b, 0) /
                responseTimes.current.length;

            // Anomaly detection
            const isInstant = elapsed < INSTANT_THRESHOLD_MS;
            const isTooSlow = elapsed > SLOW_THRESHOLD_MS;
            const isAnomalous = isInstant || isTooSlow;

            setState({
                avgResponseTime: Math.round(avg),
                isAnomalous,
                questionsAnswered: responseTimes.current.length,
            });

            if (isInstant) logViolation(questionId, elapsed, "INSTANT");
            if (isTooSlow) logViolation(questionId, elapsed, "TOO_SLOW");

            return elapsed;
        },
        [logViolation]
    );

    return { ...state, recordQuestionStart, recordAnswer };
}
