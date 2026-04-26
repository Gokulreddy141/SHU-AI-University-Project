import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f8f6f6] dark:bg-[#0f0f0f] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-primary/30">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-hidden bg-[#f8f6f6] dark:bg-[#0f0f0f]">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
