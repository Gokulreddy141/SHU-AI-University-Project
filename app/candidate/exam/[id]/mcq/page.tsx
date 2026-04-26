"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useExamEngine } from "@/hooks/useExamEngine";
import { MCQRenderer } from "@/components/features/MCQRenderer";
import { QuestionListIndicator } from "@/components/features/QuestionListIndicator";
import { useMouseBehaviorAnalysis } from "@/hooks/useMouseBehaviorAnalysis";
import { useFullScreenEnforcement } from "@/hooks/useFullScreenEnforcement";
import { useWindowFocusDetection } from "@/hooks/useWindowFocusDetection";
import FullScreenOverlay from "@/components/features/FullScreenOverlay";

export default function CandidateMCQPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const examId = params.id as string;
    const stageId = searchParams.get("stageId");
    const sessionId = searchParams.get("sessionId");

    const [candidateId, setCandidateId] = useState<string>("");

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            queueMicrotask(() => setCandidateId(parsed._id));
        }
    }, []);

    // Proctoring Hooks
    const { isFullScreen, violationCount: fsViolations, requestFullScreen } = useFullScreenEnforcement(
        sessionId || "",
        candidateId,
        !!sessionId && !!candidateId
    );

    useWindowFocusDetection(sessionId || "", candidateId, !!sessionId && !!candidateId);
    useMouseBehaviorAnalysis(sessionId || "", candidateId, !!sessionId && !!candidateId);

    const {
        questions,
        currentQuestion,
        currentIndex,
        isLast,
        responses,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
        finishExam,
        loading,
        timeLeftMs,
        isTabLocked
    } = useExamEngine(sessionId || "", examId, stageId || "", new Date().toISOString(), 60);

    if (!stageId || !sessionId) return <div className="text-red-500 p-8 text-center">Missing session identifiers.</div>;
    if (isTabLocked) return <div className="text-red-500 p-8 text-center mt-32 text-xl font-bold">Exam is active in another tab! Please close this tab.</div>;
    if (loading && !questions.length) return <div className="p-12 text-center text-gray-400 animate-pulse">Loading questions...</div>;
    if (!currentQuestion) return <div className="p-12 text-center text-gray-400 animate-pulse">Loading questions...</div>;

    // Check which questions are completed to highlight the sidebar map
    const completedIndices = questions
        .map((q, idx) => (responses[q._id]?.selectedOptionIndex !== undefined ? idx : -1))
        .filter((idx) => idx !== -1);

    const formatTime = (ms: number | null) => {
        if (ms === null) return "--:--";
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <>
            <FullScreenOverlay
                isVisible={!isFullScreen}
                violationCount={fsViolations}
                onRequestFullScreen={requestFullScreen}
            />
            <div className={`flex h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-950 text-white ${!isFullScreen ? 'blur-sm pointer-events-none' : ''}`}>
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-gray-800 bg-gray-900 p-6 overflow-y-auto">
                    <QuestionListIndicator
                        total={questions.length}
                        currentIdx={currentIndex}
                        onSelect={jumpToQuestion}
                        completedIndices={completedIndices}
                    />

                    <div className="mt-12 flex flex-col items-center">
                        <div className="mb-4 text-2xl font-mono text-white tracking-widest bg-gray-950 px-4 py-2 border border-gray-800 shadow-inner rounded overflow-hidden">
                            {formatTime(timeLeftMs)}
                        </div>
                        <button onClick={finishExam} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold rounded-lg shadow-md transition">
                            Finish Stage
                        </button>
                        <p className="text-xs text-center text-gray-500 mt-3 px-2">
                            Answers auto-save.
                        </p>
                    </div>
                </div>

                {/* Main Stage Panel */}
                <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
                    <div className="flex-1 flex flex-col justify-center">
                        {currentQuestion.type === "MCQ" ? (
                            <MCQRenderer question={currentQuestion} sessionId={sessionId} />
                        ) : (
                            <div className="text-center p-8 border border-gray-800 rounded bg-gray-900 text-gray-400 max-w-lg mx-auto">
                                Unsupported question type &apos;{currentQuestion.type}&apos; rendering in MCQ view.
                            </div>
                        )}
                    </div>

                    {/* Bottom Nav / Prev Next */}
                    <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between max-w-3xl mx-auto w-full">
                        <button
                            onClick={prevQuestion}
                            disabled={currentIndex === 0}
                            className="px-6 py-2 rounded-lg bg-gray-800 text-gray-300 font-medium disabled:opacity-30 hover:bg-gray-700 transition"
                        >
                            Previous
                        </button>
                        <button
                            onClick={nextQuestion}
                            className={`px-8 py-2 rounded-lg font-bold text-white transition shadow-md
                            ${isLast ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/30" : "bg-gray-800 hover:bg-gray-700 text-gray-200"}`}
                        >
                            {isLast ? "Review Answers" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
