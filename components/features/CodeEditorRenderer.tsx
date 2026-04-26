"use client";

import dynamic from "next/dynamic";
import { useExamSubmission } from "@/hooks/useExamSubmission";
import { IQuestion } from "@/types/question";
import { useEffect, useState } from "react";
import { useViolationBuffer } from "@/hooks/useViolationBuffer";
import { useAuth } from "@/hooks/useAuth";

// Dynamically import Monaco to prevent SSR hydration errors
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false, loading: () => <div className="text-gray-500 animate-pulse p-6">Loading Monaco IDE...</div> });

interface CodeEditorRendererProps {
    question: IQuestion;
    sessionId: string;
}

export function CodeEditorRenderer({ question, sessionId }: CodeEditorRendererProps) {
    const { user } = useAuth();
    const { responses, saveAnswer, loadDrafts, saving } = useExamSubmission(sessionId);
    const { logViolation } = useViolationBuffer();
    const [localCode, setLocalCode] = useState("");

    useEffect(() => {
        loadDrafts();
    }, [loadDrafts]);

    // Sync draft state to local code on mount
    useEffect(() => {
        const draft = responses[question._id]?.submittedCode;
        if (draft && !localCode) {
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setLocalCode(draft), 0);
        } else if (question.starterCode && !draft && !localCode) {
            setTimeout(() => setLocalCode(question.starterCode || ""), 0);
        }
    }, [responses, question._id, question.starterCode, localCode]);

    const handleCodeChange = (val: string | undefined) => {
        const code = val || "";
        setLocalCode(code);
        // Fire debounce save
        saveAnswer(question._id, { submittedCode: code, selectedLanguage: question.allowedLanguages?.[0] || "javascript" });
    };

    // Edge case: Large paste payload / Paste cheating
    const handlePaste = (e: React.ClipboardEvent) => {
        const pastedText = e.clipboardData.getData("Text");
        if (pastedText.length > 50) {
            logViolation({
                sessionId,
                candidateId: user?._id || "unknown",
                type: "CLIPBOARD_PASTE",
                confidence: 1.0,
                timestamp: new Date().toISOString()
            });
        }
    };

    if (question.type !== "CODING") return null;

    return (
        <div className="w-full h-full flex flex-col bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Prompt Header */}
            <div className="bg-gray-900 border-b border-gray-800 p-6 flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-white">Coding Challenge</h2>
                    <div className="flex gap-2 items-center">
                        <span className="text-sm px-2 py-1 bg-gray-800 text-gray-300 rounded border border-gray-700">
                            {question.allowedLanguages?.[0] || "javascript"}
                        </span>
                        <div className="text-sm font-medium px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-md whitespace-nowrap ml-2">
                            {question.points} Points
                        </div>
                    </div>
                </div>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {question.text}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative bg-[#1e1e1e] min-h-0" onPaste={handlePaste}>
                <div className="absolute top-2 right-4 z-10 text-xs text-gray-500 font-mono flex items-center gap-2">
                    {saving ? (
                        <><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span> Saving...</>
                    ) : (
                        <><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Saved</>
                    )}
                </div>

                <MonacoEditor
                    height="100%"
                    language={(question.allowedLanguages?.[0] || "javascript").toLowerCase()}
                    theme="vs-dark"
                    value={localCode}
                    onChange={handleCodeChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'Monaco', monospace",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        tabSize: 4
                    }}
                />
            </div>
        </div>
    );
}
