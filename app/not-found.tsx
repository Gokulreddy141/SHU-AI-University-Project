"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        queueMicrotask(() => setMounted(true));
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements for aesthetic */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
                <div className="relative mb-8">
                    <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-600 drop-shadow-2xl select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 max-w-full mx-auto animate-pulse mix-blend-overlay">
                        <h1 className="text-9xl font-black text-white/10 select-none">
                            404
                        </h1>
                    </div>
                </div>

                <h2 className="text-3xl font-bold tracking-tight mb-4 text-gray-100">
                    Page Not Found
                </h2>

                <p className="text-gray-400 mb-10 text-lg leading-relaxed max-w-md mx-auto">
                    The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => router.back()}
                        className="px-8 py-3 rounded-lg font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                    >
                        Go Back
                    </button>

                    <Link
                        href="/"
                        className="px-8 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-200"
                    >
                        Return Home
                    </Link>
                </div>
            </div>

            {/* Decorative bottom grid */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />
            <div
                className="absolute bottom-0 inset-x-0 h-64 opacity-20 z-[-1]"
                style={{
                    backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to top, #4f46e5 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage: 'linear-gradient(to top, white, transparent)'
                }}
            />
        </div>
    );
}
