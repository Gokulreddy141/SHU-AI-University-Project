"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export function useAuth(requiredRole?: "recruiter" | "candidate") {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");

        if (!stored) {
            router.push("/auth");
            return;
        }

        try {
            const parsed = JSON.parse(stored);

            if (requiredRole && parsed.role !== requiredRole) {
                // Redirect if wrong role
                if (parsed.role === "recruiter") {
                    router.push("/dashboard");
                } else {
                    router.push("/candidate/verify");
                }
                return;
            }

            setUser(parsed);
        } catch (e) {
            console.error("Failed to parse user session", e);
            router.push("/auth");
        } finally {
            setIsHydrated(true);
        }
    }, [router, requiredRole]);

    return { user, isHydrated };
}
