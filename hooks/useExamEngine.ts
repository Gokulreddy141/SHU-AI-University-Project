"use client";

import { useState, useEffect, useCallback } from "react";
import { IQuestion } from "@/types/question";
import { useExamSubmission } from "./useExamSubmission";
import { useRouter } from "next/navigation";

export const useExamEngine = (
    sessionId: string,
    examId: string,
    stageId: string,
    startTime: string | undefined, // ISO string from DB
    duration: number // minutes from DB
) => {
    const router = useRouter();
    const [questions, setQuestions] = useState<IQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTabLocked, setIsTabLocked] = useState(false);

    // Reuse existing submission logic
    const { responses, saveAnswer, loadDrafts, saving } = useExamSubmission(sessionId);

    // 1. Tab Lock - Prevent multiple tabs (Cheating Vector: Simultaenous Logins)
    useEffect(() => {
        if (!sessionId) return;
        const channel = new BroadcastChannel(`exam_lock_${sessionId}`);

        // ping others "I am here"
        channel.postMessage({ type: "EXAM_OPENED", time: Date.now() });

        channel.onmessage = (event) => {
            if (event.data.type === "EXAM_OPENED") {
                // Another tab just opened this exam
                setIsTabLocked(true);
            }
        };

        return () => {
            channel.close();
        };
    }, [sessionId]);

    // 2. Fetch Questions (masked by API)
    const fetchQuestions = useCallback(async () => {
        try {
            const url = new URL(window.location.origin + `/api/exam/${examId}/questions`);
            url.searchParams.append("stageId", stageId);
            url.searchParams.append("sessionId", sessionId);

            const res = await fetch(url.toString());
            const data = await res.json();

            if (data.success) {
                setQuestions(data.items);
                // Also hydrate from localStorage if we crashed
                loadDrafts();

                // Restore last known question index
                const savedIndex = localStorage.getItem(`exam_idx_${sessionId}`);
                if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
            }
        } catch (err) {
            console.error("Failed to fetch questions", err);
        } finally {
            setLoading(false);
        }
    }, [examId, stageId, sessionId, loadDrafts]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    // Define finishExam with useCallback before using it in useEffect
    const finishExam = useCallback(async () => {
        // Typically call PATCH /api/session/[id] { status: 'completed' }
        try {
            await fetch(`/api/session/${sessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed" })
            });
            localStorage.removeItem(`exam_idx_${sessionId}`);
            router.push("/candidate/dashboard");
        } catch (e) {
            console.error("Failed to finish exam", e);
        }
    }, [sessionId, router]);

    // 3. Absolute Time Calculation (Cheating Vector: Local Clock Manipulation)
    useEffect(() => {
        if (!startTime || duration <= 0) return;

        const startMs = new Date(startTime).getTime();
        const endMs = startMs + duration * 60 * 1000;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = endMs - now;

            if (remaining <= 0) {
                setTimeLeftMs(0);
                clearInterval(interval);
                // Auto-submit and flush
                finishExam();
            } else {
                setTimeLeftMs(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, duration, finishExam]);

    // 4. Navigation
    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            localStorage.setItem(`exam_idx_${sessionId}`, nextIdx.toString());
        }
    };

    const prevQuestion = () => {
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            localStorage.setItem(`exam_idx_${sessionId}`, prevIdx.toString());
        }
    };

    const jumpToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
            localStorage.setItem(`exam_idx_${sessionId}`, index.toString());
        }
    };

    return {
        questions,
        currentQuestion: questions[currentIndex],
        currentIndex,
        isLast: currentIndex === questions.length - 1,
        isFirst: currentIndex === 0,
        timeLeftMs,
        isTabLocked,
        responses,
        saveAnswer,
        saving,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
        finishExam,
        loading
    };
};
