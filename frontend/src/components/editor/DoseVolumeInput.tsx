import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Beaker, Droplets, Clock, Variable, AlertCircle } from 'lucide-react';
import { VariableSelector } from './VariableSelector';
import type { IVariable } from '../../../../shared/types';

interface DoseVolumeInputProps {
    // Current values
    amountMode: 'DOSES' | 'VOLUME';
    amount: number | string;
    amountUnit: string;
    // Handlers
    onChange: (key: string, value: any) => void;
    // Context
    variables: IVariable[];
    device?: any; // For calibration data
    // Variable mode
    isVariable: boolean;
    selectedVariable?: string;
}

const VOLUME_UNITS = [
    { value: 'ml', label: 'ml' },
    { value: 'l', label: 'L' },
    { value: 'gal', label: 'gal' }
];

export const DoseVolumeInput: React.FC<DoseVolumeInputProps> = ({
    amountMode = 'VOLUME',
    amount,
    amountUnit = 'ml',
    onChange,
    variables,
    device,
    isVariable,
    selectedVariable
}) => {
    // DEBUG: Track values
    console.log('[DoseVolumeInput] amountMode:', amountMode, 'amount:', amount, 'unit:', amountUnit);

    // Get calibration data
    const calibration = device?.config?.calibrations?.volumetric_flow?.data;
    const flowRate = calibration?.flowRate || 0;
    const doseSize = calibration?.doseSize || 0;
    const doseUnit = calibration?.doseUnit || 'ml';

    // Calculate preview
    let previewMl = 0;
    let previewTime = 0;

    if (!isVariable && amount && !isNaN(Number(amount))) {
        const numAmount = Number(amount);
        if (amountMode === 'DOSES') {
            previewMl = numAmount * doseSize;
        } else {
            previewMl = numAmount;
            if (amountUnit === 'l') previewMl *= 1000;
            else if (amountUnit === 'gal') previewMl *= 3785.41;
        }
        if (flowRate > 0) {
            previewTime = previewMl / flowRate;
        }
    }

    // Get variable info for preview
    const variable = selectedVariable ? variables.find(v => v.id === selectedVariable) : null;
    const varValue = variable?.value ?? 0;
    const varUnit = variable?.unit || '';

    // Validation for variable unit compatibility
    const VOLUME_UNITS_VALID = ['ml', 'l', 'L', 'gal'];
    const DOSES_UNITS_VALID = ['count', 'iterations', 'doses', 'integer', '#'];

    let unitValidationError: string | null = null;
    if (isVariable && variable && varUnit) {
        if (amountMode === 'VOLUME' && !VOLUME_UNITS_VALID.includes(varUnit)) {
            unitValidationError = `Variable "${variable.name}" has unit "${varUnit}". Volume mode requires: ml, l, or gal.`;
        } else if (amountMode === 'DOSES' && !DOSES_UNITS_VALID.includes(varUnit)) {
            unitValidationError = `Variable "${variable.name}" has unit "${varUnit}". Doses mode requires a count unit (count, doses, iterations).`;
        }
    }

    return (
        <div className="space-y-4">
            {/* Radio Toggle */}
            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">How to dose?</Label>
                <RadioGroup
                    value={amountMode}
                    onValueChange={(val) => {
                        // Only update amountMode - keep it simple
                        onChange('amountMode', val as 'DOSES' | 'VOLUME');
                    }}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="DOSES" id="dose-mode" />
                        <Label htmlFor="dose-mode" className="flex items-center gap-1 cursor-pointer">
                            <Beaker className="h-3 w-3" /> Doses
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="VOLUME" id="volume-mode" />
                        <Label htmlFor="volume-mode" className="flex items-center gap-1 cursor-pointer">
                            <Droplets className="h-3 w-3" /> Volume
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                    {amountMode === 'DOSES' ? 'Number of Doses' : 'Volume Amount'}
                </Label>
                <div className="flex gap-2">
                    {isVariable ? (
                        <VariableSelector
                            value={typeof amount === 'string' ? amount.replace(/{{|}}/g, '') : ''}
                            onChange={(val) => onChange('amount', `{{${val}}}`)}
                            placeholder="Select variable"
                            variables={variables}
                        />
                    ) : (
                        <>
                            <Input
                                type="number"
                                value={amount || ''}
                                onChange={(e) => onChange('amount', e.target.value)}
                                placeholder={amountMode === 'DOSES' ? 'e.g. 2' : 'e.g. 100'}
                                className="flex-1"
                            />
                            {amountMode === 'VOLUME' && (
                                <Select value={amountUnit} onValueChange={(val) => onChange('amountUnit', val)}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VOLUME_UNITS.map(u => (
                                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {amountMode === 'DOSES' && (
                                <span className="flex items-center text-sm text-muted-foreground px-2">doses</span>
                            )}
                        </>
                    )}
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        title={isVariable ? "Switch to Static Value" : "Switch to Variable"}
                        onClick={() => {
                            if (isVariable) {
                                onChange('amount', ''); // Reset to empty
                            } else {
                                onChange('amount', '{{}}'); // Switch to variable format
                            }
                        }}
                    >
                        {isVariable ? <span className="font-mono text-xs">123</span> : <span className="font-mono text-xs">Var</span>}
                    </Button>
                </div>
            </div>

            {/* Variable Selector (if variable mode) */}
            {isVariable && variable && (
                <div className="p-2 border rounded bg-muted/20 text-sm">
                    <Variable className="inline h-3 w-3 mr-1" />
                    <span className="font-medium">{variable.name}</span>
                    <span className="text-muted-foreground ml-2">
                        = {varValue} {varUnit}
                    </span>
                </div>
            )}

            {/* Unit Validation Warning */}
            {unitValidationError && (
                <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{unitValidationError}</span>
                </div>
            )}

            {/* Pump Info */}
            {doseSize > 0 && (
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded text-xs space-y-1">
                    <div className="font-medium text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                        <Beaker className="h-3 w-3" /> Pump Calibration
                    </div>
                    <div className="text-muted-foreground">
                        1 dose = {doseSize}{doseUnit} • Flow: {flowRate} ml/sec
                    </div>
                </div>
            )}

            {/* Preview */}
            {previewMl > 0 && !isVariable && (
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                    <div className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Preview
                    </div>
                    <div className="text-muted-foreground">
                        {amountMode === 'DOSES' && (
                            <>{amount} doses × {doseSize}{doseUnit} = </>
                        )}
                        <span className="font-medium">{previewMl.toFixed(1)}ml</span>
                        {previewTime > 0 && (
                            <span className="ml-2">(⏱️ ~{previewTime.toFixed(1)}s)</span>
                        )}
                    </div>
                </div>
            )}

            {/* Warning if no calibration */}
            {(!doseSize || !flowRate) && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-400">
                    ⚠️ Pump not calibrated. Please calibrate for accurate dosing.
                </div>
            )}
        </div>
    );
};
