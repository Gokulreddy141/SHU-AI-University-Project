"use client";

import { useLiveInterview } from "@/hooks/useLiveInterview";
import { LiveInterviewRoom } from "@/components/features/LiveInterviewRoom";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function RecruiterInterviewPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    const { token, loading, error } = useLiveInterview(sessionId);
    const [notes, setNotes] = useState("");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-950">
                <div className="text-gray-400">Loading interview room...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>Failed to join room: {error}</p>
            </div>
        );
    }

    if (!token) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-950 text-white">
            {/* Split layout: Video on left, Recruiter Tools on right */}
            <div className="flex-1 p-4 flex flex-col relative">
                <header className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">1-on-1 Interview</h1>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 transition rounded text-sm font-semibold">
                        End Interview
                    </button>
                </header>

                <div className="flex-1 w-full bg-black rounded-xl border border-gray-800 shadow-xl overflow-hidden min-h-[500px]">
                    <LiveInterviewRoom token={token} />
                </div>
            </div>

            {/* Side Panel for Note Taking & AI Flags */}
            <div className="w-[350px] border-l border-gray-800 bg-gray-900 p-4 flex flex-col">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Interview Notes</h2>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex-1 w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded p-3 text-sm resize-none outline-none transition-all placeholder-gray-600"
                    placeholder="Take notes here... (Not visible to candidate)"
                />

                <div className="mt-4">
                    <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 transition rounded font-semibold text-sm shadow-md">
                        Save Notes
                    </button>
                </div>
            </div>
        </div>
    );
}
