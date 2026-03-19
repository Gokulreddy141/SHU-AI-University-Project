"use client";

import React from "react";

interface QuestionData {
    _id: string;
    text: string;
    type: "MCQ" | "CODING";
    points: number;
    options?: string[];
    correctOptionIndex?: number;
    expectedOutput?: string;
}

interface ResponseData {
    _id: string;
    questionId: QuestionData;
    selectedOptionIndex?: number;
    submittedCode?: string;
    selectedLanguage?: string;
}

interface CandidateResponseViewerProps {
    responses: ResponseData[];
}

export function CandidateResponseViewer({ responses }: CandidateResponseViewerProps) {
    if (!responses || responses.length === 0) {
        return <div className="text-gray-500 p-8 text-center bg-gray-900 rounded-xl border border-gray-800">No responses recorded yet.</div>;
    }

    return (
        <div className="space-y-6">
            {responses.map((resp, idx) => {
                const q = resp.questionId;
                if (!q) return null;

                const isMCQ = q.type === "MCQ";
                let isCorrect = false;
                let needsReview = false;

                if (isMCQ) {
                    isCorrect = resp.selectedOptionIndex === q.correctOptionIndex;
                } else {
                    if (q.expectedOutput && resp.submittedCode) {
                        try {
                            const regex = new RegExp(q.expectedOutput);
                            isCorrect = regex.test(resp.submittedCode);
                        } catch {
                            needsReview = true;
                        }
                    } else {
                        needsReview = true;
                    }
                }

                return (
                    <div key={resp._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                        {/* Question Header */}
                        <div className="bg-gray-950 px-6 py-4 flex items-start justify-between gap-4 border-b border-gray-800">
                            <div>
                                <h4 className="text-white font-medium">
                                    <span className="text-gray-500 mr-2">{idx + 1}.</span>
                                    {q.text}
                                </h4>
                                <div className="mt-2 text-xs font-semibold px-2 py-0.5 rounded bg-gray-800 text-gray-400 inline-block">
                                    {q.type} • {q.points} Points
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                {needsReview ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-700/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Manual Review
                                    </span>
                                ) : isCorrect ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Correct
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        Incorrect
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-6">
                            {isMCQ ? (
                                <div className="space-y-2">
                                    {q.options?.map((opt, optIdx) => {
                                        const isSelected = resp.selectedOptionIndex === optIdx;
                                        const isActualCorrect = q.correctOptionIndex === optIdx;

                                        let boxClass = "border-gray-800 bg-gray-950 text-gray-400 opacity-50";

                                        if (isSelected && isActualCorrect) {
                                            boxClass = "border-green-500 bg-green-900/20 text-green-300";
                                        } else if (isSelected && !isActualCorrect) {
                                            boxClass = "border-red-500 bg-red-900/20 text-red-300";
                                        } else if (!isSelected && isActualCorrect) {
                                            boxClass = "border-blue-500/50 bg-blue-900/10 text-blue-300 border-dashed";
                                        }

                                        return (
                                            <div key={optIdx} className={`p-3 rounded-lg border flex items-center gap-3 ${boxClass}`}>
                                                <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${isSelected ? "border-current bg-current" : "border-gray-600"}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />}
                                                </div>
                                                <span className="text-sm font-medium">{opt}</span>
                                                {isActualCorrect && !isSelected && (
                                                    <span className="ml-auto text-xs font-semibold px-2 py-1 rounded bg-blue-900/40 text-blue-400">Correct Answer</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate Code ({resp.selectedLanguage || "javascript"})</label>
                                        </div>
                                        <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                                            {resp.submittedCode || <span className="text-gray-600 italic">No code submitted</span>}
                                        </pre>
                                    </div>
                                    <div className="pt-4 border-t border-gray-800/50">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Expected Output Pattern (Regex)</label>
                                        <code className="px-3 py-1.5 rounded bg-blue-900/20 border border-blue-800/50 text-blue-300 text-sm font-mono block">
                                            {q.expectedOutput || <span className="opacity-50">No auto-grade pattern defined</span>}
                                        </code>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
