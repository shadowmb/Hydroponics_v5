import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Variable } from 'lucide-react';
import { VariableSelector } from './VariableSelector';
import type { IVariable } from '../../../../shared/types';

interface TimeValueInputProps {
    label: string;
    value: number | string;
    unit: string;
    onChange: (key: string, value: any) => void;
    valueKey: string;
    unitKey: string;
    variables: IVariable[];
    expectedUnit: string; // 'sec' or 'count'
    placeholder?: string;
}

const TIME_UNITS = [
    { label: 'Seconds', value: 'sec' },
    { label: 'Minutes', value: 'min' },
    { label: 'Hours', value: 'hours' }
];

const COUNT_UNITS_VALID = ['count', 'iterations', 'doses', 'integer', '#'];
const TIME_UNITS_VALID = ['sec', 'min', 'hours', 's', 'seconds', 'minutes'];

export const TimeValueInput: React.FC<TimeValueInputProps> = ({
    label,
    value,
    unit,
    onChange,
    valueKey,
    unitKey,
    variables,
    expectedUnit,
    placeholder = 'e.g. 1'
}) => {
    const isVariable = typeof value === 'string' && value.startsWith('{{');
    const selectedVariable = isVariable ? value.slice(2, -2).trim() : undefined;
    const variable = selectedVariable ? variables.find(v => v.id === selectedVariable) : null;
    const varUnit = variable?.unit || '';

    // Validation
    let validationError: string | null = null;
    if (isVariable && variable && varUnit) {
        if (expectedUnit === 'sec' && !TIME_UNITS_VALID.includes(varUnit)) {
            validationError = `"${variable.name}" has unit "${varUnit}". Time fields require: sec, min, or hours.`;
        } else if (expectedUnit === 'count' && !COUNT_UNITS_VALID.includes(varUnit)) {
            validationError = `"${variable.name}" has unit "${varUnit}". Count fields require: count, iterations.`;
        }
    }

    return (
        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="flex gap-2">
                {isVariable ? (
                    <VariableSelector
                        value={selectedVariable || ''}
                        onChange={(val) => onChange(valueKey, `{{${val}}}`)}
                        placeholder="Select variable"
                        variables={variables}
                    />
                ) : (
                    <>
                        <Input
                            type="number"
                            value={value || ''}
                            onChange={(e) => onChange(valueKey, e.target.value)}
                            placeholder={placeholder}
                            className="flex-1"
                        />
                        {expectedUnit === 'sec' && (
                            <Select value={unit} onValueChange={(val) => onChange(unitKey, val)}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_UNITS.map(u => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            onChange(valueKey, '');
                        } else {
                            onChange(valueKey, '{{}}');
                        }
                    }}
                >
                    {isVariable ? <span className="font-mono text-xs">123</span> : <span className="font-mono text-xs">Var</span>}
                </Button>
            </div>

            {/* Variable Info */}
            {isVariable && variable && (
                <div className="p-2 border rounded bg-muted/20 text-sm">
                    <Variable className="inline h-3 w-3 mr-1" />
                    <span className="font-medium">{variable.name}</span>
                    <span className="text-muted-foreground ml-2">
                        = {variable.value ?? 0} {varUnit}
                    </span>
                </div>
            )}

            {/* Validation Error */}
            {validationError && (
                <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                </div>
            )}
        </div>
    );
};
