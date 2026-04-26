"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SearchResult {
    candidates: { _id: string; name: string; email: string }[];
    exams: { _id: string; title: string; sessionCode: string; status: string }[];
}

interface Notification {
    id: string;
    type: "flagged_session" | "violation";
    title: string;
    body: string;
    time: string;
    severity: "critical" | "warning";
    href: string;
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// Derive a readable page title from the current route
function usePageTitle() {
    const pathname = usePathname();
    if (!pathname) return "Dashboard";
    const segments = pathname.split("/").filter(Boolean);

    // dashboard/session/[id] or dashboard/report/[id] → show generic label
    if (segments.includes("session")) return "Live Session";
    if (segments.includes("report")) return "Report";
    if (segments.includes("questions")) return "Questions";
    if (segments.includes("exam") && segments.length > 2) return "Exam";

    const last = segments[segments.length - 1];
    if (!last || last === "dashboard") return "Overview";

    // If last segment looks like a MongoDB ObjectId (24 hex chars), go one level up
    if (/^[a-f0-9]{24}$/i.test(last)) {
        const parent = segments[segments.length - 2] || "dashboard";
        return parent.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    return last
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function Header() {
    const router = useRouter();
    const pageTitle = usePageTitle();

    const [user, setUser] = useState<{ _id: string; name: string } | null>(null);

    // ── Search state ──
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Notification state ──
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifRead, setNotifRead] = useState<Set<string>>(new Set());
    const [notifLoading, setNotifLoading] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            setTimeout(() => setUser(parsed), 0);
        }
    }, []);

    // ── Fetch notifications ──
    const fetchNotifications = useCallback(async (userId: string) => {
        setNotifLoading(true);
        try {
            const res = await fetch(`/api/notifications?recruiterId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } finally {
            setNotifLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user?._id) return;
        fetchNotifications(user._id);
        // Re-poll every 60s
        const interval = setInterval(() => fetchNotifications(user._id), 60000);
        return () => clearInterval(interval);
    }, [user, fetchNotifications]);

    // ── Debounced search ──
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults(null);
            setSearchOpen(false);
            return;
        }
        searchTimer.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const params = new URLSearchParams({ q: searchQuery });
                if (user?._id) params.set("recruiterId", user._id);
                const res = await fetch(`/api/search?${params}`);
                if (res.ok) {
                    const data: SearchResult = await res.json();
                    setSearchResults(data);
                    setSearchOpen(true);
                }
            } finally {
                setSearchLoading(false);
            }
        }, 300);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [searchQuery, user]);

    // ── Close dropdowns on outside click ──
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const unreadCount = notifications.filter((n) => !notifRead.has(n.id)).length;

    const handleNotifOpen = () => {
        setNotifOpen((v) => !v);
        setSearchOpen(false);
    };

    const markAllRead = () => {
        setNotifRead(new Set(notifications.map((n) => n.id)));
    };

    const handleNotifClick = (n: Notification) => {
        setNotifRead((prev) => new Set([...prev, n.id]));
        setNotifOpen(false);
        router.push(n.href);
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/auth");
    };

    const hasResults =
        searchResults &&
        (searchResults.candidates.length > 0 || searchResults.exams.length > 0);

    return (
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#3b3b3b] bg-[#1a1a1a]/95 px-6 backdrop-blur">
            {/* Left — page title */}
            <div className="flex items-center gap-4">
                <button className="md:hidden text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-lg font-bold text-white tracking-tight">{pageTitle}</h2>
            </div>

            {/* Right — search + notifications + avatar */}
            <div className="flex items-center gap-4">

                {/* ── Search ── */}
                <div ref={searchRef} className="relative hidden sm:block w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                        search
                    </span>
                    {searchLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </span>
                    )}
                    <input
                        className="h-10 w-full rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        placeholder="Search candidates, exams..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (hasResults) setSearchOpen(true); }}
                    />

                    {/* Search dropdown */}
                    {searchOpen && (
                        <div className="absolute top-12 left-0 w-full bg-[#1a1a1a] border border-[#3b3b3b] rounded-xl shadow-2xl overflow-hidden z-50">
                            {!hasResults ? (
                                <p className="px-4 py-3 text-sm text-slate-500">No results for &quot;{searchQuery}&quot;</p>
                            ) : (
                                <>
                                    {searchResults!.candidates.length > 0 && (
                                        <div>
                                            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Candidates</p>
                                            {searchResults!.candidates.map((c) => (
                                                <button
                                                    key={c._id}
                                                    className="flex w-full items-center gap-3 px-4 py-2 hover:bg-[#262626] transition-colors text-left"
                                                    onClick={() => {
                                                        setSearchOpen(false);
                                                        setSearchQuery("");
                                                        router.push(`/dashboard/candidates`);
                                                    }}
                                                >
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white truncate">{c.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{c.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searchResults!.exams.length > 0 && (
                                        <div className={searchResults!.candidates.length > 0 ? "border-t border-[#3b3b3b]" : ""}>
                                            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Exams</p>
                                            {searchResults!.exams.map((e) => (
                                                <button
                                                    key={e._id}
                                                    className="flex w-full items-center gap-3 px-4 py-2 hover:bg-[#262626] transition-colors text-left"
                                                    onClick={() => {
                                                        setSearchOpen(false);
                                                        setSearchQuery("");
                                                        router.push(`/dashboard/exam/${e._id}/questions`);
                                                    }}
                                                >
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#262626] border border-[#3b3b3b]">
                                                        <span className="material-symbols-outlined text-slate-400 text-[16px]">quiz</span>
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white truncate">{e.title}</p>
                                                        <p className="text-xs text-slate-500">{e.sessionCode} · {e.status}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Notifications ── */}
                <div ref={notifRef} className="relative">
                    <button
                        onClick={handleNotifOpen}
                        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] text-slate-400 hover:bg-[#262626] hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-[#0f0f0f]">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-12 w-80 bg-[#1a1a1a] border border-[#3b3b3b] rounded-xl shadow-2xl z-50 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3b3b3b]">
                                <span className="text-sm font-semibold text-white">Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Body */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="inline-block h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
                                        <span className="material-symbols-outlined text-3xl">notifications_none</span>
                                        <p className="text-sm">All caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => {
                                        const isUnread = !notifRead.has(n.id);
                                        return (
                                            <button
                                                key={n.id}
                                                onClick={() => handleNotifClick(n)}
                                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#262626] border-b border-[#2a2a2a] last:border-b-0 ${isUnread ? "bg-[#1f1f1f]" : ""}`}
                                            >
                                                <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${n.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {n.type === "flagged_session" ? "flag" : "warning"}
                                                    </span>
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-xs font-semibold truncate ${n.severity === "critical" ? "text-red-400" : "text-amber-400"}`}>
                                                            {n.title}
                                                        </p>
                                                        {isUnread && (
                                                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary mt-1" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                                                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.time)}</p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="border-t border-[#3b3b3b] px-4 py-2">
                                    <button
                                        onClick={() => { setNotifOpen(false); router.push("/dashboard/reports"); }}
                                        className="w-full text-center text-xs text-primary hover:text-primary/80 transition-colors py-1"
                                    >
                                        View all reports →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Avatar / Logout ── */}
                <div
                    className="h-10 w-10 overflow-hidden rounded-full border border-[#3b3b3b] bg-[#262626] flex items-center justify-center text-white font-bold cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={handleLogout}
                    title={`Logged in as ${user?.name || "Recruiter"} — click to logout`}
                >
                    {(user?.name || "R").charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
