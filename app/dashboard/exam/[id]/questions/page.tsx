"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuestions } from "@/hooks/useQuestions";
import { QuestionBuilderCard } from "@/components/features/QuestionBuilderCard";
import BulkImportModal from "@/components/features/BulkImportModal";
import { IQuestion } from "@/types/question";

interface ExamInfo {
    _id: string;
    title: string;
    description?: string;
    duration: number;
    sessionCode: string;
    status: string;
    proctoringMode: string;
}

export default function RecruiterQuestionsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const { questions, loading, error, fetchQuestions, saveQuestion } = useQuestions(examId, undefined);
    const [isCreating, setIsCreating] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [exam, setExam] = useState<ExamInfo | null>(null);
    const [copied, setCopied] = useState(false);

    // Load exam info
    useEffect(() => {
        if (!examId) return;
        fetch(`/api/exam/${examId}`)
            .then(r => r.json())
            .then(setExam)
            .catch(() => null);
    }, [examId]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleSaveNew = async (data: Partial<IQuestion>) => {
        await saveQuestion(data);
        setIsCreating(false);
    };

    const handleCopyCode = () => {
        if (!exam?.sessionCode) return;
        navigator.clipboard.writeText(exam.sessionCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const mcqCount = questions.filter(q => q.type === "MCQ").length;
    const codingCount = questions.filter(q => q.type === "CODING").length;

    const proctoringColors: Record<string, string> = {
        strict: "text-primary-light bg-primary/10 border-primary/20",
        standard: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        light: "text-green-400 bg-green-500/10 border-green-500/20",
    };

    return (
        <div className="min-h-full bg-[#0a0a0a]">
            {/* ── Header ── */}
            <div className="border-b border-[#1f1f1f] bg-[#0f0f0f] px-8 py-5">
                <div className="max-w-5xl mx-auto">
                    {/* Breadcrumb */}
                    <button
                        onClick={() => router.push("/dashboard/exams")}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors mb-3 group"
                    >
                        <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                        Back to Exams
                    </button>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-bold text-white truncate">
                                    {exam?.title || "Loading..."}
                                </h1>
                                {exam?.proctoringMode && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${proctoringColors[exam.proctoringMode] || ""}`}>
                                        {exam.proctoringMode}
                                    </span>
                                )}
                                {exam?.status && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                        exam.status === "active" ? "text-green-400 bg-green-500/10 border-green-500/20" :
                                        exam.status === "closed" ? "text-slate-400 bg-slate-500/10 border-slate-500/20" :
                                        "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                                    }`}>
                                        {exam.status}
                                    </span>
                                )}
                            </div>
                            {exam?.description && (
                                <p className="text-sm text-slate-500 mt-1 truncate max-w-lg">{exam.description}</p>
                            )}
                        </div>

                        {/* Session Code */}
                        {exam?.sessionCode && (
                            <button
                                onClick={handleCopyCode}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-primary/40 transition-all group"
                                title="Click to copy session code"
                            >
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Code</span>
                                <span className="font-mono font-bold text-white tracking-widest text-sm">{exam.sessionCode}</span>
                                <span className="material-symbols-outlined text-[16px] text-slate-500 group-hover:text-primary transition-colors">
                                    {copied ? "check" : "content_copy"}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#1a1a1a]">
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="material-symbols-outlined text-[16px] text-slate-500">schedule</span>
                            <span className="text-slate-400">{exam?.duration ?? "—"} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="material-symbols-outlined text-[16px] text-slate-500">quiz</span>
                            <span className="text-slate-400">{loading ? "—" : `${questions.length} question${questions.length !== 1 ? "s" : ""}`}</span>
                        </div>
                        {questions.length > 0 && (
                            <>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-slate-400">{mcqCount} MCQ</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-slate-400">{codingCount} Coding</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <span className="material-symbols-outlined text-[16px] text-primary-light">grade</span>
                                    <span className="text-slate-400">{totalPoints} pts total</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-5xl mx-auto px-8 py-8 space-y-4">

                {/* Action bar */}
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        {loading ? "Loading..." : questions.length === 0 ? "No Questions Yet" : `${questions.length} Question${questions.length !== 1 ? "s" : ""}`}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-slate-300 text-sm font-semibold rounded-xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            Import CSV
                        </button>
                        <button
                            onClick={() => { setIsCreating(true); setTimeout(() => document.getElementById("new-question-card")?.scrollIntoView({ behavior: "smooth" }), 50); }}
                            disabled={isCreating}
                            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add Question
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">report</span>
                        {error}
                    </div>
                )}

                {/* New question form */}
                {isCreating && (
                    <div id="new-question-card">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary-light">
                                {questions.length + 1}
                            </div>
                            <span className="text-xs font-bold text-primary-light uppercase tracking-wider">New Question</span>
                        </div>
                        <QuestionBuilderCard
                            onSave={handleSaveNew}
                            onCancel={() => setIsCreating(false)}
                            order={questions.length + 1}
                        />
                    </div>
                )}

                {/* Existing questions */}
                {loading && questions.length === 0 ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] animate-pulse" />
                        ))}
                    </div>
                ) : questions.length === 0 && !isCreating ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-[#2a2a2a] rounded-2xl bg-[#0f0f0f] text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-5">
                            <span className="material-symbols-outlined text-3xl text-slate-600">quiz</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">No questions yet</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-sm">
                            Add MCQ or Coding questions manually, or import them from a CSV file.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-slate-300 text-sm font-semibold rounded-xl hover:border-[#3a3a3a] transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                Import CSV
                            </button>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Add First Question
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((q, idx) => (
                            <div key={q._id} className="flex gap-3">
                                {/* Question number */}
                                <div className="flex flex-col items-center pt-5 shrink-0">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                                        q.type === "MCQ"
                                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    {idx < questions.length - 1 && (
                                        <div className="w-[1px] flex-1 bg-[#2a2a2a] mt-2 min-h-[20px]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <QuestionBuilderCard
                                        initialData={q}
                                        onSave={saveQuestion}
                                        order={q.order}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Add next question inline button */}
                        {!isCreating && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#2a2a2a] hover:border-primary/40 rounded-xl text-slate-500 hover:text-white text-sm font-semibold transition-all hover:bg-[#1a1a1a]/50 group"
                            >
                                <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">add_circle</span>
                                Add another question
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showBulkModal && (
                <BulkImportModal
                    examId={examId}
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => {
                        fetchQuestions();
                        setShowBulkModal(false);
                    }}
                />
            )}
        </div>
    );
}
