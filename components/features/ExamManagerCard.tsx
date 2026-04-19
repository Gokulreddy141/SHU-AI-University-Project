import React from "react";
import { useRouter } from "next/navigation";
import { IExam } from "@/types/exam";

interface ExamManagerCardProps {
    exam: IExam;
    onProctorModeChange: (examId: string, mode: "strict" | "standard" | "light") => void;
}

const STATUS_CONFIG = {
    active: { label: "Active", dot: "bg-green-400", text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    draft: { label: "Draft", dot: "bg-yellow-400", text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    closed: { label: "Closed", dot: "bg-slate-500", text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

const PROCTORING_CONFIG = {
    strict: { label: "Strict", icon: "security", text: "text-primary-light", bg: "bg-primary/10", border: "border-primary/20" },
    standard: { label: "Standard", icon: "shield", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    light: { label: "Light", icon: "visibility", text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
};

const ICON_CONFIGS = [
    { icon: "code", bg: "bg-primary/10", text: "text-primary-light", border: "border-primary/20" },
    { icon: "palette", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    { icon: "storage", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    { icon: "psychology", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    { icon: "account_tree", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
];

export default function ExamManagerCard({ exam, onProctorModeChange }: ExamManagerCardProps) {
    const router = useRouter();

    const iconConfig = ICON_CONFIGS[
        exam.title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % ICON_CONFIGS.length
    ];

    const statusCfg = STATUS_CONFIG[exam.status] || STATUS_CONFIG.draft;
    const activeCount = exam.activeSessionsCount || 0;
    const isLive = activeCount > 0;

    const createdDate = exam.createdAt
        ? new Date(exam.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;

    return (
        <div className="group relative flex flex-col rounded-2xl border border-[#2a2a2a] bg-[#141414] overflow-hidden transition-all hover:border-[#3a3a3a] hover:shadow-2xl hover:shadow-black/60">
            {/* Top accent bar by status */}
            <div className={`h-0.5 w-full ${exam.status === "active" ? "bg-gradient-to-r from-green-500/60 to-transparent" : exam.status === "closed" ? "bg-gradient-to-r from-slate-600/40 to-transparent" : "bg-gradient-to-r from-yellow-500/40 to-transparent"}`} />

            {/* Card Header */}
            <div className="p-5 pb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${iconConfig.bg} ${iconConfig.text} ${iconConfig.border}`}>
                        <span className="material-symbols-outlined text-[22px]">{iconConfig.icon}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${isLive ? "animate-pulse" : ""}`} />
                            {statusCfg.label}
                        </span>
                    </div>
                </div>

                <h4 className="text-base font-bold text-white leading-snug mb-1 line-clamp-2 min-h-[2.5rem]">
                    {exam.title}
                </h4>
                {exam.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{exam.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-mono text-slate-600 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-md tracking-widest">
                        {exam.sessionCode}
                    </span>
                    {createdDate && (
                        <span className="text-[10px] text-slate-600">{createdDate}</span>
                    )}
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-[#1f1f1f] border-t border-b border-[#1f1f1f] mx-0">
                <div className="bg-[#141414] px-4 py-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Questions</p>
                    <p className="text-lg font-bold font-mono text-white">{exam.questionsCount || 0}</p>
                </div>
                <div className="bg-[#141414] px-4 py-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Duration</p>
                    <p className="text-lg font-bold font-mono text-white">{exam.duration}<span className="text-xs text-slate-500 font-normal ml-0.5">min</span></p>
                </div>
                <div className="bg-[#141414] px-4 py-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Live</p>
                    <div className="flex items-center justify-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLive ? "bg-green-400 animate-pulse" : "bg-slate-600"}`} />
                        <p className="text-lg font-bold font-mono text-white">{activeCount}</p>
                    </div>
                </div>
            </div>

            {/* Proctoring + Actions */}
            <div className="p-5 pt-4 mt-auto space-y-3">
                {/* Proctoring badge */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Proctoring</span>
                    <div className="flex items-center gap-1.5">
                        {(["light", "standard", "strict"] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => onProctorModeChange(exam._id, mode)}
                                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                    exam.proctoringMode === mode
                                        ? `${PROCTORING_CONFIG[mode].bg} ${PROCTORING_CONFIG[mode].text} ${PROCTORING_CONFIG[mode].border}`
                                        : "bg-transparent border-[#2a2a2a] text-slate-600 hover:text-slate-400"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[12px]">{PROCTORING_CONFIG[mode].icon}</span>
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => router.push(`/dashboard/exam/${exam._id}/questions`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        Questions
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/exam/${exam._id}/sessions`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#3a3a3a] text-slate-300 text-xs font-bold rounded-xl transition-all"
                    >
                        <span className="material-symbols-outlined text-[14px]">groups</span>
                        Sessions
                    </button>
                </div>
            </div>
        </div>
    );
}
