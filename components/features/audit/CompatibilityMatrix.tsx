"use client";
import React, { useState } from "react";
import { BrowserCompatibility } from "@/lib/audit/types";
import { AI_SYSTEMS } from "@/lib/audit/constants";

interface CompatibilityMatrixProps {
  browsers: BrowserCompatibility[];
  onRefresh: () => void;
}

export default function CompatibilityMatrix({ browsers }: CompatibilityMatrixProps) {
  const [selectedBrowser, setSelectedBrowser] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  // Get all unique system IDs from all browsers
  const allSystemIds = Array.from(new Set([
    ...browsers.flatMap(b => b.supportedSystems),
    ...browsers.flatMap(b => b.unsupportedSystems),
    ...browsers.flatMap(b => b.partialSystems.map(p => p.systemId))
  ]));

  const getCompatibilityStatus = (browser: BrowserCompatibility, systemId: string) => {
    if (browser.supportedSystems.includes(systemId)) {
      return 'supported';
    }
    if (browser.unsupportedSystems.includes(systemId)) {
      return 'unsupported';
    }
    const partialSystem = browser.partialSystems.find(p => p.systemId === systemId);
    if (partialSystem) {
      return 'partial';
    }
    return 'unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'supported':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'unsupported':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'supported':
        return 'check_circle';
      case 'partial':
        return 'warning';
      case 'unsupported':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const getSystemName = (systemId: string) => {
    return AI_SYSTEMS.find(s => s.id === systemId)?.name || systemId;
  };

  const getSystemCategory = (systemId: string) => {
    return AI_SYSTEMS.find(s => s.id === systemId)?.category || 'unknown';
  };

  // Group systems by category
  const systemsByCategory = allSystemIds.reduce((acc, systemId) => {
    const category = getSystemCategory(systemId);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(systemId);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryColors = {
    vision: 'text-blue-600 dark:text-blue-400',
    audio: 'text-green-600 dark:text-green-400',
    behavioral: 'text-purple-600 dark:text-purple-400',
    system: 'text-orange-600 dark:text-orange-400',
    unknown: 'text-slate-600 dark:text-slate-400'
  };

  const handleCellClick = (browserName: string, systemId: string) => {
    setSelectedBrowser(browserName);
    setSelectedSystem(systemId);
  };

  const selectedBrowserData = browsers.find(b => b.browserName === selectedBrowser);
  const selectedSystemData = selectedBrowserData && selectedSystem ? 
    selectedBrowserData.partialSystems.find(p => p.systemId === selectedSystem) : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {browsers.map((browser) => (
          <div key={browser.browserName} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {browser.browserName}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  v{browser.version}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {browser.overallCompatibility}%
                </div>
                <div className="text-xs text-slate-500">
                  compatibility
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">
                  {browser.supportedSystems.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">
                  {browser.partialSystems.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">
                  {browser.unsupportedSystems.length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compatibility Matrix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            AI System Compatibility Matrix
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Click on any cell to see detailed compatibility information
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  AI System
                </th>
                {browsers.map((browser) => (
                  <th key={browser.browserName} className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <div>
                      {browser.browserName}
                    </div>
                    <div className="text-xs font-normal">
                      v{browser.version}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {Object.entries(systemsByCategory).map(([category, systems]) => (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-slate-50 dark:bg-slate-900/30">
                    <td colSpan={browsers.length + 1} className="px-6 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium capitalize ${categoryColors[category as keyof typeof categoryColors]}`}>
                          {category} AI Systems
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({systems.length} systems)
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* System Rows */}
                  {systems.map((systemId) => (
                    <tr key={systemId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {getSystemName(systemId)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {systemId}
                          </div>
                        </div>
                      </td>
                      {browsers.map((browser) => {
                        const status = getCompatibilityStatus(browser, systemId);
                        return (
                          <td key={browser.browserName} className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleCellClick(browser.browserName, systemId)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${getStatusColor(status)}`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {getStatusIcon(status)}
                              </span>
                              <span className="capitalize">{status}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBrowser && selectedSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Compatibility Details
              </h3>
              <button
                onClick={() => {
                  setSelectedBrowser(null);
                  setSelectedSystem(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Browser</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {selectedBrowser} v{selectedBrowserData?.version}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">AI System</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {getSystemName(selectedSystem)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSystem}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getCompatibilityStatus(selectedBrowserData!, selectedSystem))}`}>
                    <span className="material-symbols-outlined text-sm">
                      {getStatusIcon(getCompatibilityStatus(selectedBrowserData!, selectedSystem))}
                    </span>
                    <span className="capitalize">
                      {getCompatibilityStatus(selectedBrowserData!, selectedSystem)}
                    </span>
                  </span>
                </div>
              </div>

              {selectedSystemData && (
                <>
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Limitations</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {selectedSystemData.limitation}
                    </div>
                  </div>

                  {selectedSystemData.workaround && (
                    <div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Workaround</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {selectedSystemData.workaround}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}