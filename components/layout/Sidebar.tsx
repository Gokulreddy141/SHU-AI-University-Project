"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export default function Sidebar() {
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            const user = JSON.parse(stored);
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setRole(user.role), 0);
        }
    }, []);

    const isActive = (path: string) => {
        const isMatch = pathname === path || pathname?.startsWith(`${path}/`);
        return isMatch
            ? "bg-primary/20 border-primary/30 text-primary border"
            : "text-slate-400 hover:bg-surface-hover hover:text-slate-200 border border-transparent";
    };

    const recruiterLinks = [
        { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
        { label: "Candidates", icon: "group", href: "/dashboard/candidates" },
        { label: "Exams", icon: "assignment", href: "/dashboard/exams" },
        { label: "Reports", icon: "monitoring", href: "/dashboard/reports" },
        { label: "Live Sessions", icon: "videocam", href: "/dashboard/live" },
        { label: "AI Audit", icon: "science", href: "/dashboard/audit" },
    ];

    const candidateLinks = [
        { label: "My Exams", icon: "assignment_ind", href: "/candidate/dashboard" },
        { label: "Verification", icon: "verified_user", href: "/candidate/verify" },
    ];

    const links = role === "recruiter" ? recruiterLinks : candidateLinks;
    const settingsHref = role === "recruiter" ? "/dashboard/settings" : "/candidate/settings";

    return (
        <aside className="hidden w-64 flex-col border-r border-[#3b3b3b] bg-[#1a1a1a] md:flex">
            <div className="flex h-16 items-center gap-3 px-6 border-b border-[#3b3b3b]">
                <Logo size={32} />
                <div>
                    <h1 className="text-base font-bold text-white leading-none">InterviewIntegrity</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">
                        {role === "recruiter" ? "Recruiter Portal" : "Candidate Portal"}
                    </p>
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-between px-4 py-8">
                <nav className="flex flex-col gap-1.5">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${isActive(
                                link.href
                            )}`}
                        >
                            <span className="material-symbols-outlined text-xl">{link.icon}</span>
                            <span className="text-sm font-semibold tracking-tight">{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="flex flex-col gap-1.5 border-t border-[#3b3b3b] pt-6">
                    <Link
                        href={settingsHref}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${isActive(
                            settingsHref
                        )}`}
                    >
                        <span className="material-symbols-outlined text-xl">settings</span>
                        <span className="text-sm font-semibold tracking-tight">Settings</span>
                    </Link>
                    <Link
                        href="/support"
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${isActive(
                            "/support"
                        )}`}
                    >
                        <span className="material-symbols-outlined text-xl">help</span>
                        <span className="text-sm font-semibold tracking-tight">Support</span>
                    </Link>
                </div>
            </div>
        </aside>
    );
}
