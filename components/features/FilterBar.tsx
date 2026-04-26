import React from "react";

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onExportClick: () => void;
    onAddClick: () => void;
    onInviteClick?: () => void;
}

export default function FilterBar({
    searchQuery,
    onSearchChange,
    onExportClick,
    onAddClick,
    onInviteClick,
}: FilterBarProps) {
    return (
        <div className="flex flex-wrap gap-3 items-center justify-between bg-[#1a1a1a] p-4 rounded-xl border border-[#3b3b3b] shadow-sm w-full">
            {/* Filters — wrap naturally on smaller screens */}
            <div className="flex flex-wrap flex-1 min-w-0 items-center gap-3">
                <div className="relative min-w-[180px] flex-1">
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

                <div className="relative flex-shrink-0">
                    <select className="h-10 w-44 appearance-none rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-4 pr-10 text-sm text-[#e8e8e8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                        <option>All Departments</option>
                        <option>Engineering</option>
                        <option>Design</option>
                        <option>Sales</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">
                        expand_more
                    </span>
                </div>

                <div className="relative flex-shrink-0">
                    <select className="h-10 w-36 appearance-none rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] pl-4 pr-10 text-sm text-[#e8e8e8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                        <option>Any Score</option>
                        <option>90% - 100%</option>
                        <option>70% - 89%</option>
                        <option>Below 70%</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">
                        expand_more
                    </span>
                </div>

                <div className="relative flex-shrink-0">
                    <input
                        className="h-10 w-40 rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] px-4 text-sm text-[#e8e8e8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                        type="date"
                    />
                </div>
            </div>

            {/* Action buttons — never wrap internally, but the group can wrap to a new line */}
            <div className="flex flex-shrink-0 gap-3">
                <button
                    onClick={onExportClick}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#3b3b3b] bg-[#262626] px-4 text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                >
                    <span className="material-symbols-outlined text-lg">file_download</span>
                    Export
                </button>
                {onInviteClick && (
                    <button
                        onClick={onInviteClick}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-primary-light hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-lg">mail</span>
                        Invite
                    </button>
                )}
                <button
                    onClick={onAddClick}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    Bulk Import
                </button>
            </div>
        </div>
    );
}
