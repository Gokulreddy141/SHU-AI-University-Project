"use client";

interface QuestionListIndicatorProps {
    total: number;
    currentIdx: number;
    onSelect: (idx: number) => void;
    completedIndices?: number[];
}

export function QuestionListIndicator({ total, currentIdx, onSelect, completedIndices = [] }: QuestionListIndicatorProps) {
    const dots = Array.from({ length: total }, (_, i) => i);

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-2">Questions</h3>
            <div className="flex flex-wrap gap-2">
                {dots.map((idx) => {
                    const isActive = currentIdx === idx;
                    const isCompleted = completedIndices.includes(idx);

                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect(idx)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all shadow-sm
                                ${isActive
                                    ? "bg-indigo-600 text-white shadow-indigo-500/30 scale-105 border border-indigo-500"
                                    : isCompleted
                                        ? "bg-gray-800 text-indigo-400 border border-gray-700 hover:bg-gray-700"
                                        : "bg-gray-900 text-gray-500 border border-gray-800 hover:bg-gray-800"
                                }`}
                        >
                            {idx + 1}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
