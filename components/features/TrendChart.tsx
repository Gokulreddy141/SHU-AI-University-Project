import React from "react";

// Quick utility for mock chart points scaling
const Y_MAX = 100;

interface TrendChartProps {
    trends: { date: string; score: number }[];
}

export default function TrendChart({ trends }: TrendChartProps) {
    if (!trends || trends.length === 0) return null;

    // Distribute X coordinates evenly across 1000 pixels (guard single-point divide-by-zero)
    const divisor = Math.max(trends.length - 1, 1);
    const getX = (index: number) => (index / divisor) * 1000;
    // Map score (0-100) to Y coordinates (0 is bottom, 200 is top but we invert)
    const getY = (score: number) => 200 - (score / Y_MAX) * 160;

    // Generate path commands
    const points = trends.map((t, i) => `${getX(i)} ${getY(t.score)}`);
    const pathD = `M${points.join(" L ")}`;

    // Fill to the bottom
    const fillPathD = `${pathD} L 1000 200 L 0 200 Z`;

    return (
        <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-white">Global Integrity Score Trends</h3>
                    <p className="text-sm text-slate-400">Aggregated integrity metrics across all active exam sessions.</p>
                </div>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <span className="w-3 h-0.5 bg-primary"></span> Integrity Score
                    </span>
                </div>
            </div>

            <div className="relative h-64 w-full">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#e67e5c" stopOpacity="0.2"></stop>
                            <stop offset="100%" stopColor="#e67e5c" stopOpacity="0"></stop>
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[40, 80, 120, 160].map(y => (
                        <line key={y} stroke="#3b3b3b" strokeDasharray="4" x1="0" x2="1000" y1={y} y2={y}></line>
                    ))}

                    {/* Data Fill */}
                    <path d={fillPathD} fill="url(#chartGradient)"></path>
                    {/* Data Line */}
                    <path d={pathD} fill="none" stroke="#e67e5c" strokeWidth="3"></path>

                    {/* Data Points */}
                    {trends.map((t, i) => (
                        <circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(t.score)}
                            fill="#0f0f0f"
                            r="4"
                            stroke="#e67e5c"
                            strokeWidth="2"
                        ></circle>
                    ))}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between mt-4 px-2 text-[10px] font-mono text-slate-500 uppercase">
                    {trends.map((t, i) => (
                        <span key={i}>{t.date}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
