"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
    const router = useRouter();
    const [userName, setUserName] = useState("Recruiter");

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            // Use setTimeout to avoid synchronous setState in effect
            if (parsed.name) setTimeout(() => setUserName(parsed.name), 0);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/auth");
    };

    return (
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#3b3b3b] bg-[#1a1a1a]/95 px-6 backdrop-blur">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-lg font-bold text-white tracking-tight">Overview</h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden sm:block w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                        search
                    </span>
                    <input
                        className="h-10 w-full rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        placeholder="Search candidates, exams..."
                        type="text"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] text-slate-400 hover:bg-[#262626] hover:text-white transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-[#0f0f0f]"></span>
                    </button>

                    <div className="h-10 w-10 overflow-hidden rounded-full border border-[#3b3b3b] bg-[#262626] flex items-center justify-center text-white font-bold cursor-pointer group" onClick={handleLogout} title="Click to logout">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}
