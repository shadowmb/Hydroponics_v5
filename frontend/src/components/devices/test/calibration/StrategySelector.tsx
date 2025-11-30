import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CalibrationStrategy } from '../../../../types/Calibration';

interface StrategySelectorProps {
    strategies: CalibrationStrategy[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({ strategies, selectedId, onSelect }) => {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Calibration Strategy</label>
            <Select value={selectedId} onValueChange={onSelect}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a strategy..." />
                </SelectTrigger>
                <SelectContent>
                    {strategies.map(strategy => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{strategy.name}</span>
                                <span className="text-xs text-muted-foreground">{strategy.description}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
