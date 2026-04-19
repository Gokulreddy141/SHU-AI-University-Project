"use client";

import { useState, useEffect, useCallback } from "react";

function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const stored = localStorage.getItem("user");
        if (!stored) return {};
        const user = JSON.parse(stored);
        return {
            "x-user-id": user._id || "",
            "x-user-role": user.role || "",
        };
    } catch {
        return {};
    }
}

export interface Question {
    _id: string;
    type: "MCQ" | "CODING";
    text: string;
    points: number;
    options?: string[];
    allowedLanguages?: string[];
    starterCode?: string;
}

export interface CandidateResponseData {
    _id: string;
    questionId: string | { _id: string; type: string };
    selectedOptionIndex?: number;
    submittedCode?: string;
    selectedLanguage?: string;
    isMarkedForReview: boolean;
}

export const useCandidateQuiz = (examId: string, sessionId: string, isExamActive: boolean) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [responses, setResponses] = useState<Record<string, CandidateResponseData>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial load: Fetch questions and previous responses
    useEffect(() => {
        if (!examId || !sessionId) return;

        const loadQuizData = async () => {
            try {
                setLoading(true);
                setError(null);

                const authHeaders = getAuthHeaders();

                // Fetch Questions
                const qRes = await fetch(`/api/exam/${examId}/questions?sessionId=${sessionId}`, {
                    headers: authHeaders,
                });
                if (!qRes.ok) throw new Error("Failed to load questions");
                const qData = await qRes.json();

                // Fetch existing responses
                const rRes = await fetch(`/api/session/${sessionId}/responses`, {
                    headers: authHeaders,
                });
                if (!rRes.ok) throw new Error("Failed to load previous answers");
                const rData = await rRes.json();

                setQuestions(qData.items || []);

                // Map responses by questionId for fast access
                const responseMap: Record<string, CandidateResponseData> = {};
                rData.items.forEach((resp: CandidateResponseData) => {
                    const qId = typeof resp.questionId === "object" ? resp.questionId._id : resp.questionId;
                    responseMap[qId] = resp;
                });
                setResponses(responseMap);

            } catch (err: unknown) {
                const e = err as Error;
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        loadQuizData();
    }, [examId, sessionId]);

    // Save a response
    const saveResponse = useCallback(
        async (
            questionId: string,
            updates: {
                selectedOptionIndex?: number;
                submittedCode?: string;
                selectedLanguage?: string;
                isMarkedForReview?: boolean;
            }
        ) => {
            if (!isExamActive) return;

            // Optimistic UI Update
            setResponses((prev) => {
                const existing = prev[questionId] || {
                    _id: "temp",
                    questionId,
                    isMarkedForReview: false
                };
                return {
                    ...prev,
                    [questionId]: { ...existing, ...updates }
                };
            });

            // Network Sync
            setIsSyncing(true);
            try {
                // Must ensure all current fields are sent to override, or fetch existing to merge
                const currentData = responses[questionId] || {};
                const payload = {
                    sessionId,
                    questionId,
                    selectedOptionIndex: updates.selectedOptionIndex !== undefined ? updates.selectedOptionIndex : currentData.selectedOptionIndex,
                    submittedCode: updates.submittedCode !== undefined ? updates.submittedCode : currentData.submittedCode,
                    selectedLanguage: updates.selectedLanguage !== undefined ? updates.selectedLanguage : currentData.selectedLanguage,
                    isMarkedForReview: updates.isMarkedForReview !== undefined ? updates.isMarkedForReview : (currentData.isMarkedForReview || false),
                };

                const res = await fetch("/api/response", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    throw new Error("Failed to sync answer");
                }
            } catch (err) {
                console.error("Auto-save failed:", err);
            } finally {
                setIsSyncing(false);
            }
        },
        [sessionId, responses, isExamActive]
    );

    const toggleMarkForReview = useCallback((questionId: string) => {
        const current = responses[questionId];
        saveResponse(questionId, { isMarkedForReview: !(current?.isMarkedForReview) });
    }, [responses, saveResponse]);

    const goToNext = useCallback(() => {
        if (currentIndex < questions.length - 1) setCurrentIndex(p => p + 1);
    }, [currentIndex, questions.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) setCurrentIndex(p => p - 1);
    }, [currentIndex]);

    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < questions.length) setCurrentIndex(index);
    }, [questions.length]);

    return {
        questions,
        responses,
        currentIndex,
        currentQuestion: questions[currentIndex],
        loading,
        error,
        isSyncing,
        saveResponse,
        toggleMarkForReview,
        goToNext,
        goToPrev,
        goToQuestion
    };
};
