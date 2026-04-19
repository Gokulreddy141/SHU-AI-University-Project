"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCandidates } from "@/hooks/useCandidates";
import CandidateTable from "@/components/features/CandidateTable";
import FilterBar from "@/components/features/FilterBar";
import BulkCandidateModal from "@/components/features/BulkCandidateModal";
import InviteCandidateModal from "@/components/features/InviteCandidateModal";

interface User {
    _id: string;
    name: string;
    role: string;
}

export default function CandidatesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    // Initialize the candidate API hook
    const {
        candidates,
        loading,
        page,
        totalPages,
        total,
        limit,
        setPage,
        searchQuery,
        setSearchQuery,
    } = useCandidates(user?._id);

    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    // Load user role
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
        const parsed = JSON.parse(stored);
        if (parsed.role !== "recruiter") {
            router.push("/candidate/verify");
            return;
        }
        queueMicrotask(() => setUser(parsed));
    }, [router]);

    const handleExport = () => {
        // Minimal client-side JSON to CSV builder
        if (!candidates.length) return;

        const headers = ["Name", "Email", "Department", "Total Exams", "Avg Integrity Score", "Status"];
        const rows = candidates.map(c => [
            `"${c.name}"`,
            `"${c.email}"`,
            `"${c.department || 'Unassigned'}"`,
            c.totalExams,
            `${c.avgIntegrity}%`,
            `"${c.status}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!user) return null;

    return (
        <div className="p-6 md:p-10 space-y-6 max-w-[1400px] mx-auto min-h-full">
            <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExportClick={handleExport}
                onInviteClick={() => setShowInviteModal(true)}
                onAddClick={() => setShowBulkModal(true)}
            />

            <CandidateTable
                candidates={candidates}
                loading={loading}
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
            />

            {showBulkModal && (
                <BulkCandidateModal
                    recruiterId={user._id}
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => setPage(1)}
                />
            )}

            {showInviteModal && (
                <InviteCandidateModal
                    recruiterId={user._id}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => setPage(1)}
                />
            )}
        </div>
    );
}
