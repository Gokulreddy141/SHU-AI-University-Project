"use client";

import { useCallback, useRef, useState } from "react";

export type AttentionLevel = "focused" | "distracted" | "absent";

export interface AttentionState {
    score: number; // 0–100
    level: AttentionLevel;
}

export interface QuestionAttentionRecord {
    questionId: string;
    attentionScore: number;
    timeSpentSeconds: number;
}

interface AttentionInputs {
    gazeOnScreen: boolean;
    facePresent: boolean;
    blinkRateNormal: boolean;
    headPoseStable: boolean;
}

// Weighted formula: gaze 35% + face 30% + blink 15% + headPose 20%
function computeScore(inputs: AttentionInputs): number {
    const score =
        (inputs.gazeOnScreen ? 35 : 0) +
        (inputs.facePresent ? 30 : 0) +
        (inputs.blinkRateNormal ? 15 : 0) +
        (inputs.headPoseStable ? 20 : 0);
    return score;
}

function scoreToLevel(score: number): AttentionLevel {
    if (score >= 65) return "focused";
    if (score >= 30) return "distracted";
    return "absent";
}

export function useAttentionScore() {
    const [state, setState] = useState<AttentionState>({ score: 100, level: "focused" });

    // Per-question tracking
    const activeQuestionRef = useRef<string | null>(null);
    const questionStartRef = useRef<number>(0);
    const questionScoreSamplesRef = useRef<number[]>([]);
    const recordsRef = useRef<QuestionAttentionRecord[]>([]);

    // Rolling window for smooth score
    const samplesRef = useRef<number[]>([]);
    const WINDOW = 30; // last 30 samples (~3s at 10Hz)

    const update = useCallback((inputs: AttentionInputs) => {
        const raw = computeScore(inputs);

        samplesRef.current.push(raw);
        if (samplesRef.current.length > WINDOW) samplesRef.current.shift();

        const avg = Math.round(
            samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length
        );

        setState({ score: avg, level: scoreToLevel(avg) });

        // Accumulate per-question samples
        if (activeQuestionRef.current !== null) {
            questionScoreSamplesRef.current.push(raw);
        }
    }, []);

    const startQuestion = useCallback((questionId: string) => {
        activeQuestionRef.current = questionId;
        questionStartRef.current = Date.now();
        questionScoreSamplesRef.current = [];
    }, []);

    const endQuestion = useCallback((): QuestionAttentionRecord | null => {
        const qId = activeQuestionRef.current;
        if (!qId) return null;

        const samples = questionScoreSamplesRef.current;
        const avgScore =
            samples.length > 0
                ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
                : 0;
        const timeSpentSeconds = Math.round((Date.now() - questionStartRef.current) / 1000);

        const record: QuestionAttentionRecord = {
            questionId: qId,
            attentionScore: avgScore,
            timeSpentSeconds,
        };

        recordsRef.current.push(record);
        activeQuestionRef.current = null;
        questionScoreSamplesRef.current = [];

        return record;
    }, []);

    const getAllRecords = useCallback(() => recordsRef.current, []);

    return { ...state, update, startQuestion, endQuestion, getAllRecords };
}
