import React from "react";

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onExportClick: () => void;
    onAddClick: () => void;
}

export default function FilterBar({
    searchQuery,
    onSearchChange,
    onExportClick,
    onAddClick,
}: FilterBarProps) {
    return (
        <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center justify-between bg-[#1a1a1a] p-4 rounded-xl border border-[#3b3b3b] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:flex flex-1 items-center gap-4 w-full xl:w-auto">
                <div className="relative flex-1 min-w-[240px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[20px]">
                        search
                    </span>
                    <input
                        className="h-10 w-full rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-10 pr-4 text-sm text-[#e8e8e8] placeholder-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        placeholder="Search candidate name, email..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Mock dropdowns for visual parity */}
                <div className="relative">
                    <select className="h-10 w-full md:w-48 appearance-none rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-4 pr-10 text-sm text-[#e8e8e8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                        <option>All Departments</option>
                        <option>Engineering</option>
                        <option>Design</option>
                        <option>Sales</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">
                        expand_more
                    </span>
                </div>

                <div className="relative">
                    <select className="h-10 w-full md:w-48 appearance-none rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-4 pr-10 text-sm text-[#e8e8e8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                        <option>Any Score</option>
                        <option>90% - 100%</option>
                        <option>70% - 89%</option>
                        <option>Below 70%</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">
                        expand_more
                    </span>
                </div>

                <div className="relative">
                    <input
                        className="h-10 w-full md:w-44 rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] px-4 text-sm text-[#e8e8e8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                        type="date"
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-4 xl:mt-0">
                <button
                    onClick={onExportClick}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#3b3b3b] bg-[#262626] px-4 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">file_download</span>
                    Export
                </button>
                <button
                    onClick={onAddClick}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Add Candidate
                </button>
            </div>
        </div>
    );
}
