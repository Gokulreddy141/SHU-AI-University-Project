"use client";
import React, { useState } from "react";
import { useSettings } from "@/hooks/useSettings";

interface SettingsFormProps {
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
        department?: string;
    };
}

export default function SettingsForm({ user }: SettingsFormProps) {
    const { updateSettings, loading, error, success, setError, setSuccess } = useSettings();
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        department: user.department || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
        if (success) setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        const payload: {
            name: string;
            email: string;
            department?: string;
            currentPassword?: string;
            newPassword?: string;
        } = {
            name: formData.name,
            email: formData.email,
        };

        if (user.role === "recruiter") {
            payload.department = formData.department;
        }

        if (formData.newPassword) {
            payload.currentPassword = formData.currentPassword;
            payload.newPassword = formData.newPassword;
        }

        const updated = await updateSettings(payload);
        if (updated) {
            setFormData(prev => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
            {/* Profile Section */}
            <div className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#3b3b3b] pb-4">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <h3 className="text-lg font-bold text-white">Profile Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                    </div>
                    {user.role === "recruiter" && (
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Engineering, HR, etc."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#3b3b3b] pb-4">
                    <span className="material-symbols-outlined text-primary">security</span>
                    <h3 className="text-lg font-bold text-white">Security & Password</h3>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Required to change password"
                            className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full bg-[#0a0a0a] border border-[#3b3b3b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Settings saved successfully!
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Saving Changes..." : "Save All Changes"}
                </button>
            </div>
        </form>
    );
}
