import React from "react";
import SessionCard from "./SessionCard";
import SessionCardGridSkeleton from "./SessionCardGridSkeleton";
import { DashboardSession } from "@/hooks/useDashboardData";

interface SessionCardGridProps {
    sessions: DashboardSession[];
    loading?: boolean;
}

export default function SessionCardGrid({ sessions, loading }: SessionCardGridProps) {
    if (loading) {
        return <SessionCardGridSkeleton count={6} />;
    }

    if (!sessions || sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-[#3b3b3b] rounded-xl bg-[#1a1a1a]/50">
                <span className="material-symbols-outlined text-4xl text-slate-500 mb-3">
                    inbox
                </span>
                <h3 className="text-lg font-bold text-white mb-1">No Sessions Found</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                    There are no recent exam sessions to display. Create a new exam and invite candidates to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sessions.map((session) => (
                <SessionCard key={session._id} session={session} />
            ))}
        </div>
    );
}
