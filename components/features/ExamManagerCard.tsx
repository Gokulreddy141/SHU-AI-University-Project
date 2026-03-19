import React from "react";
import { IExam } from "@/types/exam";
import ProctorToggle from "./ProctorToggle";

interface ExamManagerCardProps {
    exam: IExam;
    onProctorModeChange: (examId: string, mode: "strict" | "standard" | "light") => void;
}

export default function ExamManagerCard({
    exam,
    onProctorModeChange,
}: ExamManagerCardProps) {
    // Generate an icon and color based on the title (deterministic pseudo-random)
    const getIconConfig = (title: string) => {
        const configs = [
            { icon: "code", bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
            { icon: "palette", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
            { icon: "database", bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
            { icon: "psychology", bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
            { icon: "account_tree", bg: "bg-[#60b38a]/10", text: "text-[#60b38a]", border: "border-[#60b38a]/20" },
        ];
        const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return configs[hash % configs.length];
    };

    const config = getIconConfig(exam.title);
    const activeCount = exam.activeSessionsCount || 0;
    const isLive = activeCount > 0;

    return (
        <div className="group relative flex flex-col rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-black/60">
            <div className="flex items-start justify-between mb-6">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center border ${config.bg} ${config.text} ${config.border}`}>
                    <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-[#262626]">
                        <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-[#262626]">
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                    </button>
                </div>
            </div>

            <h4 className="text-lg font-bold text-white leading-tight mb-2 truncate">
                {exam.title}
            </h4>
            <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-widest font-mono">
                ID: {exam.sessionCode}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                        Questions
                    </p>
                    <p className="text-sm font-mono font-bold text-white">
                        {exam.questionsCount || 0}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                        Duration
                    </p>
                    <p className="text-sm font-mono font-bold text-white">
                        {exam.duration}m
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                        Active
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isLive ? "bg-[#60b38a] animate-pulse" : "bg-slate-600"}`}></span>
                        <p className="text-sm font-mono font-bold text-white">
                            {activeCount}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-auto border-t border-[#3b3b3b] pt-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                    Proctoring Mode
                </p>
                <ProctorToggle
                    currentMode={exam.proctoringMode || "standard"}
                    onModeChange={(mode) => onProctorModeChange(exam._id, mode)}
                />
            </div>
        </div>
    );
}
