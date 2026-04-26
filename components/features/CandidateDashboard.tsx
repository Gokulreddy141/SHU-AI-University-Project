import React, { useState } from "react";
import { useCandidateDashboard } from "@/hooks/useCandidateDashboard";
import CandidateSessionCard from "@/components/features/CandidateSessionCard";
import { useRouter } from "next/navigation";

interface CandidateDashboardProps {
    user: { _id: string; name: string };
}

export default function CandidateDashboard({ user }: CandidateDashboardProps) {
    const { pendingSessions, completedSessions, loading, error } = useCandidateDashboard(user._id);
    const [joinCode, setJoinCode] = useState("");
    const router = useRouter();

    const handleJoinCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.length === 6) {
            router.push(`/candidate/verify?code=${joinCode.toUpperCase()}`);
        }
    };

    if (loading) {
        return (
            <div className="p-6 md:p-10 max-w-[1400px] mx-auto min-h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 md:p-10 max-w-[1400px] mx-auto min-h-full text-center">
                <p className="text-red-400 bg-red-500/10 p-4 rounded-xl inline-block border border-red-500/20">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-8 rounded-2xl">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name.split(" ")[0]}!</h2>
                    <p className="text-slate-400 text-sm">
                        You have <strong className="text-white">{pendingSessions.length}</strong> pending assignments waiting for your completion.
                    </p>
                </div>

                {/* Specific Join By Code Widget */}
                <form onSubmit={handleJoinCode} className="flex gap-2 bg-[#0f0f0f] border border-[#3b3b3b] p-2 rounded-xl shadow-inner w-full md:w-auto">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-letter code"
                        maxLength={6}
                        className="bg-transparent border-none text-white font-mono tracking-widest px-3 w-40 focus:outline-none focus:ring-0 placeholder:tracking-normal placeholder:text-slate-600 uppercase"
                    />
                    <button
                        type="submit"
                        disabled={joinCode.length !== 6}
                        className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50 transition-all hover:bg-primary/90"
                    >
                        Join
                    </button>
                </form>
            </div>

            {/* Pending Exams Section */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary text-2xl">pending_actions</span>
                    <h3 className="text-xl font-bold text-white">Pending Assignments</h3>
                </div>

                {pendingSessions.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-[#3b3b3b] rounded-2xl bg-[#1a1a1a]/50">
                        <p className="text-slate-400">You&apos;re all caught up! No pending exams.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pendingSessions.map(session => (
                            <CandidateSessionCard key={session._id} session={session} />
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Exams Section */}
            {completedSessions.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-[#60b38a] text-2xl">task_alt</span>
                        <h3 className="text-xl font-bold text-white">Completed Exams</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {completedSessions.map(session => (
                            <CandidateSessionCard key={session._id} session={session} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
