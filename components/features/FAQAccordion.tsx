"use client";
import React, { useState } from "react";
import { FAQItem } from "@/types/support";

interface FAQAccordionProps {
    faqs: FAQItem[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="space-y-4">
            {faqs.map((faq) => (
                <div
                    key={faq.id}
                    className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] transition-colors hover:border-white/20"
                >
                    <button
                        onClick={() => toggle(faq.id)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left group"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">
                                {faq.category}
                            </span>
                            <span className="text-white font-bold tracking-tight group-hover:text-primary-light transition-colors">
                                {faq.question}
                            </span>
                        </div>
                        <span className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${openId === faq.id ? "rotate-180" : ""}`}>
                            expand_more
                        </span>
                    </button>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openId === faq.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="px-6 pb-6 pt-2 text-slate-400 text-sm leading-relaxed border-t border-white/5">
                            {faq.answer}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
