"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import SettingsForm from "@/components/features/SettingsForm";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export default function CandidateSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
        const parsed = JSON.parse(stored);
        if (parsed.role !== "candidate") {
            router.push("/dashboard");
            return;
        }
        queueMicrotask(() => setUser(parsed));
    }, [router]);

    if (!user) return null;

    return (
        <DashboardShell userName={user.name} userRole={user.role}>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Settings</h1>
                    <p className="text-slate-400">Manage your profile and account security.</p>
                </div>

                <SettingsForm user={user} />
            </div>
        </DashboardShell>
    );
}
