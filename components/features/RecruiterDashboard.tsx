"use client";
import React, { useState } from "react";
import MetricCard from "@/components/features/MetricCard";
import MetricCardSkeleton from "@/components/features/MetricCardSkeleton";
import SessionCardGrid from "@/components/features/SessionCardGrid";
import CreateExamModal from "@/components/features/CreateExamModal";
import { useDashboardData } from "@/hooks/useDashboardData";

interface RecruiterDashboardProps {
    user: { _id: string; name: string };
}

export default function RecruiterDashboard({ user }: RecruiterDashboardProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { metrics, sessions, loading, refetch } = useDashboardData(user?._id);

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1400px] mx-auto min-h-full">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {loading && !metrics ? (
                    <>
                        <MetricCardSkeleton />
                        <MetricCardSkeleton />
                        <MetricCardSkeleton />
                        <MetricCardSkeleton />
                    </>
                ) : (
                    <>
                        <MetricCard
                            title="Active Exams"
                            value={metrics?.activeExams ?? "-"}
                            icon="assignment_turned_in"
                            trendValue={`${metrics?.activeExamsTrend ?? 0}%`}
                            trendLabel="from last month"
                            colorClass="emerald"
                        />
                        <MetricCard
                            title="Total Candidates"
                            value={metrics?.totalCandidates ?? "-"}
                            icon="groups"
                            trendValue={`${metrics?.candidatesTrend ?? 0}%`}
                            trendLabel="from last month"
                            colorClass="blue"
                        />
                        <MetricCard
                            title="Avg Integrity Score"
                            value={metrics ? `${metrics.avgIntegrityScore}%` : "-"}
                            icon="verified_user"
                            colorClass="primary"
                            isProgressBar={true}
                            progressPercentage={metrics?.avgIntegrityScore ?? 0}
                        />
                        <MetricCard
                            title="Flagged Sessions"
                            value={metrics?.flaggedSessions ?? "-"}
                            icon="report_problem"
                            trendValue={`${metrics?.flaggedSessionsTrend ?? 0}%`}
                            trendLabel="requires review"
                            trendUp={false}
                            colorClass="red"
                        />
                    </>
                )}
            </div>

            {/* Main Section */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">Recent Sessions</h3>
                        <p className="text-sm text-slate-400">
                            Real-time monitoring of ongoing and completed exams.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-[#3b3b3b] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-[#262626] hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-lg">filter_list</span>
                            Filter
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            New Exam
                        </button>
                    </div>
                </div>

                {/* Session Grid */}
                <SessionCardGrid sessions={sessions} loading={loading} />
            </div>

            {/* Create Exam Modal */}
            {showCreateModal && (
                <CreateExamModal
                    recruiterId={user._id}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => refetch()}
                    redirectOnSuccess={false}
                />
            )}
        </div>
    );
}
