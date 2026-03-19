"use client";
import React, { useState } from "react";
import { useExamsList } from "@/hooks/useExamsList";
import ExamManagerCard from "@/components/features/ExamManagerCard";
import ExamManagerCardSkeleton from "@/components/features/ExamManagerCardSkeleton";
import CreateExamModal from "@/components/features/CreateExamModal";
import { useAuth } from "@/hooks/useAuth";

export default function ExamManagementPage() {
    const { user, isHydrated } = useAuth("recruiter");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const {
        exams,
        loading,
        updateProctoringMode,
        refetch,
    } = useExamsList(user?._id);

    if (!isHydrated || !user) return null;

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.sessionCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="px-6 pt-8 pb-6 md:px-10 max-w-[1400px] mx-auto min-h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-bold text-white">Active Exams</h3>
                    <p className="text-sm text-slate-400 mt-1">Create, manage, and monitor your assessment library.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-[#1a1a1a] border border-[#3b3b3b] rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded transition-colors ${viewMode === "grid" ? "bg-[#262626] text-white" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            <span className="material-symbols-outlined text-xl leading-none">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded transition-colors ${viewMode === "list" ? "bg-[#262626] text-white" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            <span className="material-symbols-outlined text-xl leading-none">list</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border border-primary/50"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Create New Exam
                    </button>
                </div>
            </div>

            <div className="mt-8 relative max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[20px]">search</span>
                <input
                    className="h-10 w-full rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-10 pr-4 text-sm text-[#e8e8e8] placeholder-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Search exams or tags..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="mt-8">
                    <ExamManagerCardSkeleton count={6} />
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredExams.map(exam => (
                        <ExamManagerCard
                            key={exam._id}
                            exam={exam}
                            onProctorModeChange={updateProctoringMode}
                        />
                    ))}

                    {/* Create New Exam card */}
                    <div
                        onClick={() => setShowCreateModal(true)}
                        className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#3b3b3b] bg-transparent p-6 transition-all hover:border-primary/50 hover:bg-[#1a1a1a]/30 cursor-pointer min-h-[280px]"
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#3b3b3b] text-slate-500 group-hover:text-primary group-hover:border-primary/30 transition-all mb-4">
                            <span className="material-symbols-outlined text-4xl">add</span>
                        </div>
                        <p className="text-lg font-bold text-slate-400 group-hover:text-white transition-colors">Create New Exam</p>
                        <p className="text-sm text-slate-600 mt-1">Start from scratch or use a template</p>
                    </div>
                </div>
            )}

            {/* Create Exam Modal */}
            {showCreateModal && (
                <CreateExamModal
                    recruiterId={user._id}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        refetch();
                    }}
                    redirectOnSuccess={true}
                />
            )}
        </div>
    );
}
