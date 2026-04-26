import React from "react";
import { DashboardSession } from "@/hooks/useDashboardData";

interface SessionCardProps {
    session: DashboardSession;
}

export default function SessionCard({ session }: SessionCardProps) {
    const {
        candidateId,
        examId,
        integrityScore,
        status,
        violationSummary,
        createdAt,
        startTime,
    } = session;

    const isFlagged = status === "flagged";
    const isCompleted = status === "completed";
    const isLive = status === "in_progress";

    // Format candidate initials
    const initials = candidateId?.name
        ? candidateId.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "?";

    // Formatting date and elapsed time
    const startDate = new Date(startTime || createdAt);
    const timeFormatted = startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    const dateFormatted = startDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
    });

    let displayStatus = "Scheduled";
    let statusColor = "bg-slate-700/50 text-slate-300 border-slate-600/30";
    let hoverGradient = "from-slate-600 to-slate-400";

    if (isCompleted) {
        displayStatus = "Completed";
        statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        hoverGradient = "from-emerald-600 to-emerald-400";
    } else if (isLive) {
        displayStatus = "Live";
        statusColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
        hoverGradient = "from-amber-600 to-amber-400";
    } else if (isFlagged) {
        displayStatus = "Flagged";
        statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
        hoverGradient = "from-red-600 to-red-400";
    }

    const scoreColor =
        integrityScore >= 90
            ? "text-emerald-400"
            : integrityScore >= 70
                ? "text-amber-400"
                : "text-red-500";

    const getViolationIcons = () => {
        const icons = [];
        if (violationSummary?.multipleFaces > 0)
            icons.push(
                <div key="faces" className="group/tooltip relative flex h-8 w-8 items-center justify-center rounded bg-[#262626] text-amber-400 border border-[#3b3b3b]" title="Multiple Faces Detected">
                    <span className="material-symbols-outlined text-lg">group</span>
                </div>
            );
        if (violationSummary?.tabSwitch > 0)
            icons.push(
                <div key="tabs" className="group/tooltip relative flex h-8 w-8 items-center justify-center rounded bg-[#262626] text-amber-400 border border-[#3b3b3b]" title="Tab Switched">
                    <span className="material-symbols-outlined text-lg">tab</span>
                </div>
            );
        if (violationSummary?.virtualCamera > 0)
            icons.push(
                <div key="virtualcam" className="group/tooltip relative flex h-8 w-8 items-center justify-center rounded bg-red-500/10 text-red-500 border border-red-500/20" title="Virtual Camera">
                    <span className="material-symbols-outlined text-lg">videocam_off</span>
                </div>
            );
        if (violationSummary?.fullscreenExit > 0)
            icons.push(
                <div key="fullscreen" className="group/tooltip relative flex h-8 w-8 items-center justify-center rounded bg-red-500/10 text-red-500 border border-red-500/20" title="Full Screen Exit">
                    <span className="material-symbols-outlined text-lg">fullscreen_exit</span>
                </div>
            );
        if (violationSummary?.windowBlur > 0)
            icons.push(
                <div key="windowblur" className="group/tooltip relative flex h-8 w-8 items-center justify-center rounded bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Window/App Switch">
                    <span className="material-symbols-outlined text-lg">blur_on</span>
                </div>
            );
        if (violationSummary?.keyboardShortcut > 0 || violationSummary?.clipboardPaste > 0)
            icons.push(
                <div key="surfing" className="group/tooltip relative flex h-8 w-8 items-center justify-center rounded bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Internet Surfing / Shortcuts">
                    <span className="material-symbols-outlined text-lg">public_off</span>
                </div>
            );
        return icons;
    };

    const violationIcons = getViolationIcons();

    return (
        <div
            className={`group relative flex flex-col rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-black/40 ${isFlagged ? "border-red-900/30 hover:border-red-500/50" : ""
                }`}
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#262626] flex items-center justify-center border border-[#3b3b3b] text-slate-400 font-semibold">
                        {initials}
                    </div>
                    <div>
                        <h4 className="font-semibold text-white">
                            {candidateId?.name || "Unknown Candidate"}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1 w-[160px]">
                            {examId?.title || "Unknown Exam"}
                        </p>
                    </div>
                </div>
                <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border ${statusColor}`}
                >
                    {isLive && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                    )}
                    {displayStatus}
                </div>
            </div>

            <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time</span>
                    <span className="text-slate-200">{timeFormatted}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Date</span>
                    <span className="text-slate-200">{dateFormatted}</span>
                </div>
            </div>

            <div className="mt-auto border-t border-[#3b3b3b] pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Integrity Score
                        </span>
                        <span className={`text-xl font-bold ${scoreColor}`}>
                            {integrityScore}
                            <span className="text-sm text-slate-500 font-normal">/100</span>
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {violationIcons.length > 0 ? (
                            violationIcons
                        ) : (
                            isCompleted ? <span className="material-symbols-outlined text-emerald-500/50" title="No issues detected">check_circle</span> : null
                        )}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-xl">
                <div
                    className={`h-full w-full bg-gradient-to-r ${hoverGradient} opacity-0 transition-opacity group-hover:opacity-100`}
                ></div>
            </div>
        </div>
    );
}
