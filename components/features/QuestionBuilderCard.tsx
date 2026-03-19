"use client";

import { useState } from "react";
import { IQuestion } from "@/types/question";

interface QuestionBuilderCardProps {
    initialData?: IQuestion;
    onSave: (data: Partial<IQuestion>) => Promise<void>;
    onCancel?: () => void;
    order: number;
}

export function QuestionBuilderCard({ initialData, onSave, onCancel, order }: QuestionBuilderCardProps) {
    const [type, setType] = useState<"MCQ" | "CODING">(initialData?.type || "MCQ");
    const [text, setText] = useState(initialData?.text || "");
    const [points, setPoints] = useState(initialData?.points || 1);

    // MCQ specific
    const [options, setOptions] = useState<string[]>(initialData?.options || ["", ""]);
    const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(initialData?.correctOptionIndex ?? 0);

    // Coding specific
    const [allowedLanguages, setAllowedLanguages] = useState<string[]>(initialData?.allowedLanguages || ["javascript"]);
    const [starterCode, setStarterCode] = useState(initialData?.starterCode || "");
    const [expectedOutput, setExpectedOutput] = useState(initialData?.expectedOutput || "");

    const [isSaving, setIsSaving] = useState(false);

    const handleOptionsChange = (index: number, value: string) => {
        const newOpts = [...options];
        newOpts[index] = value;
        setOptions(newOpts);
    };

    const addOption = () => setOptions([...options, ""]);
    const removeOption = (idx: number) => {
        if (options.length <= 2) return;
        const newOpts = options.filter((_, i) => i !== idx);
        setOptions(newOpts);
        if (correctOptionIndex >= idx && correctOptionIndex > 0) {
            setCorrectOptionIndex(correctOptionIndex - 1);
        }
    };

    const handleSave = async () => {
        if (!text.trim()) return;

        // Validation
        if (type === "MCQ") {
            const validOptions = options.filter(opt => opt.trim().length > 0);
            if (validOptions.length < 2) {
                alert("Please provide at least 2 options for MCQ");
                return;
            }
        } else if (type === "CODING") {
            if (!expectedOutput.trim()) {
                alert("Please provide an expected output for code validation");
                return;
            }
        }

        setIsSaving(true);
        const payload: Partial<IQuestion> = {
            _id: initialData?._id,
            type,
            text,
            points,
            order: initialData?.order ?? order,
            ...(type === "MCQ" ? { options, correctOptionIndex } : {}),
            ...(type === "CODING" ? { allowedLanguages, starterCode, expectedOutput } : {}),
        };
        try {
            await onSave(payload);
        } catch (err) {
            console.error("Failed to save question", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl p-6 shadow-2xl w-full max-w-4xl mx-auto mb-6 transition-all hover:border-gray-700">
            {/* Header / Type Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-1 p-1 bg-[#0f0f0f] rounded-xl border border-[#3b3b3b]">
                    <button
                        onClick={() => setType("MCQ")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${type === "MCQ" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-white"}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">list_alt</span>
                        Multiple Choice
                    </button>
                    <button
                        onClick={() => setType("CODING")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${type === "CODING" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-white"}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">code</span>
                        Coding Challenge
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-[#0f0f0f] px-4 py-2 rounded-xl border border-[#3b3b3b]">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points</label>
                    <input
                        type="number"
                        min="1"
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value) || 1)}
                        className="bg-transparent border-none text-white text-lg font-bold w-12 focus:outline-none focus:ring-0 text-center"
                    />
                </div>
            </div>

            {/* Prompt Text Input */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question Prompt</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={type === "MCQ" ? "Enter the question text here..." : "Enter the coding task instructions..."}
                    className="w-full bg-[#0f0f0f] border border-[#3b3b3b] text-white rounded-xl p-4 min-h-[120px] text-sm focus:border-primary transition-colors outline-none resize-y placeholder-gray-600 shadow-inner"
                />
            </div>

            {/* Dynamic Type Fields */}
            {type === "MCQ" ? (
                <div className="space-y-4 bg-black/20 p-6 rounded-2xl border border-[#3b3b3b]/50">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Answer Choices</label>
                    <div className="space-y-3">
                        {options.map((opt, idx) => (
                            <div key={idx} className="group flex items-center gap-4 transition-all animate-in slide-in-from-left-1 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="relative">
                                    <input
                                        type="radio"
                                        name={`correct-${order}`}
                                        checked={correctOptionIndex === idx}
                                        onChange={() => setCorrectOptionIndex(idx)}
                                        className="w-5 h-5 accent-primary cursor-pointer"
                                        title="Mark as correct answer"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionsChange(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}...`}
                                    className={`flex-1 bg-[#0f0f0f] border rounded-xl p-3 text-sm focus:border-primary transition-all outline-none ${correctOptionIndex === idx ? 'border-primary/50 ring-1 ring-primary/20' : 'border-[#3b3b3b]'}`}
                                />
                                <button
                                    onClick={() => removeOption(idx)}
                                    disabled={options.length <= 2}
                                    className="p-2.5 text-slate-600 hover:text-red-400 disabled:opacity-0 transition-all rounded-lg hover:bg-red-500/10"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addOption}
                        className="mt-4 text-xs font-bold text-primary hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-primary/20 transition-all border border-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        ADD OPTION
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-black/20 p-6 rounded-2xl border border-[#3b3b3b]/50">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Allowed Languages</label>
                            <input
                                type="text"
                                value={allowedLanguages.join(", ")}
                                onChange={(e) => setAllowedLanguages(e.target.value.split(",").map(l => l.trim()).filter(l => l !== ""))}
                                placeholder="javascript, python, cpp..."
                                className="w-full bg-[#0f0f0f] border border-[#3b3b3b] text-white rounded-xl p-3 text-sm focus:border-primary transition-colors outline-none"
                            />
                            <p className="text-[10px] text-slate-600 mt-2">Comma separated languages (e.g. javascript, python)</p>
                        </div>
                        <div className="bg-black/20 p-6 rounded-2xl border border-[#3b3b3b]/50">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Expected Output</label>
                            <input
                                type="text"
                                value={expectedOutput}
                                onChange={(e) => setExpectedOutput(e.target.value)}
                                placeholder="Exact output text or value..."
                                className="w-full bg-[#0f0f0f] border border-[#3b3b3b] text-white rounded-xl p-3 text-sm focus:border-primary transition-colors outline-none"
                            />
                            <p className="text-[10px] text-slate-600 mt-2">Required for auto-grading the challenge.</p>
                        </div>
                    </div>

                    <div className="bg-black/20 p-6 rounded-2xl border border-[#3b3b3b]/50">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Starter Code (Optional)</label>
                        <div className="relative group">
                            <textarea
                                value={starterCode}
                                onChange={(e) => setStarterCode(e.target.value)}
                                placeholder="function solution(n) {\n  // Your code here\n}"
                                className="w-full bg-[#0f0f0f] border border-[#3b3b3b] text-white rounded-xl p-4 min-h-[160px] font-mono text-sm focus:border-primary transition-colors outline-none resize-y shadow-inner scrollbar-thin scrollbar-thumb-gray-800"
                                spellCheck="false"
                            />
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-600 px-2 py-1 bg-black/50 rounded-lg pointer-events-none group-hover:text-primary transition-colors">
                                CODE_EDITOR
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-[#3b3b3b] flex justify-end gap-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl border border-[#3b3b3b] text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={isSaving || !text.trim()}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isSaving ? "sync" : (initialData ? "save" : "add")}
                    </span>
                    {isSaving ? "Saving..." : (initialData ? "Update Question" : "Create Question")}
                </button>
            </div>
        </div>
    );
}
