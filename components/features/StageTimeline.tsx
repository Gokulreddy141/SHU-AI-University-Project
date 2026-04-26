"use client";

import { IExamStage } from "@/types/exam";

interface StageTimelineProps {
    stages: IExamStage[];
    currentStageId?: string;
}

export function StageTimeline({ stages, currentStageId }: StageTimelineProps) {
    if (!stages || stages.length === 0) return null;

    // Sort stages by order
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

    return (
        <div className="flex items-center w-full my-8">
            {sortedStages.map((stage, index) => {
                const isCurrent = stage._id === currentStageId;
                const isPast =
                    currentStageId &&
                    sortedStages.findIndex((s) => s._id === stage._id) <
                    sortedStages.findIndex((s) => s._id === currentStageId);

                return (
                    <div key={stage._id} className="flex-1 relative">
                        {/* Connecting Line */}
                        {index !== sortedStages.length - 1 && (
                            <div
                                className={`absolute top-1/2 left-[50%] right-[-50%] h-1 -translate-y-1/2 ${isPast || isCurrent ? "bg-indigo-500" : "bg-gray-700"
                                    }`}
                            />
                        )}

                        {/* Stage Node */}
                        <div className="relative flex flex-col items-center group">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 z-10 transition-all ${isCurrent
                                        ? "bg-indigo-600 border-indigo-900 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                        : isPast
                                            ? "bg-indigo-500 border-indigo-500"
                                            : "bg-gray-800 border-gray-700"
                                    }`}
                            >
                                <span className="text-sm font-bold text-white">{index + 1}</span>
                            </div>

                            <div className="absolute top-12 text-center w-32">
                                <p
                                    className={`text-sm font-medium ${isCurrent ? "text-indigo-400" : isPast ? "text-gray-300" : "text-gray-500"
                                        }`}
                                >
                                    {stage.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{stage.type}</p>
                                <p className="text-xs text-gray-600">{stage.duration}m</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
