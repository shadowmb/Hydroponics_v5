import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CalibrationStrategy } from '../../../../types/Calibration';
import { CheckCircle2 } from 'lucide-react';

interface StrategySelectorProps {
    strategies: CalibrationStrategy[];
    selectedId?: string;
    onSelect: (id: string) => void;
    existingCalibrations?: string[];
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({ strategies, selectedId, onSelect, existingCalibrations = [] }) => {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Calibration Strategy</label>
            <Select value={selectedId} onValueChange={onSelect}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a strategy..." />
                </SelectTrigger>
                <SelectContent>
                    {strategies.map(strategy => {
                        const isCalibrated = existingCalibrations.includes(strategy.id);
                        return (
                            <SelectItem key={strategy.id} value={strategy.id}>
                                <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{strategy.name}</span>
                                        {isCalibrated && (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{strategy.description}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
};
