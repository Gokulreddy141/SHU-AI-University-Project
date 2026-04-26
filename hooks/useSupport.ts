"use client";
import { useState, useCallback } from "react";
import { CreateSupportTicketPayload, FAQItem } from "@/types/support";

export const useSupport = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [faqs, setFaqs] = useState<FAQItem[]>([]);

    const fetchFaqs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/support/faq");
            if (!res.ok) throw new Error("Failed to load FAQs");
            const data = await res.json();
            setFaqs(data.items);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const submitTicket = async (payload: CreateSupportTicketPayload) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const storedUser = localStorage.getItem("user");
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (storedUser) {
                const user = JSON.parse(storedUser);
                headers["x-user-id"] = user._id;
                headers["x-user-role"] = user.role;
            }

            const res = await fetch("/api/support/ticket", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit ticket");
            }

            setSuccess(true);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        submitTicket,
        fetchFaqs,
        faqs,
        loading,
        error,
        success,
        setError,
        setSuccess
    };
};
