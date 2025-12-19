import React from 'react';
import type { CalibrationStrategy } from '../../../../types/Calibration';
import { CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface StrategySelectorProps {
    strategies: CalibrationStrategy[];
    selectedId?: string;
    onSelect: (id: string) => void;
    activeStrategyId?: string;
    onActiveSelect: (id: string) => void;
    existingCalibrations?: string[];
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({
    strategies,
    selectedId,
    onSelect,
    activeStrategyId,
    onActiveSelect,
    existingCalibrations = []
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strategies.map(strategy => {
                const isCalibrated = existingCalibrations.includes(strategy.id);
                const isActive = activeStrategyId === strategy.id;
                const isViewing = selectedId === strategy.id;
                const needsCalibration = isActive && !isCalibrated && strategy.id !== 'linear';

                return (
                    <div
                        key={strategy.id}
                        className={cn(
                            "relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer group",
                            // VIEWING STATE: Subtle blue border
                            isViewing ? "border-primary/40 bg-primary/5 shadow-md" : "border-muted hover:border-muted-foreground/30 bg-card",
                            // ACTIVE STATE: Strong Emerald Green border and glow
                            isActive && "border-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-background"
                        )}
                        onClick={() => onSelect(strategy.id)}
                    >
                        {/* Status Icons */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {isCalibrated && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Cal</span>
                                </div>
                            )}
                            {needsCalibration && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full uppercase animate-pulse">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>No Cal</span>
                                </div>
                            )}
                        </div>

                        {/* Strategy Info */}
                        <div className="flex items-start gap-3">
                            {/* Custom Radio Button for "Active" */}
                            <div
                                className={cn(
                                    "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    isActive ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30 hover:border-emerald-500/50"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onActiveSelect(strategy.id);
                                }}
                            >
                                {isActive && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                            </div>

                            <div className="flex flex-col">
                                <span className="font-bold text-sm flex items-center gap-2">
                                    {strategy.name}
                                    {isActive && <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">[Active]</span>}
                                </span>
                                <span className="text-[11px] text-muted-foreground leading-snug mt-1 italic">
                                    {strategy.description}
                                </span>
                            </div>
                        </div>

                        {/* Footer Action Hint */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                <PlayCircle className="w-3 h-3" />
                                <span>{isViewing ? "Currently Viewing" : "Click to Configure"}</span>
                            </div>

                            {!isActive && isViewing && (
                                <button
                                    className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold hover:bg-emerald-600 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onActiveSelect(strategy.id);
                                    }}
                                >
                                    Set as Active
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
