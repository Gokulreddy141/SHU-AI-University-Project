"use client";
import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import SupportHero from "@/components/features/SupportHero";
import Link from "next/link";

export default function SupportPage() {
    const categories = [
        {
            title: "Getting Started",
            desc: "Learn the basics of setting up your first exam or profile.",
            icon: "rocket_launch",
            link: "/support/faq",
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            title: "Technical Issues",
            desc: "Camera, microphone, and browser compatibility troubleshooting.",
            icon: "precision_manufacturing",
            link: "/support/faq",
            color: "text-primary",
            bg: "bg-primary/10"
        },
        {
            title: "Security & Privacy",
            desc: "How we protect your data and ensure integrity.",
            icon: "gpp_good",
            link: "/support/faq",
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
        }
    ];

    return (
        <DashboardShell userName="Guest" userRole="guest">
            <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <SupportHero />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {categories.map((cat) => (
                        <Link
                            key={cat.title}
                            href={cat.link}
                            className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <span className={`material-symbols-outlined text-3xl ${cat.color}`}>{cat.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{cat.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{cat.desc}</p>
                        </Link>
                    ))}
                </div>

                <div className="bg-[#1a1a1a] rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                    <div className="max-w-md text-center md:text-left">
                        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Still need help?</h2>
                        <p className="text-slate-400">Our dedicated support team is available to assist you with any custom requests or complex issues.</p>
                    </div>
                    <Link
                        href="/support/contact"
                        className="bg-white text-black font-black px-12 py-5 rounded-2xl hover:bg-slate-200 transition-all shadow-2xl active:scale-95"
                    >
                        Contact Human Support
                    </Link>
                </div>
            </div>
        </DashboardShell>
    );
}
