import React, { useState, useEffect } from "react";
import { Question, CandidateResponseData } from "@/hooks/useCandidateQuiz";
import Editor from "@monaco-editor/react";

interface QuestionViewProps {
    question: Question;
    response: CandidateResponseData;
    onAnswerChange: (updates: Partial<CandidateResponseData>) => void;
    onToggleReview: () => void;
}

export default function QuestionView({
    question,
    response,
    onAnswerChange,
    onToggleReview
}: QuestionViewProps) {
    // Local state for the code editor to avoid re-renders while typing
    const [localCode, setLocalCode] = useState(response?.submittedCode || question.starterCode || "");

    // Update local state when switching questions
    useEffect(() => {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
            setLocalCode(response?.submittedCode || question.starterCode || "");
        }, 0);
    }, [question._id, response?.submittedCode, question.starterCode]);

    if (!question) return null;

    const handleOptionSelect = (index: number) => {
        onAnswerChange({ selectedOptionIndex: index });
    };

    const handleCodeChange = (value: string | undefined) => {
        const val = value || "";
        setLocalCode(val);
        // We debounce this via onBlur, but we can also trigger onAnswerChange here 
        // if the parent hook has debounce logic. Assuming the parent handles the save payload:
        onAnswerChange({ submittedCode: val, selectedLanguage: response?.selectedLanguage || question.allowedLanguages?.[0] || 'javascript' });
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onAnswerChange({ selectedLanguage: e.target.value });
    };

    return (
        <div className="flex flex-col h-full bg-slate-800/50 border border-slate-700 rounded-2xl p-6 overflow-hidden">
            {/* Header: Question Type and Points */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-slate-700 text-slate-300 rounded-lg">
                        {question.type === "MCQ" ? "Multiple Choice" : "Programming"}
                    </span>
                    <span className="text-sm text-slate-400">
                        {question.points} {question.points === 1 ? "point" : "points"}
                    </span>
                </div>
                <div>
                    <button
                        onClick={onToggleReview}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${response?.isMarkedForReview
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                                : "bg-slate-700/50 text-slate-400 border border-slate-600 hover:text-white"
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        {response?.isMarkedForReview ? "Unmark Review" : "Mark for Review"}
                    </button>
                </div>
            </div>

            {/* Question Text */}
            <div className="text-lg text-white mb-8 whitespace-pre-wrap">
                {question.text}
            </div>

            {/* Answer Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* MCQ Options */}
                {question.type === "MCQ" && question.options && (
                    <div className="space-y-3">
                        {question.options.map((opt, idx) => {
                            const isSelected = response?.selectedOptionIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(idx)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                            ? "border-primary bg-primary/10 text-white"
                                            : "border-slate-600 bg-slate-700/30 text-slate-300 hover:bg-slate-700/70 hover:text-white"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-primary" : "border-slate-500"
                                            }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                                        </div>
                                        <span>{opt}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* CODING Editor */}
                {question.type === "CODING" && (
                    <div className="h-full flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <label className="text-sm font-semibold text-slate-400">Your Solution</label>

                            {question.allowedLanguages && question.allowedLanguages.length > 0 && (
                                <select
                                    className="bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-1 outline-none focus:border-primary"
                                    value={response?.selectedLanguage || question.allowedLanguages[0]}
                                    onChange={handleLanguageChange}
                                >
                                    {question.allowedLanguages.map(lang => (
                                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex-1 border border-slate-700 rounded-xl overflow-hidden bg-[#1e1e1e]">
                            <Editor
                                height="100%"
                                language={response?.selectedLanguage || question.allowedLanguages?.[0] || "javascript"}
                                theme="vs-dark"
                                value={localCode}
                                onChange={handleCodeChange}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineHeight: 24,
                                    padding: { top: 16, bottom: 16 },
                                    scrollBeyondLastLine: false,
                                    smoothScrolling: true,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
