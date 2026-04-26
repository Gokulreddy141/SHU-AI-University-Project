import React from "react";
import { ICandidateSession } from "@/types/session";
import { useRouter } from "next/navigation";

interface CandidateSessionCardProps {
    session: ICandidateSession;
}

export default function CandidateSessionCard({ session }: CandidateSessionCardProps) {
    const router = useRouter();
    const isActive = ["pending", "biometric_check", "in_progress"].includes(session.status);
    const isCompleted = ["completed", "graded", "flagged"].includes(session.status);

    const handleAction = () => {
        if (isActive) {
            router.push(`/candidate/verify?sessionId=${session._id}`);
        } else if (isCompleted) {
            // Optional: Route to a candidate results page if supported
            // router.push(`/candidate/results/${session._id}`);
            alert("Results view for candidates is currently disabled.");
        }
    };

    // Determine Status Badge Color
    const getStatusConfig = () => {
        switch (session.status) {
            case "in_progress":
                return { label: "In Progress", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
            case "pending":
            case "biometric_check":
                return { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" };
            case "completed":
                return { label: "Completed", color: "bg-[#60b38a]/10 text-[#60b38a] border-[#60b38a]/20" };
            case "flagged":
                return { label: "Requires Review", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
            default:
                return { label: session.status, color: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
        }
    };
    const statusConfig = getStatusConfig();

    return (
        <div className="group relative flex flex-col rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-black/60">
            <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center border bg-primary/5 border-primary/20 text-primary">
                    <span className="material-symbols-outlined text-2xl">assignment</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>
                    {statusConfig.label}
                </div>
            </div>

            <h4 className="text-lg font-bold text-white leading-tight mb-2 line-clamp-2">
                {session.examId?.title || "Unknown Exam"}
            </h4>

            {session.examId?.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {session.examId.description}
                </p>
            )}

            <div className="mt-auto grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-[#3b3b3b]">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                        Duration
                    </p>
                    <p className="text-sm font-mono font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                        {session.examId?.duration || 0}m
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                        Score
                    </p>
                    <p className="text-sm font-mono font-bold text-white">
                        {session.gradingStatus === "finalized"
                            ? `${session.examScore} / ${session.maxScore}`
                            : "—"}
                    </p>
                </div>
            </div>

            <button
                onClick={handleAction}
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg text-white flex justify-center items-center gap-2 ${isActive
                        ? "bg-primary hover:bg-primary/90 shadow-primary/20"
                        : "bg-[#262626] border border-[#3b3b3b] hover:bg-[#333] text-slate-300"
                    }`}
            >
                {isActive ? (
                    <>
                        Start Exam
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                ) : (
                    <>
                        View Details
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </>
                )}
            </button>
        </div>
    );
}
