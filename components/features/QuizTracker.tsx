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
        <div className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl p-4 flex flex-col h-full">
            <h3 className="text-sm font-semibold text-[#a1a1a1] uppercase tracking-widest mb-4">
                Question Navigator
            </h3>

            {/* Grid of question numbers */}
            <div className="grid grid-cols-5 gap-2 overflow-y-auto mb-4 custom-scrollbar">
                {questions.map((q, idx) => {
                    const response = responses[q._id];
                    const isActive = idx === currentIndex;

                    let bgClass = "bg-[#262626] hover:bg-[#2e2e2e] text-[#a1a1a1]"; // Unanswered
                    if (response?.isMarkedForReview) {
                        bgClass = "bg-primary/80 hover:bg-primary text-white"; // Marked
                    } else if (
                        response?.selectedOptionIndex !== undefined ||
                        (response?.submittedCode && response.submittedCode.trim() !== "")
                    ) {
                        bgClass = "bg-green-600/80 hover:bg-green-600 text-white"; // Answered
                    }

                    const activeBorder = isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-[#0f0f0f]" : "border border-[#3b3b3b]";

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
            <div className="mt-auto border-t border-[#3b3b3b] pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#a1a1a1]">
                    <div className="w-3 h-3 rounded bg-green-600/80"></div>
                    <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#a1a1a1]">
                    <div className="w-3 h-3 rounded bg-primary/80"></div>
                    <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#a1a1a1]">
                    <div className="w-3 h-3 rounded bg-[#262626] border border-[#3b3b3b]"></div>
                    <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#a1a1a1] mt-1">
                    <div className="w-3 h-3 rounded border-2 border-primary bg-transparent"></div>
                    <span>Current</span>
                </div>
            </div>
        </div>
    );
}
