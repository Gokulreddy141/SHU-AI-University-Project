"use client";

import { useLiveInterview } from "@/hooks/useLiveInterview";
import { LiveInterviewRoom } from "@/components/features/LiveInterviewRoom";
import { useParams } from "next/navigation";

export default function CandidateInterviewPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    const { token, loading, error } = useLiveInterview(sessionId);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-white text-xl animate-pulse">Preparing your interview room...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="bg-red-900/50 p-6 rounded-lg text-center">
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Access Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!token) return null;

    return (
        <div className="w-full h-screen bg-black text-white flex flex-col">
            <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10">
                <h1 className="text-lg font-semibold tracking-wide">Live Interview</h1>
                <div className="text-sm font-medium px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full">
                    Recording Active
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                <LiveInterviewRoom token={token} />
            </main>
        </div>
    );
}
