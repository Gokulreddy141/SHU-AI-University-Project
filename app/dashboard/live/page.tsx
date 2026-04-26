"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLiveMonitor } from "@/hooks/useLiveMonitor";
import LiveFeedCard from "@/components/features/LiveFeedCard";
import LiveFeedCardSkeleton from "@/components/features/LiveFeedCardSkeleton";
import LiveMonitorModal from "@/components/features/LiveMonitorModal";
import { LiveSessionFeed } from "@/types/reports";
import { isCriticalViolation } from "@/lib/proctoring";

type SortMode = "risk" | "violations" | "alphabetical";

function LatencyBadge({ ms }: { ms: number | null }) {
    if (ms === null) return (
        <span className="text-[10px] font-mono text-slate-600">LATENCY: --</span>
    );
    const color = ms < 100 ? "text-green-400" : ms < 500 ? "text-amber-400" : "text-red-400";
    return (
        <span className={`text-[10px] font-mono ${color}`}>LATENCY: {ms}ms</span>
    );
}

export default function LiveWarRoomPage() {
    const router = useRouter();
    const { feeds, activeCount, loading, error, latencyMs } = useLiveMonitor();

    const [monitoredSession, setMonitoredSession] = useState<LiveSessionFeed | null>(null);
    const [search, setSearch] = useState("");
    const [sortMode, setSortMode] = useState<SortMode>("risk");
    const [focusMode, setFocusMode] = useState(false);
    const notifiedIds = useRef<Set<string>>(new Set());

    // Auth guard
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) router.push("/auth");
    }, [router]);

    // Browser push notifications for new critical violations
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        feeds.forEach(feed => {
            if (
                feed.status === "flagged" &&
                feed.activeViolation &&
                isCriticalViolation(feed.activeViolation.type) &&
                !notifiedIds.current.has(feed.id + feed.activeViolation.type)
            ) {
                notifiedIds.current.add(feed.id + feed.activeViolation.type);
                if (Notification.permission === "granted") {
                    new Notification("⚠ Critical Violation", {
                        body: `${feed.candidateName} · ${feed.activeViolation.type.replace(/_/g, " ")}`,
                        icon: "/icon.svg",
                    });
                }
                // In-tab audio beep
                try {
                    const ctx = new AudioContext();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 880;
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.4);
                } catch { /* audio not available */ }
            }
        });
    }, [feeds]);

    // Sorted + filtered feeds
    const displayFeeds = useMemo(() => {
        let result = [...feeds];

        // Search filter
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(f => f.candidateName.toLowerCase().includes(q));
        }

        // Focus mode: hide clean sessions
        if (focusMode) {
            result = result.filter(f => f.status === "flagged");
        }

        // Sort
        result.sort((a, b) => {
            if (sortMode === "risk") {
                const riskScore = (f: LiveSessionFeed) => {
                    if (f.status === "flagged" && f.activeViolation && isCriticalViolation(f.activeViolation.type)) return 2;
                    if (f.status === "flagged") return 1;
                    return 0;
                };
                return riskScore(b) - riskScore(a);
            }
            if (sortMode === "violations") {
                return (b.totalViolations ?? 0) - (a.totalViolations ?? 0);
            }
            // alphabetical
            return a.candidateName.localeCompare(b.candidateName);
        });

        return result;
    }, [feeds, search, sortMode, focusMode]);

    // Derived counts using proper type check
    const criticalCount = feeds.filter(f =>
        f.status === "flagged" && f.activeViolation && isCriticalViolation(f.activeViolation.type)
    ).length;
    const suspiciousCount = feeds.filter(f =>
        f.status === "flagged" && (!f.activeViolation || !isCriticalViolation(f.activeViolation.type))
    ).length;
    const cleanCount = feeds.filter(f => f.status === "active").length;

    const handleJoin = useCallback((feed: LiveSessionFeed) => {
        setMonitoredSession(feed);
    }, []);

    return (
        <>
            {monitoredSession && (
                <LiveMonitorModal
                    sessionId={monitoredSession.id}
                    candidateName={monitoredSession.candidateName}
                    examTitle={monitoredSession.examCode}
                    initialSnapshot={monitoredSession.snapshot}
                    allFeeds={displayFeeds}
                    onNavigate={setMonitoredSession}
                    onClose={() => setMonitoredSession(null)}
                />
            )}

            <div className="flex flex-col h-full w-full bg-[#0f0f0f]">
                {/* Header */}
                <header className="flex-none sticky top-0 z-20 flex h-auto min-h-16 w-full items-center justify-between border-b border-[#3b3b3b] bg-[#1a1a1a]/95 px-6 py-3 backdrop-blur gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <h2 className="text-lg font-bold text-white tracking-tight">War Room</h2>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                            {activeCount} ACTIVE
                        </span>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                        <div className="relative w-full">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[16px]">search</span>
                            <input
                                type="text"
                                placeholder="Search candidate..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-[#0f0f0f] border border-[#3b3b3b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/60"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sort + Focus Mode */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortMode}
                            onChange={e => setSortMode(e.target.value as SortMode)}
                            className="bg-[#0f0f0f] border border-[#3b3b3b] text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary/60"
                        >
                            <option value="risk">Sort: Risk</option>
                            <option value="violations">Sort: Violations</option>
                            <option value="alphabetical">Sort: A–Z</option>
                        </select>
                        <button
                            onClick={() => setFocusMode(f => !f)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                                focusMode
                                    ? "bg-red-500/20 border-red-500/50 text-red-400"
                                    : "bg-[#0f0f0f] border-[#3b3b3b] text-slate-400 hover:border-primary/40 hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                            {focusMode ? "Focus ON" : "Focus Mode"}
                        </button>
                        <div className="flex items-center gap-2 rounded-full bg-[#0f0f0f] border border-[#3b3b3b] px-3 py-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto-Proctoring</span>
                            <span className="h-2 w-2 rounded-full bg-[#60b38a]"></span>
                        </div>
                    </div>
                </header>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {error ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-[#e64d4d]">Connection lost: {error}</p>
                        </div>
                    ) : loading && feeds.length === 0 ? (
                        <LiveFeedCardSkeleton count={8} />
                    ) : displayFeeds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                            <span className="material-symbols-outlined text-4xl mb-3">videocam_off</span>
                            <p className="text-sm">{search ? "No candidates match your search." : focusMode ? "No flagged sessions right now." : "No active sessions."}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {displayFeeds.map(feed => (
                                <LiveFeedCard
                                    key={feed.id}
                                    session={feed}
                                    onJoin={() => handleJoin(feed)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="flex-none h-12 border-t border-[#3b3b3b] bg-[#1a1a1a] px-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#60b38a]"></span>
                            <span className="text-[10px] font-mono text-slate-400">{cleanCount} CLEAN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            <span className="text-[10px] font-mono text-slate-400">{suspiciousCount} SUSPICIOUS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#e64d4d]"></span>
                            <span className="text-[10px] font-mono text-slate-400">{criticalCount} CRITICAL</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="material-symbols-outlined text-sm">wifi</span>
                            <LatencyBadge ms={latencyMs} />
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
