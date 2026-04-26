"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SettingsForm from "@/components/features/SettingsForm";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
}

export default function RecruiterSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
        const parsed = JSON.parse(stored);
        if (parsed.role !== "recruiter") {
            router.push("/candidate/dashboard");
            return;
        }
        queueMicrotask(() => setUser(parsed));
    }, [router]);

    if (!user) return null;

    return (
        <div className="p-6 md:p-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-slate-400">Manage your recruiter profile and department preferences.</p>
            </div>

            <SettingsForm user={user} />
        </div>
    );
}
