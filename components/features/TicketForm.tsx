"use client";
import React, { useState, useEffect } from "react";
import { useSupport } from "@/hooks/useSupport";

export default function TicketForm() {
    const { submitTicket, loading, error, success, setError, setSuccess } = useSupport();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        category: "Technical",
        priority: "Medium",
        publicEmail: ""
    });

    useEffect(() => {
        const user = localStorage.getItem("user");
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => setIsAuthenticated(!!user), 0);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
        if (success) setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated && !formData.publicEmail) {
            setError("Please provide an email address so we can contact you.");
            return;
        }

        const success = await submitTicket(formData);
        if (success) {
            setFormData({
                subject: "",
                message: "",
                category: "Technical",
                priority: "Medium",
                publicEmail: ""
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#3b3b3b] pb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">mail</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Send a Message</h3>
                    <p className="text-xs text-slate-500 font-medium">We&apos;ll get back to you within 24 hours.</p>
                </div>
            </div>

            <div className="space-y-6">
                {!isAuthenticated && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Email</label>
                        <input
                            type="email"
                            name="publicEmail"
                            value={formData.publicEmail}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                            required
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="Technical">Technical Issue</option>
                            <option value="Billing">Billing & Plans</option>
                            <option value="Account">Account Security</option>
                            <option value="Other">General Inquiry</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</label>
                    <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What can we help you with?"
                        className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message</label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Describe your issue in detail..."
                        className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all resize-none"
                        required
                    />
                </div>
            </div>

            {/* Status Feedback */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Your ticket has been submitted. We&apos;ll be in touch soon!
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <span className="material-symbols-outlined text-xl">send</span>
                        Submit Request
                    </>
                )}
            </button>
        </form>
    );
}
