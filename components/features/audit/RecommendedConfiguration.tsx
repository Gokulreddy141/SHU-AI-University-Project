"use client";
import { BrowserCompatibility, RecommendedConfig } from "@/lib/audit/types";

interface RecommendedConfigurationProps {
  recommendedConfig: RecommendedConfig;
  browsers: BrowserCompatibility[];
}

export default function RecommendedConfiguration({ 
  recommendedConfig, 
  browsers 
}: RecommendedConfigurationProps) {
  
  // Find the best browser based on compatibility scores
  const bestBrowser = browsers.reduce((best, current) => 
    current.overallCompatibility > best.overallCompatibility ? current : best
  );

  // Find browsers with significant limitations
  const limitedBrowsers = browsers.filter(b => b.overallCompatibility < 80);

  // Calculate average compatibility across all browsers
  const averageCompatibility = Math.round(
    browsers.reduce((sum, b) => sum + b.overallCompatibility, 0) / browsers.length
  );

  return (
    <div className="space-y-6">
      {/* Recommended Configuration Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
              verified
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Recommended Configuration
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Optimal setup for maximum AI system compatibility and performance
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Browser</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {recommendedConfig.browser} {recommendedConfig.minVersion}+
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Expected Compatibility</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {bestBrowser.overallCompatibility}%
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      ({bestBrowser.supportedSystems.length} of {browsers[0]?.supportedSystems.length + browsers[0]?.unsupportedSystems.length + browsers[0]?.partialSystems.length || 0} systems)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Required Permissions</div>
                  <div className="space-y-1">
                    {recommendedConfig.requiredPermissions.map((permission, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-xs text-green-600 dark:text-green-400">
                          check_circle
                        </span>
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Requirements */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">
            computer
          </span>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Hardware Requirements
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Memory (RAM)</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Minimum</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {recommendedConfig.hardwareRequirements.minRAM}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Recommended</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {recommendedConfig.hardwareRequirements.recommendedRAM}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Processor (CPU)</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {recommendedConfig.hardwareRequirements.minCPU}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Graphics (GPU)</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {recommendedConfig.hardwareRequirements.gpu}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Camera</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {recommendedConfig.hardwareRequirements.camera}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Microphone</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {recommendedConfig.hardwareRequirements.microphone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browser Comparison */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">
            compare
          </span>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Browser Compatibility Comparison
          </h3>
        </div>

        <div className="space-y-4">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {averageCompatibility}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Average Compatibility
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {bestBrowser.browserName}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Best Browser ({bestBrowser.overallCompatibility}%)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {browsers.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Browsers Tested
              </div>
            </div>
          </div>

          {/* Browser Rankings */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Browser Rankings</h4>
            {browsers
              .sort((a, b) => b.overallCompatibility - a.overallCompatibility)
              .map((browser, index) => (
                <div key={browser.browserName} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      index === 1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {browser.browserName}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Version {browser.version}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {browser.overallCompatibility}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {browser.supportedSystems.length}S / {browser.partialSystems.length}P / {browser.unsupportedSystems.length}U
                      </div>
                    </div>
                    
                    <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          browser.overallCompatibility >= 90 ? 'bg-green-500' :
                          browser.overallCompatibility >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${browser.overallCompatibility}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Limitations Warning */}
          {limitedBrowsers.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 mt-0.5">
                  warning
                </span>
                <div>
                  <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Browsers with Significant Limitations
                  </div>
                  <div className="space-y-2">
                    {limitedBrowsers.map((browser) => (
                      <div key={browser.browserName} className="text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="font-medium">{browser.browserName}</span>: {browser.overallCompatibility}% compatibility
                        {browser.partialSystems.length > 0 && (
                          <div className="ml-4 mt-1 text-xs">
                            Limited support for: {browser.partialSystems.slice(0, 3).map(p => p.systemId).join(', ')}
                            {browser.partialSystems.length > 3 && ` and ${browser.partialSystems.length - 3} more`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Demonstration Checklist */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">
            checklist
          </span>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Pre-Demonstration Checklist
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Browser Setup</h4>
            <div className="space-y-2">
              {[
                `Use ${recommendedConfig.browser} ${recommendedConfig.minVersion} or later`,
                'Enable camera and microphone permissions',
                'Disable browser extensions that might interfere',
                'Close unnecessary tabs and applications',
                'Ensure stable internet connection'
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-xs text-slate-400 mt-1">
                    radio_button_unchecked
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Hardware Verification</h4>
            <div className="space-y-2">
              {[
                `Verify ${recommendedConfig.hardwareRequirements.recommendedRAM} RAM available`,
                'Test camera functionality and quality',
                'Test microphone and audio clarity',
                'Ensure adequate lighting for face detection',
                'Position camera at eye level'
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-xs text-slate-400 mt-1">
                    radio_button_unchecked
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}