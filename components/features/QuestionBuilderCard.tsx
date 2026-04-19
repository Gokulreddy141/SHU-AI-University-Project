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
    const isExisting = !!initialData;
    const [collapsed, setCollapsed] = useState(isExisting); // existing cards start collapsed
    const [type, setType] = useState<"MCQ" | "CODING">(initialData?.type || "MCQ");
    const [text, setText] = useState(initialData?.text || "");
    const [points, setPoints] = useState(initialData?.points || 1);

    const [options, setOptions] = useState<string[]>(initialData?.options || ["", ""]);
    const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(initialData?.correctOptionIndex ?? 0);

    const [allowedLanguages, setAllowedLanguages] = useState<string[]>(initialData?.allowedLanguages || ["javascript"]);
    const [starterCode, setStarterCode] = useState(initialData?.starterCode || "");
    const [expectedOutput, setExpectedOutput] = useState(initialData?.expectedOutput || "");

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

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

        if (type === "MCQ") {
            const validOptions = options.filter(opt => opt.trim().length > 0);
            if (validOptions.length < 2) {
                alert("Please provide at least 2 answer options.");
                return;
            }
        } else {
            if (!expectedOutput.trim()) {
                alert("Please provide the expected output for auto-grading.");
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
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            if (isExisting) setCollapsed(true);
        } catch (err) {
            console.error("Failed to save question", err);
        } finally {
            setIsSaving(false);
        }
    };

    const hasUnsavedChanges = isExisting && (
        text !== initialData.text ||
        points !== initialData.points ||
        type !== initialData.type
    );

    // ── Collapsed view (existing questions) ──
    if (isExisting && collapsed) {
        return (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all group">
                <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setCollapsed(false)}
                >
                    {/* Type badge */}
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        type === "MCQ"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                        {type === "MCQ" ? "MCQ" : "Code"}
                    </span>

                    {/* Question text preview */}
                    <p className="flex-1 text-sm text-white truncate">{text || "Untitled question"}</p>

                    {/* Points */}
                    <span className="shrink-0 text-xs font-mono text-slate-500 bg-[#1a1a1a] px-2 py-0.5 rounded-lg border border-[#2a2a2a]">
                        {points} pt{points !== 1 ? "s" : ""}
                    </span>

                    {/* Unsaved dot */}
                    {hasUnsavedChanges && (
                        <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" title="Unsaved changes" />
                    )}

                    {/* Expand icon */}
                    <span className="material-symbols-outlined text-[20px] text-slate-600 group-hover:text-white transition-colors shrink-0">
                        expand_more
                    </span>
                </div>
            </div>
        );
    }

    // ── Expanded / New question view ──
    return (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#0f0f0f] border-b border-[#1f1f1f]">
                <div className="flex items-center gap-3">
                    {/* Type switcher */}
                    <div className="flex gap-1 p-0.5 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                        <button
                            onClick={() => setType("MCQ")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${type === "MCQ" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-white"}`}
                        >
                            <span className="material-symbols-outlined text-[14px]">list_alt</span>
                            Multiple Choice
                        </button>
                        <button
                            onClick={() => setType("CODING")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${type === "CODING" ? "bg-amber-600 text-white shadow" : "text-slate-500 hover:text-white"}`}
                        >
                            <span className="material-symbols-outlined text-[14px]">code</span>
                            Coding
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Points */}
                    <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
                        <span className="material-symbols-outlined text-[14px] text-slate-500">grade</span>
                        <input
                            type="number"
                            min="1"
                            value={points}
                            onChange={(e) => setPoints(Number(e.target.value) || 1)}
                            className="bg-transparent border-none text-white text-sm font-bold w-10 focus:outline-none text-center"
                        />
                        <span className="text-xs text-slate-500">pts</span>
                    </div>

                    {/* Collapse (existing only) */}
                    {isExisting && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            title="Collapse"
                        >
                            <span className="material-symbols-outlined text-[18px]">expand_less</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
                {/* Question text */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {type === "MCQ" ? "Question Prompt" : "Task Description"}
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={type === "MCQ" ? "Enter the question here..." : "Describe the coding task..."}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl p-4 min-h-[100px] text-sm focus:border-primary/50 transition-colors outline-none resize-y placeholder-gray-700"
                    />
                </div>

                {/* MCQ options */}
                {type === "MCQ" && (
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Answer Choices <span className="text-slate-600 normal-case font-normal">(select the correct one)</span>
                        </label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name={`correct-${order}-${initialData?._id}`}
                                    checked={correctOptionIndex === idx}
                                    onChange={() => setCorrectOptionIndex(idx)}
                                    className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                                    title="Mark as correct"
                                />
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionsChange(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}`}
                                    className={`flex-1 bg-[#0a0a0a] border rounded-xl p-3 text-sm text-white focus:outline-none transition-all outline-none ${
                                        correctOptionIndex === idx
                                            ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
                                            : "border-[#2a2a2a] focus:border-[#3a3a3a]"
                                    }`}
                                />
                                {correctOptionIndex === idx && (
                                    <span className="shrink-0 text-[10px] font-bold text-primary-light bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                        Correct
                                    </span>
                                )}
                                <button
                                    onClick={() => removeOption(idx)}
                                    disabled={options.length <= 2}
                                    className="p-1.5 text-slate-600 hover:text-red-400 disabled:opacity-0 transition-all rounded-lg hover:bg-red-500/10 shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addOption}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all border border-dashed border-[#2a2a2a] hover:border-[#3a3a3a] w-full justify-center"
                        >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Add Option
                        </button>
                    </div>
                )}

                {/* Coding fields */}
                {type === "CODING" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Allowed Languages
                                </label>
                                <input
                                    type="text"
                                    value={allowedLanguages.join(", ")}
                                    onChange={(e) => setAllowedLanguages(e.target.value.split(",").map(l => l.trim()).filter(l => l !== ""))}
                                    placeholder="javascript, python, java..."
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl p-3 text-sm focus:border-primary/50 outline-none transition-colors"
                                />
                                <p className="text-[10px] text-slate-600 mt-1">Comma-separated</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Expected Output <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={expectedOutput}
                                    onChange={(e) => setExpectedOutput(e.target.value)}
                                    placeholder="e.g. Hello World or a regex pattern"
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl p-3 text-sm focus:border-primary/50 outline-none transition-colors"
                                />
                                <p className="text-[10px] text-slate-600 mt-1">Used for auto-grading</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Starter Code <span className="text-slate-600 font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                value={starterCode}
                                onChange={(e) => setStarterCode(e.target.value)}
                                placeholder={"function solution(input) {\n  // write your code here\n}"}
                                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl p-4 min-h-[120px] font-mono text-sm focus:border-primary/50 outline-none resize-y transition-colors"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-[#0f0f0f] border-t border-[#1f1f1f]">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={isSaving || !text.trim()}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 ${
                        saveSuccess
                            ? "bg-green-600 shadow-lg shadow-green-600/20"
                            : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    }`}
                >
                    {isSaving ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                    ) : saveSuccess ? (
                        <><span className="material-symbols-outlined text-[16px]">check</span>Saved!</>
                    ) : (
                        <><span className="material-symbols-outlined text-[16px]">{isExisting ? "save" : "add"}</span>{isExisting ? "Update Question" : "Create Question"}</>
                    )}
                </button>
            </div>
        </div>
    );
}
