"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { useCandidateDashboard } from "@/hooks/useCandidateDashboard";
import CandidateSessionCard from "@/components/features/CandidateSessionCard";

interface User {
    _id: string;
    name: string;
    role: string;
}

export default function CandidateDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
        const parsed = JSON.parse(stored);
        if (parsed.role !== "candidate") {
            router.push("/dashboard");
            return;
        }
        queueMicrotask(() => setUser(parsed));
    }, [router]);

    const { pendingSessions, completedSessions, loading, error } = useCandidateDashboard(user?._id);

    if (!user) return null;

    return (
        <DashboardShell userName={user.name} userRole={user.role}>
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">My Exams</h1>
                        <p className="text-slate-400 mt-2 text-lg">Manage your assigned assessments and track your progress.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                    </div>
                )}

                {/* Pending Exams Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-1 rounded-full bg-primary shadow-[0_0_15px_rgba(230,126,92,0.5)]" />
                            <h2 className="text-2xl font-bold text-white">Pending Assignments</h2>
                            <span className="bg-primary/10 border border-primary/20 text-primary text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                {pendingSessions.length} Available
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                            ))}
                        </div>
                    ) : pendingSessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {pendingSessions.map(session => (
                                <CandidateSessionCard key={session._id} session={session} />
                            ))}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-white/5 bg-white/[0.02] rounded-3xl p-16 text-center group hover:border-primary/20 transition-colors duration-500">
                            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                                <span className="material-symbols-outlined text-4xl text-slate-600 group-hover:text-primary transition-colors">auto_stories</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Clean Slate!</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">You have completed all your assigned assessments. Take a well-deserved break!</p>
                        </div>
                    )}
                </section>

                {/* Past Exams Section */}
                {completedSessions.length > 0 && (
                    <section className="space-y-6 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-1 rounded-full bg-slate-700" />
                            <h2 className="text-2xl font-bold text-white opacity-60">Completed History</h2>
                            <span className="bg-white/5 border border-white/10 text-slate-500 text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                {completedSessions.length} Total
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 hover:opacity-100 transition-opacity duration-500">
                            {completedSessions.map(session => (
                                <CandidateSessionCard key={session._id} session={session} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </DashboardShell>
    );
}
