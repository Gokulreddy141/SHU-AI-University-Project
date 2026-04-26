"use client";
import { useState } from "react";
import { AI_SYSTEMS } from "@/lib/audit/constants";

interface CompatibilityTestingProps {
  onTestComplete: () => void;
}

interface TestResult {
  executionId: string;
  browser: string;
  browserVersion: string;
  platform: string;
  systemCompatibility: Record<string, unknown>[];
  overallCompatibility: number;
  testedSystems: number;
  supportedSystems: number;
  partialSystems: number;
  unsupportedSystems: number;
}

export default function CompatibilityTesting({ onTestComplete }: CompatibilityTestingProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState('chrome');
  const [browserVersion, setBrowserVersion] = useState('120.0');
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const supportedBrowsers = [
    { id: 'chrome', name: 'Chrome', defaultVersion: '120.0' },
    { id: 'edge', name: 'Edge', defaultVersion: '120.0' },
    { id: 'firefox', name: 'Firefox', defaultVersion: '121.0' },
    { id: 'safari', name: 'Safari', defaultVersion: '17.0' },
  ];

  const allSystemIds = AI_SYSTEMS.map(s => s.id);
  const systemsByCategory = allSystemIds.reduce((acc, systemId) => {
    const system = AI_SYSTEMS.find(s => s.id === systemId);
    const category = system?.category || 'unknown';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(systemId);
    return acc;
  }, {} as Record<string, string[]>);

  const handleBrowserChange = (browserId: string) => {
    setSelectedBrowser(browserId);
    const browser = supportedBrowsers.find(b => b.id === browserId);
    if (browser) {
      setBrowserVersion(browser.defaultVersion);
    }
  };

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems(prev => 
      prev.includes(systemId) 
        ? prev.filter(id => id !== systemId)
        : [...prev, systemId]
    );
  };

  const handleCategoryToggle = (category: string) => {
    const categorySystems = systemsByCategory[category] || [];
    const allSelected = categorySystems.every(id => selectedSystems.includes(id));
    
    if (allSelected) {
      // Deselect all systems in this category
      setSelectedSystems(prev => prev.filter(id => !categorySystems.includes(id)));
    } else {
      // Select all systems in this category
      setSelectedSystems(prev => [
        ...prev.filter(id => !categorySystems.includes(id)),
        ...categorySystems
      ]);
    }
  };

  const runCompatibilityTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/audit/compatibility/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          browser: selectedBrowser,
          browserVersion,
          platform: navigator.platform,
          systemIds: selectedSystems.length > 0 ? selectedSystems : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(data);
        onTestComplete();
      } else {
        setError(data.message || 'Failed to run compatibility test');
      }
    } catch (err) {
      setError('Failed to run compatibility test');
      console.error('Error running compatibility test:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">
            science
          </span>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Run Compatibility Test
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browser Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Target Browser
              </label>
              <select
                value={selectedBrowser}
                onChange={(e) => handleBrowserChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                disabled={isRunning}
              >
                {supportedBrowsers.map((browser) => (
                  <option key={browser.id} value={browser.id}>
                    {browser.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Browser Version
              </label>
              <input
                type="text"
                value={browserVersion}
                onChange={(e) => setBrowserVersion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="e.g., 120.0"
                disabled={isRunning}
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <div><strong>Platform:</strong> {navigator.platform}</div>
                <div><strong>User Agent:</strong> {navigator.userAgent.split(' ').slice(0, 3).join(' ')}...</div>
              </div>
            </div>
          </div>

          {/* System Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                AI Systems to Test
              </label>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Leave empty to test all systems ({allSystemIds.length} total)
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-3">
              {Object.entries(systemsByCategory).map(([category, systems]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={systems.every(id => selectedSystems.includes(id))}
                      onChange={() => handleCategoryToggle(category)}
                      className="rounded border-slate-300 dark:border-slate-600"
                      disabled={isRunning}
                    />
                    <label 
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize cursor-pointer"
                    >
                      {category} AI ({systems.length})
                    </label>
                  </div>
                  <div className="ml-6 space-y-1">
                    {systems.map((systemId) => (
                      <div key={systemId} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={systemId}
                          checked={selectedSystems.includes(systemId)}
                          onChange={() => handleSystemToggle(systemId)}
                          className="rounded border-slate-300 dark:border-slate-600"
                          disabled={isRunning}
                        />
                        <label 
                          htmlFor={systemId}
                          className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          {AI_SYSTEMS.find(s => s.id === systemId)?.name || systemId}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              {selectedSystems.length > 0 
                ? `${selectedSystems.length} systems selected`
                : `All ${allSystemIds.length} systems will be tested`
              }
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Test will simulate {selectedBrowser} {browserVersion} environment
          </div>
          <button
            onClick={runCompatibilityTest}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Test...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Run Compatibility Test
              </>
            )}
          </button>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <span className="text-red-800 dark:text-red-200 font-medium">Test Failed</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
        </div>
      )}

      {/* Test Results */}
      {testResult && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">
              check_circle
            </span>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Test Results
            </h3>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {testResult.overallCompatibility}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Overall Compatibility
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {testResult.supportedSystems}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Fully Supported
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {testResult.partialSystems}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Partial Support
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {testResult.unsupportedSystems}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Unsupported
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Browser</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {testResult.browser} {testResult.browserVersion}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {testResult.platform}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Systems Tested</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {testResult.testedSystems}
                </div>
              </div>
            </div>

            {/* System Results */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                Individual System Results
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResult.systemCompatibility.map((system: Record<string, unknown>) => (
                  <div key={system.systemId as string} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {AI_SYSTEMS.find(s => s.id === system.systemId)?.name || (system.systemId as string)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {system.systemId as string}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {system.supported ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Supported
                        </span>
                      ) : system.partialSupport ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Unsupported
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}