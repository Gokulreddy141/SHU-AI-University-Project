import React from "react";
import { Question, CandidateResponseData } from "@/hooks/useCandidateQuiz";

interface QuizTrackerProps {
    questions: Question[];
    responses: Record<string, CandidateResponseData>;
    currentIndex: number;
    onSelect: (index: number) => void;
}

export default function QuizTracker({
    questions,
    responses,
    currentIndex,
    onSelect
}: QuizTrackerProps) {
    if (!questions || questions.length === 0) return null;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex flex-col h-full">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">
                Question Navigator
            </h3>

            {/* Grid of question numbers */}
            <div className="grid grid-cols-5 gap-2 overflow-y-auto mb-4 custom-scrollbar">
                {questions.map((q, idx) => {
                    const response = responses[q._id];
                    const isActive = idx === currentIndex;

                    let bgClass = "bg-slate-700/50 hover:bg-slate-600 text-slate-300"; // Unanswered
                    if (response?.isMarkedForReview) {
                        bgClass = "bg-orange-500/80 hover:bg-orange-500 text-white"; // Marked
                    } else if (
                        response?.selectedOptionIndex !== undefined ||
                        (response?.submittedCode && response.submittedCode.trim() !== "")
                    ) {
                        bgClass = "bg-green-600/80 hover:bg-green-600 text-white"; // Answered
                    }

                    const activeBorder = isActive ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "border border-slate-600/50";

                    return (
                        <button
                            key={q._id}
                            onClick={() => onSelect(idx)}
                            className={`w-full aspect-square rounded-lg flex items-center justify-center font-mono text-sm font-bold transition-all ${bgClass} ${activeBorder}`}
                            title={q.text.substring(0, 50) + "..."}
                        >
                            {idx + 1}
                        </button>
                    );
                })}
            </div>

            {/* Legend Map */}
            <div className="mt-auto border-t border-slate-700 pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3 h-3 rounded bg-green-600/80"></div>
                    <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3 h-3 rounded bg-orange-500/80"></div>
                    <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-3 h-3 rounded bg-slate-700/50"></div>
                    <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <div className="w-3 h-3 rounded border-2 border-white ring-offset-1 ring-offset-slate-900 bg-transparent"></div>
                    <span>Current</span>
                </div>
            </div>
        </div>
    );
}
