import React from "react";
import { AnalyticsData } from "@/types/reports";

interface HeatmapTableProps {
    heatmap: AnalyticsData["heatmap"];
}

export default function HeatmapTable({ heatmap }: HeatmapTableProps) {
    // Map values 1-5 to exact RGBA shades matching the original design
    const getCellClass = (density: number) => {
        if (density >= 5) return "bg-[#e64d4d]";
        if (density === 4) return "bg-[rgba(230,77,77,0.8)]";
        if (density === 3) return "bg-[rgba(230,77,77,0.6)]";
        if (density === 2) return "bg-[rgba(230,77,77,0.4)]";
        return "bg-[rgba(230,77,77,0.2)]";
    };

    return (
        <div className="xl:col-span-2 rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">Common Violation Types</h3>
                    <p className="text-sm text-slate-400">Incidents density per violation category by time of day.</p>
                </div>
                <div className="flex gap-1 text-[10px] items-center">
                    <span className="text-slate-500 mr-2">LOW</span>
                    <div className="w-3 h-3 bg-[rgba(230,77,77,0.2)] rounded-sm"></div>
                    <div className="w-3 h-3 bg-[rgba(230,77,77,0.4)] rounded-sm"></div>
                    <div className="w-3 h-3 bg-[rgba(230,77,77,0.6)] rounded-sm"></div>
                    <div className="w-3 h-3 bg-[rgba(230,77,77,0.8)] rounded-sm"></div>
                    <div className="w-3 h-3 bg-[#e64d4d] rounded-sm"></div>
                    <span className="text-slate-500 ml-1">HIGH</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-[#3b3b3b]">
                            <th className="pb-4 font-normal">Violation Category</th>
                            <th className="pb-4 font-normal px-2">08:00</th>
                            <th className="pb-4 font-normal px-2">10:00</th>
                            <th className="pb-4 font-normal px-2">12:00</th>
                            <th className="pb-4 font-normal px-2">14:00</th>
                            <th className="pb-4 font-normal px-2">16:00</th>
                            <th className="pb-4 font-normal px-2">18:00</th>
                            <th className="pb-4 font-normal px-2">20:00</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {heatmap.map((row, i) => (
                            <tr key={i} className={i < heatmap.length - 1 ? "border-b border-[#3b3b3b]/50" : ""}>
                                <td className="py-4 font-medium text-slate-300">
                                    {row.category}
                                </td>
                                {row.densities.map((density, idx) => (
                                    <td key={idx} className="p-1">
                                        <div className={`h-8 w-full rounded ${getCellClass(density)}`}></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
