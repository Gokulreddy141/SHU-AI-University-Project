"use client";

import { useState, useCallback } from "react";
import { IExam, IExamStage } from "@/types/exam";

export const useExamStages = (examId: string) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStages = useCallback(async (stages: Partial<IExamStage>[]) => {
        if (!examId) return;

        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/exam/${examId}/stages`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ stages }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update stages");
            }

            return data.exam as IExam;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [examId]);

    const scheduleInterview = useCallback(async (stageId: string, candidateId: string, scheduledAt: string) => {
        if (!examId) return;

        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/session/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    examId,
                    stageId,
                    candidateId,
                    scheduledAt,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to schedule interview");
            }

            return data.session;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [examId]);

    return {
        updateStages,
        scheduleInterview,
        loading,
        error,
    };
};
