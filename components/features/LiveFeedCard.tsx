"use client";
import React, { useState, useEffect } from "react";
import { LiveSessionFeed } from "@/types/reports";
import { isCriticalViolation } from "@/lib/proctoring";

interface LiveFeedCardProps {
    session: LiveSessionFeed;
    onJoin: () => void;
}

function useElapsed(startedAt?: string | null): string {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        if (!startedAt) return;
        const start = new Date(startedAt).getTime();
        const tick = () => {
            const s = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            setElapsed(
                h > 0
                    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
                    : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
            );
        };
        tick();
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [startedAt]);

    return elapsed;
}

export default function LiveFeedCard({ session, onJoin }: LiveFeedCardProps) {
    const elapsed = useElapsed(session.startedAt);

    if (session.status === "loading") {
        return (
            <div className="group relative aspect-video rounded-lg border border-[#3b3b3b] bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-slate-600 text-3xl">videocam_off</span>
                    <p className="text-[10px] font-mono text-slate-600 uppercase">Feed Loading...</p>
                </div>
            </div>
        );
    }

    const isCritical = session.status === "flagged" &&
        !!session.activeViolation &&
        isCriticalViolation(session.activeViolation.type);
    const isWarning = session.status === "flagged" && !isCritical;

    let borderClass = "border-[#3b3b3b] hover:border-primary/50";
    let pulseClass = "";
    if (isCritical) {
        borderClass = "border-[#e64d4d]";
        pulseClass = "animate-[pulse-red_2s_cubic-bezier(0.4,0,0.6,1)_infinite]";
    } else if (isWarning) {
        borderClass = "border-amber-500/50 hover:border-amber-500";
    }

    return (
        <div className={`group relative aspect-video rounded-lg border bg-[#1a1a1a] overflow-hidden transition-all ${borderClass} ${pulseClass}`}>

            {/* Camera snapshot */}
            {session.snapshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    alt="Candidate Live Feed"
                    className="h-full w-full object-cover transition-opacity opacity-80 group-hover:opacity-100"
                    src={`data:image/jpeg;base64,${session.snapshot}`}
                />
            ) : session.candidateAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    alt="Candidate"
                    className="h-full w-full object-cover opacity-60 group-hover:opacity-90"
                    src={session.candidateAvatar}
                />
            ) : (
                <div className="w-full h-full bg-[#0f0f0f] flex flex-col items-center justify-center gap-2 font-mono text-[10px] text-slate-600">
                    <span className="material-symbols-outlined text-3xl">videocam_off</span>
                    <span>No feed yet</span>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

            {/* Critical overlay */}
            {isCritical && (
                <div className="absolute inset-0 bg-[#e64d4d]/10 ring-2 ring-inset ring-[#e64d4d]" />
            )}

            {/* Violation badge + session timer (top) */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
                {session.activeViolation ? (
                    <div className={`backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1.5 max-w-[70%] ${
                        isCritical
                            ? "bg-[#e64d4d] border border-[#e64d4d]/50 text-white"
                            : "bg-amber-500/80 border border-amber-400 text-black"
                    }`}>
                        <span className="material-symbols-outlined text-[13px]">
                            {isCritical ? "warning" : "face_retouching_off"}
                        </span>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-tighter truncate">
                            {session.activeViolation.type.replace(/_/g, " ")}
                        </span>
                    </div>
                ) : <div />}

                {/* Session timer */}
                {elapsed && (
                    <span className="text-[9px] font-mono bg-black/60 text-slate-300 px-1.5 py-0.5 rounded">
                        {elapsed}
                    </span>
                )}
            </div>

            {/* Bottom: name + violations + JOIN button */}
            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between z-10">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-white leading-none truncate">{session.candidateName}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5 uppercase tracking-tighter truncate">{session.examCode}</p>
                    {(session.totalViolations ?? 0) > 0 && (
                        <p className="text-[9px] font-mono text-red-400 mt-0.5">
                            {session.totalViolations} violation{session.totalViolations !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
                <button
                    onClick={onJoin}
                    className={`ml-2 shrink-0 px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                        isCritical
                            ? "bg-[#e64d4d] border-[#e64d4d] text-white hover:bg-[#c94040]"
                            : "bg-primary/10 border-primary/40 text-primary hover:bg-primary hover:text-white"
                    }`}
                >
                    {isCritical ? "INTERVENE" : "JOIN"}
                </button>
            </div>
        </div>
    );
}
