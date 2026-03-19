"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuestions } from "@/hooks/useQuestions";
import { QuestionBuilderCard } from "@/components/features/QuestionBuilderCard";
import BulkImportModal from "@/components/features/BulkImportModal";
import { IQuestion } from "@/types/question";

export default function RecruiterQuestionsPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const examId = params.id as string;
    const stageId = searchParams.get("stageId");

    const { questions, loading, error, fetchQuestions, saveQuestion } = useQuestions(examId, stageId || undefined);
    const [isCreating, setIsCreating] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleSaveNew = async (data: Partial<IQuestion>) => {
        await saveQuestion(data);
        setIsCreating(false);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">quiz</span>
                        Stage Configuration
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage MCQ and Coding questions for this round.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-bold rounded-xl border border-gray-700 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                        Import CSV/Excel
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Add Question
                    </button>
                </div>
            </header>

            {showBulkModal && (
                <BulkImportModal
                    examId={examId}
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => {
                        fetchQuestions();
                        // Optional: trigger a toast or alert
                    }}
                />
            )}

            {error && (
                <div className="bg-red-900/50 text-red-400 p-4 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {isCreating && (
                <QuestionBuilderCard
                    onSave={handleSaveNew}
                    onCancel={() => setIsCreating(false)}
                    order={questions.length + 1}
                />
            )}

            <div className="space-y-6">
                {loading && !questions.length ? (
                    <div className="text-center text-gray-500 py-12 animate-pulse">Loading Questions...</div>
                ) : questions.length === 0 && !isCreating ? (
                    <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl bg-gray-900">
                        <p className="text-gray-400 mb-4">No questions added yet.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                            Create your first question
                        </button>
                    </div>
                ) : (
                    questions.map((q) => (
                        <QuestionBuilderCard
                            key={q._id}
                            initialData={q}
                            onSave={saveQuestion}
                            order={q.order}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
