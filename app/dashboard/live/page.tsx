"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveMonitor } from "@/hooks/useLiveMonitor";
import LiveFeedCard from "@/components/features/LiveFeedCard";
import LiveFeedCardSkeleton from "@/components/features/LiveFeedCardSkeleton";
import LiveMonitorModal from "@/components/features/LiveMonitorModal";
import { LiveSessionFeed } from "@/types/reports";

export default function LiveWarRoomPage() {
    const router = useRouter();
    const { feeds, activeCount, loading, error } = useLiveMonitor();

    // The session currently open in the monitor modal (null = War Room grid view)
    const [monitoredSession, setMonitoredSession] = useState<LiveSessionFeed | null>(null);

    // Auth guard
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
    }, [router]);

    const handleJoin = (feed: LiveSessionFeed) => {
        setMonitoredSession(feed);
    };

    const handleIntervene = (feed: LiveSessionFeed) => {
        // Intervene goes straight to full session page
        router.push(`/dashboard/session/${feed.id}`);
    };

    return (
        <>
            {/* ── Live Monitor Modal (full-screen overlay) ── */}
            {monitoredSession && (
                <LiveMonitorModal
                    sessionId={monitoredSession.id}
                    candidateName={monitoredSession.candidateName}
                    examTitle={monitoredSession.examCode}
                    initialSnapshot={monitoredSession.snapshot}
                    onClose={() => setMonitoredSession(null)}
                />
            )}

            <div className="flex flex-col h-full w-full bg-[#0f0f0f]">
                {/* War Room Local Header */}
                <header className="flex-none sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#3b3b3b] bg-[#1a1a1a]/95 px-6 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <h2 className="text-lg font-bold text-white tracking-tight">War Room: Active Monitoring</h2>
                        </div>
                        <div className="h-4 w-px bg-[#3b3b3b] mx-2"></div>
                        <p className="text-sm font-mono text-slate-500">ACTIVE_SESSIONS: {activeCount}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 rounded-full bg-[#0f0f0f] border border-[#3b3b3b] px-3 py-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto-Proctoring</span>
                            <span className="h-2 w-2 rounded-full bg-[#60b38a]"></span>
                        </div>
                    </div>
                </header>

                {/* War Room Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {error ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-[#e64d4d]">Connection lost: {error}</p>
                        </div>
                    ) : loading && feeds.length === 0 ? (
                        <LiveFeedCardSkeleton count={8} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {feeds.map(feed => (
                                <LiveFeedCard
                                    key={feed.id}
                                    session={feed}
                                    onIntervene={() => handleIntervene(feed)}
                                    onJoin={() => handleJoin(feed)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* War Room Footer StatusBar */}
                <footer className="flex-none h-12 border-t border-[#3b3b3b] bg-[#1a1a1a] px-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#60b38a]"></span>
                            <span className="text-[10px] font-mono text-slate-400">
                                {feeds.filter(f => f.status === "active").length} CLEAN
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            <span className="text-[10px] font-mono text-slate-400">
                                {feeds.filter(f => f.status === "flagged" && f.activeViolation?.message.includes("Moderate")).length} SUSPICIOUS
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#e64d4d]"></span>
                            <span className="text-[10px] font-mono text-slate-400">
                                {feeds.filter(f => f.status === "flagged" && f.activeViolation?.message.includes("Critical")).length} VIOLATION
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="material-symbols-outlined text-sm">wifi</span>
                            <span className="text-[10px] font-mono">LATENCY: 24ms</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="material-symbols-outlined text-sm">database</span>
                            <span className="text-[10px] font-mono">UPLINK: ACTIVE</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
