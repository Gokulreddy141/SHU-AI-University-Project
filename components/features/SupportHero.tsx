"use client";
import React from "react";
import Link from "next/link";

export default function SupportHero() {
    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 p-12 mb-12">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -ml-32 -mb-32" />

            <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-6">
                    <span className="h-1 w-8 rounded-full bg-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Support Center</span>
                </div>
                <h1 className="text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                    How can we <span className="text-primary italic">help</span> you today?
                </h1>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    Access tutorials, browse FAQs, or get in touch with our technical support team for real-time assistance.
                </p>

                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/support/faq"
                        className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl text-white font-bold transition-all flex items-center gap-3 group"
                    >
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">help</span>
                        Browse FAQs
                    </Link>
                    <Link
                        href="/support/contact"
                        className="bg-primary hover:bg-primary-dark px-8 py-4 rounded-2xl text-white font-bold transition-all flex items-center gap-3 shadow-xl shadow-primary/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined">contact_support</span>
                        Open a Ticket
                    </Link>
                </div>
            </div>
        </div>
    );
}
