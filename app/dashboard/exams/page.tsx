"use client";
import React, { useState } from "react";
import { useExamsList } from "@/hooks/useExamsList";
import ExamManagerCard from "@/components/features/ExamManagerCard";
import ExamManagerCardSkeleton from "@/components/features/ExamManagerCardSkeleton";
import CreateExamModal from "@/components/features/CreateExamModal";
import { useAuth } from "@/hooks/useAuth";

type StatusFilter = "all" | "active" | "draft" | "closed";

export default function ExamManagementPage() {
    const { user, isHydrated } = useAuth("recruiter");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { exams, loading, updateProctoringMode, refetch } = useExamsList(user?._id);

    if (!isHydrated || !user) return null;

    const filteredExams = exams.filter(exam => {
        const matchesSearch =
            exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.sessionCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || exam.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const counts = {
        all: exams.length,
        active: exams.filter(e => e.status === "active").length,
        draft: exams.filter(e => e.status === "draft").length,
        closed: exams.filter(e => e.status === "closed").length,
    };

    const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
        { key: "all", label: "All" },
        { key: "active", label: "Active" },
        { key: "draft", label: "Draft" },
        { key: "closed", label: "Closed" },
    ];

    return (
        <div className="px-6 pt-8 pb-12 md:px-10 max-w-[1400px] mx-auto min-h-full">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-white">Exams</h3>
                    <p className="text-sm text-slate-400 mt-1">Create, manage, and monitor your assessment library.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    New Exam
                </button>
            </div>

            {/* Search + filter bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                <div className="relative w-full sm:max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[20px]">search</span>
                    <input
                        className="h-10 w-full rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-primary/50 focus:outline-none transition-colors"
                        placeholder="Search by title or code..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Status tabs */}
                <div className="flex gap-1 p-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl">
                    {STATUS_FILTERS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === key
                                    ? "bg-[#1f1f1f] text-white"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            {label}
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                statusFilter === key ? "bg-primary/20 text-primary-light" : "bg-[#1a1a1a] text-slate-600"
                            }`}>
                                {counts[key]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Exam grid */}
            {loading ? (
                <ExamManagerCardSkeleton count={6} />
            ) : filteredExams.length === 0 && exams.length === 0 ? (
                /* Empty state — no exams at all */
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-[#2a2a2a] rounded-2xl bg-[#0f0f0f] text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-5">
                        <span className="material-symbols-outlined text-3xl text-slate-600">quiz</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">No exams yet</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm">
                        Create your first exam to start inviting candidates and monitoring sessions.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Create First Exam
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredExams.map(exam => (
                        <ExamManagerCard
                            key={exam._id}
                            exam={exam}
                            onProctorModeChange={updateProctoringMode}
                        />
                    ))}

                    {/* Create new card */}
                    <div
                        onClick={() => setShowCreateModal(true)}
                        className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2a2a2a] bg-transparent transition-all hover:border-primary/40 hover:bg-[#1a1a1a]/30 cursor-pointer min-h-[280px]"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-slate-500 group-hover:text-primary group-hover:border-primary/30 transition-all mb-3">
                            <span className="material-symbols-outlined text-3xl">add</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Create New Exam</p>
                        <p className="text-xs text-slate-600 mt-1">Start from scratch</p>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateExamModal
                    recruiterId={user._id}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => refetch()}
                    redirectOnSuccess={true}
                />
            )}
        </div>
    );
}
