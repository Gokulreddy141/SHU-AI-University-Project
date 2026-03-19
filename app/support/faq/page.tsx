"use client";
import React, { useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import FAQAccordion from "@/components/features/FAQAccordion";
import { useSupport } from "@/hooks/useSupport";
import Link from "next/link";

export default function FAQPage() {
    const { fetchFaqs, faqs, loading } = useSupport();

    useEffect(() => {
        fetchFaqs();
    }, [fetchFaqs]);

    return (
        <DashboardShell userName="Guest" userRole="guest">
            <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-xl">
                        <Link
                            href="/support"
                            className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4 hover:gap-4 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Back to Hub
                        </Link>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Frequently Asked Questions</h1>
                        <p className="text-slate-400 text-lg">Find quick answers to common questions about proctoring, exams, and account management.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12">
                        <FAQAccordion faqs={faqs} />

                        <div className="text-center p-12 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            <h3 className="text-white font-bold mb-2">Didn&apos;t find what you were looking for?</h3>
                            <p className="text-slate-500 text-sm mb-6">Our help desk is open 24/7 for technical inquiries.</p>
                            <Link
                                href="/support/contact"
                                className="text-primary font-bold hover:underline"
                            >
                                Submit a specific question →
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
