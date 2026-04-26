"use client";

import { useExamSubmission } from "@/hooks/useExamSubmission";
import { IQuestion } from "@/types/question";
import { useEffect } from "react";

interface MCQRendererProps {
    question: IQuestion;
    sessionId: string;
}

export function MCQRenderer({ question, sessionId }: MCQRendererProps) {
    const { responses, saveAnswer, loadDrafts } = useExamSubmission(sessionId);

    useEffect(() => {
        loadDrafts();
    }, [loadDrafts]);

    const selectedOption = responses[question._id]?.selectedOptionIndex;

    const handleSelect = (index: number) => {
        saveAnswer(question._id, { selectedOptionIndex: index });
    };

    if (question.type !== "MCQ") return null;

    return (
        <div className="w-full max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8 shadow-xl">
            <div className="mb-6 flex justify-between items-start">
                <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
                    {question.text}
                </h2>
                <div className="text-sm font-medium px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-md whitespace-nowrap ml-4">
                    {question.points} Points
                </div>
            </div>

            <div className="space-y-3">
                {question.options?.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(idx)}
                            className={`w-full text-left p-4 rounded-lg flex items-center transition-all duration-200 border
                            ${isSelected
                                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                    : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 
                                ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-500"}`}
                            >
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-base">{option}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
