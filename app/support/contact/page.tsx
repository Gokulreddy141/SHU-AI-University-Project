"use client";
import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import TicketForm from "@/components/features/TicketForm";
import Link from "next/link";

export default function ContactPage() {
    return (
        <DashboardShell userName="Guest" userRole="guest">
            <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left Column: Context */}
                    <div className="space-y-8">
                        <div>
                            <Link
                                href="/support"
                                className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-6 hover:gap-4 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back to Hub
                            </Link>
                            <h1 className="text-5xl font-bold text-white tracking-tight leading-tight mb-6">
                                Get in <span className="text-primary italic">touch</span> with our team.
                            </h1>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Our technical engineers and account managers are available to help you troubleshoot issues or discuss platform features.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-emerald-400">speed</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Fast Response</h4>
                                    <p className="text-slate-500 text-sm">Average response time is under 4 hours for technical issues.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-blue-400">verified_user</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Human Only</h4>
                                    <p className="text-slate-500 text-sm">No chatbots. You&apos;ll always talk to a real product engineer.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <TicketForm />
                </div>
            </div>
        </DashboardShell>
    );
}
