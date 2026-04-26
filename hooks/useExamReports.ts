"use client";
import { useState, useEffect, useCallback } from "react";

export interface ExamCandidate {
    sessionId: string;
    name: string;
    email: string;
    initials: string;
    status: string;
    integrityScore: number;
    totalViolations: number;
    startTime: string | null;
    endTime: string | null;
    createdAt: string;
}

export interface ExamReport {
    id: string;
    title: string;
    sessionCode: string;
    duration: number;
    status: string;
    proctoringMode: string;
    questionsCount: number;
    createdAt: string;
    summary: {
        total: number;
        completed: number;
        flagged: number;
        inProgress: number;
    };
    candidates: ExamCandidate[];
}

export function useExamReports() {
    const [exams, setExams] = useState<ExamReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchExams = useCallback(async () => {
        try {
            const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            const recruiterId = stored ? (JSON.parse(stored)._id || "") : "";
            if (!recruiterId) return;

            const res = await fetch(`/api/reports/exams?recruiterId=${recruiterId}`);
            if (!res.ok) throw new Error("Failed to load exam reports");
            const data = await res.json();
            setExams(data.exams || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    return { exams, loading, error, refetch: fetchExams };
}
