"use client";
import { EnhancementRoadmap, PrioritizedEnhancement } from "@/lib/audit/types";

interface EnhancementRoadmapViewProps {
  roadmap: EnhancementRoadmap;
  onEnhancementSelect: (enhancement: PrioritizedEnhancement) => void;
}

export default function EnhancementRoadmapView({ roadmap, onEnhancementSelect }: EnhancementRoadmapViewProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "vision": return "visibility";
      case "audio": return "mic";
      case "behavioral": return "psychology";
      case "system": return "computer";
      default: return "category";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "vision": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "audio": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "behavioral": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "system": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getPhaseColor = (index: number) => {
    const colors = [
      "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20",
      "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20",
      "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20",
    ];
    return colors[index] || "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20";
  };

  const getPhaseIcon = (index: number) => {
    const icons = ["rocket_launch", "construction", "science"];
    return icons[index] || "category";
  };

  return (
    <div className="space-y-6">
      {/* Roadmap Overview */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Enhancement Roadmap
          </h2>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">schedule</span>
              <span>{roadmap.totalEstimatedHours} hours total</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">timeline</span>
              <span>{roadmap.phases.length} phases</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
            Recommended Implementation Sequence
          </h3>
          <div className="flex flex-wrap gap-2">
            {roadmap.recommendedSequence.map((name, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                <span className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap Phases */}
      <div className="space-y-6">
        {roadmap.phases.map((phase, phaseIndex) => (
          <div
            key={phaseIndex}
            className={`border-2 rounded-lg p-6 ${getPhaseColor(phaseIndex)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-slate-700 dark:text-slate-300">
                  {getPhaseIcon(phaseIndex)}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {phase.phaseName}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {phase.estimatedDuration} • {phase.enhancements.length} enhancements
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {phase.enhancements.reduce((sum, e) => sum + e.estimatedHours, 0)}h
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total Effort
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {phase.dependencies.length > 0 && (
              <div className="mb-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">link</span>
                  Dependencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {phase.dependencies.map((dep, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-xs"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Phase Enhancements */}
            <div className="grid gap-3">
              {phase.enhancements.map((enhancement) => (
                <div
                  key={enhancement.id}
                  onClick={() => onEnhancementSelect(enhancement)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(enhancement.category)}`}>
                          <span className="material-symbols-outlined text-xs">
                            {getCategoryIcon(enhancement.category)}
                          </span>
                          {enhancement.category}
                        </span>
                        
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          Priority {enhancement.priority}/10
                        </span>
                      </div>

                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        {enhancement.name}
                      </h4>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
                        {enhancement.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {enhancement.estimatedHours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">build</span>
                          {enhancement.implementationEffort} effort
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">star</span>
                          {enhancement.demonstrationValue} value
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <span className="material-symbols-outlined text-slate-400">
                        chevron_right
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Phase Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {phase.enhancements.length}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Enhancements
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-green-600">
                    {phase.enhancements.filter(e => e.priority >= 8).length}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    High Priority
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">
                    {phase.enhancements.filter(e => e.demonstrationValue === 'high').length}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    High Value
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-purple-600">
                    {phase.enhancements.filter(e => e.implementationEffort === 'low').length}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Low Effort
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Roadmap Timeline Visualization */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Timeline Visualization
        </h3>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-300 dark:bg-slate-600"></div>
          
          {/* Timeline Items */}
          <div className="space-y-6">
            {roadmap.phases.map((phase, index) => (
              <div key={index} className="relative flex items-start gap-4">
                {/* Timeline Dot */}
                <div className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                  index === 0 
                    ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" 
                    : index === 1
                    ? "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700"
                    : "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                }`}>
                  <span className="material-symbols-outlined text-lg text-slate-700 dark:text-slate-300">
                    {getPhaseIcon(index)}
                  </span>
                </div>
                
                {/* Timeline Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {phase.phaseName}
                    </h4>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {phase.estimatedDuration}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {phase.enhancements.slice(0, 3).map((enhancement) => (
                      <span
                        key={enhancement.id}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs"
                      >
                        {enhancement.name}
                      </span>
                    ))}
                    {phase.enhancements.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                        +{phase.enhancements.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {phase.enhancements.length} enhancements • {phase.enhancements.reduce((sum, e) => sum + e.estimatedHours, 0)} hours
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}