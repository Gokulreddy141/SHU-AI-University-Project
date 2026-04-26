"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

interface DashboardShellProps {
    children: React.ReactNode;
    userName?: string;
    userRole?: string;
}

export default function DashboardShell({
    children,
    userName = "User",
    userRole = "recruiter",
}: DashboardShellProps) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/auth");
    };

    return (
        <div className="flex h-screen bg-background text-white overflow-hidden">
            {/* Unified Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-white/10 z-40">
                    <div className="h-full px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Mobile Logo Only */}
                            <Link href="/" className="md:hidden flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-sm font-bold">II</div>
                            </Link>
                            <h2 className="text-sm font-semibold text-slate-400 md:hidden">InterviewIntegrity</h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <Link
                                href={userRole === "recruiter" ? "/dashboard/settings" : "/candidate/settings"}
                                className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2 hover:bg-white/5 p-2 rounded-xl transition-all group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white leading-tight group-hover:text-primary transition-colors">{userName}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{userRole}</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner group-hover:scale-105 transition-transform">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                                title="Sign out"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">logout</span>
                                <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
                    {/* Background mesh for premium feel */}
                    <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    <div className="p-6 md:p-10 relative z-10">{children}</div>
                </main>
            </div>
        </div>
    );
}
