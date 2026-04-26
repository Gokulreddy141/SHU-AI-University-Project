"use client";

import { useState, useCallback } from "react";
import { IQuestion } from "@/types/question";

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

export const useQuestions = (examId: string, stageId?: string) => {
    const [questions, setQuestions] = useState<IQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuestions = useCallback(async (sessionId?: string) => {
        if (!examId) return;

        try {
            setLoading(true);
            setError(null);

            const url = new URL(window.location.origin + `/api/exam/${examId}/questions`);
            if (stageId) url.searchParams.append("stageId", stageId);
            if (sessionId) url.searchParams.append("sessionId", sessionId);

            const res = await fetch(url.toString(), {
                headers: { ...getAuthHeaders() },
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch questions");
            }

            setQuestions(data.items);
        } catch (err: Error | unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [examId, stageId]);

    const saveQuestion = useCallback(async (payload: Partial<IQuestion>) => {
        try {
            setLoading(true);
            setError(null);

            const isNew = !payload._id;
            const url = isNew ? `/api/question` : `/api/question/${payload._id}`;
            const method = isNew ? "POST" : "PATCH";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ examId, stageId, ...payload }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to save question");
            }

            setQuestions((prev) => {
                if (isNew) return [...prev, data.question].sort((a, b) => a.order - b.order);
                return prev.map((q) => (q._id === data.question._id ? data.question : q));
            });

            return data.question;
        } catch (err: Error | unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
            return null;
        } finally {
            setLoading(false);
        }
    }, [examId, stageId]);

    return { questions, loading, error, fetchQuestions, saveQuestion };
};
