"use client";
import { useState } from "react";

interface SettingsUpdatePayload {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    department?: string;
}

export const useSettings = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const updateSettings = async (payload: SettingsUpdatePayload) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) throw new Error("User not authenticated");
            const user = JSON.parse(storedUser);

            const res = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user._id,
                    "x-user-role": user.role
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update settings");
            }

            // Sync localStorage
            localStorage.setItem("user", JSON.stringify(data.user));
            setSuccess(true);
            return data.user;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateSettings,
        loading,
        error,
        success,
        setError,
        setSuccess
    };
};
