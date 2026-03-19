"use client";

import { useState, useCallback, useRef } from "react";
import { ICandidateResponse } from "@/types/question";

export const useExamSubmission = (sessionId: string) => {
    const [responses, setResponses] = useState<Record<string, Partial<ICandidateResponse>>>({});
    const [saving, setSaving] = useState(false);
    const saveQueue = useRef<Record<string, NodeJS.Timeout>>({});

    // Debounced real-time save to API + instant localStorage save
    const saveAnswer = useCallback(
        (questionId: string, answerData: Partial<ICandidateResponse>) => {
            if (!sessionId) return;

            // 1. Optimistic local state update
            setResponses((prev) => ({
                ...prev,
                [questionId]: { ...prev[questionId], ...answerData },
            }));

            // 2. Persist to localStorage immediately
            const localKey = `exam_draft_${sessionId}`;
            const existingDrafts = JSON.parse(localStorage.getItem(localKey) || "{}");
            existingDrafts[questionId] = { ...existingDrafts[questionId], ...answerData };
            localStorage.setItem(localKey, JSON.stringify(existingDrafts));

            // 3. Debounced API Call (1.5 seconds)
            if (saveQueue.current[questionId]) {
                clearTimeout(saveQueue.current[questionId]);
            }

            saveQueue.current[questionId] = setTimeout(async () => {
                try {
                    setSaving(true);

                    const res = await fetch(`/api/response`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sessionId,
                            questionId,
                            ...answerData,
                        }),
                    });

                    if (!res.ok) console.error("Failed to sync answer to server");
                } catch (err) {
                    console.error("Network error saving response", err);
                } finally {
                    setSaving(false);
                }
            }, 1500);
        },
        [sessionId]
    );

    // Initialize state from local storage on mount if network dropped previously
    const loadDrafts = useCallback(() => {
        const localKey = `exam_draft_${sessionId}`;
        const drafts = JSON.parse(localStorage.getItem(localKey) || "{}");
        setResponses(drafts);
    }, [sessionId]);

    return { responses, saveAnswer, saving, loadDrafts };
};
