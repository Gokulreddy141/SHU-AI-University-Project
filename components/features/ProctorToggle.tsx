import React from "react";

interface ProctorToggleProps {
    currentMode: "strict" | "standard" | "light";
    onModeChange: (mode: "strict" | "standard" | "light") => void;
    disabled?: boolean;
}

export default function ProctorToggle({
    currentMode,
    onModeChange,
    disabled = false,
}: ProctorToggleProps) {
    const modes = ["strict", "standard", "light"] as const;

    return (
        <div className="flex bg-[#0f0f0f] border border-[#3b3b3b] p-1 rounded-lg gap-1">
            {modes.map((mode) => {
                const isActive = currentMode === mode;
                return (
                    <button
                        key={mode}
                        onClick={() => onModeChange(mode)}
                        disabled={disabled}
                        className={`
                            flex-1 py-1.5 px-2 text-[10px] font-bold font-mono transition-all rounded uppercase
                            ${isActive ? "bg-primary text-white shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-300"}
                            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        `}
                    >
                        {mode}
                    </button>
                );
            })}
        </div>
    );
}
