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
    // Local state for the code editor to avoid re-renders while typing.
    // Initialised from the persisted response (if any) or the starter code.
    const [localCode, setLocalCode] = useState(
        response?.submittedCode || question.starterCode || ""
    );

    // Reset the editor content whenever the candidate navigates to a different
    // question. We intentionally only depend on question._id so that typing
    // (which updates response.submittedCode via optimistic state) does NOT
    // re-trigger this effect and overwrite what the candidate is currently typing.
    useEffect(() => {
        setLocalCode(response?.submittedCode || question.starterCode || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question._id]);

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
        <div className="flex flex-col h-full bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl p-6 overflow-hidden">
            {/* Header: Question Type and Points */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-[#262626] text-[#a1a1a1] border border-[#3b3b3b] rounded-lg">
                        {question.type === "MCQ" ? "Multiple Choice" : "Programming"}
                    </span>
                    <span className="text-sm text-[#a1a1a1]">
                        {question.points} {question.points === 1 ? "point" : "points"}
                    </span>
                </div>
                <button
                    onClick={onToggleReview}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        response?.isMarkedForReview
                            ? "bg-primary/15 text-primary border border-primary/40"
                            : "bg-[#262626] text-[#a1a1a1] border border-[#3b3b3b] hover:text-white hover:border-[#555]"
                    }`}
                >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {response?.isMarkedForReview ? "Unmark Review" : "Mark for Review"}
                </button>
            </div>

            {/* Question Text */}
            <div className="text-[#e8e8e8] text-lg leading-relaxed mb-8 whitespace-pre-wrap font-medium">
                {question.text}
            </div>

            {/* Answer Area */}
            <div className="flex-1 overflow-y-auto">

                {/* MCQ Options */}
                {question.type === "MCQ" && question.options && (
                    <div className="space-y-3">
                        {question.options.map((opt, idx) => {
                            const isSelected = response?.selectedOptionIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(idx)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                                        isSelected
                                            ? "border-primary bg-primary/10 text-white shadow-[0_0_0_1px_rgba(230,126,92,0.3)]"
                                            : "border-[#3b3b3b] bg-[#262626] text-[#a1a1a1] hover:bg-[#2e2e2e] hover:text-white hover:border-[#555]"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected ? "border-primary" : "border-[#555]"
                                        }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                                        </div>
                                        <span className="text-sm">{opt}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* CODING Editor */}
                {question.type === "CODING" && (
                    <div className="h-full flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <label className="text-xs font-semibold text-[#a1a1a1] uppercase tracking-widest">Your Solution</label>
                            {question.allowedLanguages && question.allowedLanguages.length > 0 && (
                                <select
                                    className="bg-[#0f0f0f] border border-[#3b3b3b] rounded-lg text-sm text-white px-3 py-1.5 outline-none focus:border-primary transition-colors"
                                    value={response?.selectedLanguage || question.allowedLanguages[0]}
                                    onChange={handleLanguageChange}
                                >
                                    {question.allowedLanguages.map(lang => (
                                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="flex-1 border border-[#3b3b3b] rounded-xl overflow-hidden">
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
