"use client";
import React from "react";
import { LiveSessionFeed } from "@/types/reports";

interface LiveFeedCardProps {
    session: LiveSessionFeed;
    onIntervene: (id: string) => void;
    onJoin: (id: string) => void;
}

export default function LiveFeedCard({ session, onIntervene, onJoin }: LiveFeedCardProps) {
    if (session.status === "loading") {
        return (
            <div className="group relative aspect-video rounded-lg border border-[#3b3b3b] bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[#0f0f0f] opacity-10"></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-slate-600 text-3xl">videocam_off</span>
                    <p className="text-[10px] font-mono text-slate-600 uppercase">Feed Loading...</p>
                </div>
            </div>
        );
    }

    // Determine visual states based on flags
    const isCritical = session.status === "flagged" && session.activeViolation?.message.includes("Critical");
    const isWarning = session.status === "flagged" && !isCritical;
    const isClean = session.status === "active";

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

            {/* Camera Feed Background — live snapshot from candidate webcam */}
            {session.snapshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    alt="Candidate Live Feed"
                    className={`h-full w-full object-cover transition-opacity ${isClean ? 'opacity-70 group-hover:opacity-100' : 'opacity-85'}`}
                    src={`data:image/jpeg;base64,${session.snapshot}`}
                />
            ) : session.candidateAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    alt="Candidate"
                    className={`h-full w-full object-cover transition-opacity ${isClean ? 'opacity-60 group-hover:opacity-100' : 'opacity-80'}`}
                    src={session.candidateAvatar}
                />
            ) : (
                <div className="w-full h-full bg-[#0f0f0f] flex flex-col items-center justify-center gap-2 font-mono text-[10px] text-slate-600">
                    <span className="material-symbols-outlined text-3xl">videocam_off</span>
                    <span>No feed yet</span>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent"></div>

            {/* Critical Red Fade Overlay */}
            {isCritical && (
                <div className="absolute inset-0 bg-[#e64d4d]/10 ring-2 ring-inset ring-[#e64d4d]"></div>
            )}

            {/* Top Left Violation Badge */}
            {session.activeViolation && (
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                    <div className={`
                        backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1.5
                        ${isCritical ? 'bg-[#e64d4d] border border-[#e64d4d]/50 text-white' : 'bg-amber-500/80 border border-amber-400 text-black'}
                    `}>
                        <span className="material-symbols-outlined text-[14px]">
                            {isCritical ? "warning" : "face_retouching_off"}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">
                            {session.activeViolation.type}
                        </span>
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                <div>
                    <p className={`text-xs font-bold leading-none ${isClean && !session.candidateAvatar ? 'text-white/50' : 'text-white'}`}>
                        {session.candidateName}
                    </p>
                    {session.candidateAvatar && (
                        <p className={`text-[10px] font-mono mt-1 uppercase tracking-tighter ${isCritical ? 'text-slate-300' : 'text-slate-400'}`}>
                            {session.examCode}
                        </p>
                    )}
                </div>

                {isCritical ? (
                    <button
                        onClick={() => onIntervene(session.id)}
                        className="bg-[#e64d4d] border border-[#e64d4d] text-white px-2 py-1 rounded text-[10px] font-bold"
                    >
                        INTERVENE
                    </button>
                ) : (
                    <button
                        onClick={() => onJoin(session.id)}
                        className={`
                            border px-2 py-1 rounded text-[10px] font-bold transition-colors
                            ${!session.candidateAvatar
                                ? 'bg-primary/10 border-primary/40 text-primary/50'
                                : 'bg-primary/10 border-primary/40 text-primary hover:bg-primary hover:text-white'}
                        `}
                    >
                        JOIN
                    </button>
                )}
            </div>
        </div>
    );
}
