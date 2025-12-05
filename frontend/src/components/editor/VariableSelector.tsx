import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';

import type { IVariable } from '../../../../shared/types';

interface VariableSelectorProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    variables: IVariable[];
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
    value,
    onChange,
    placeholder = "Select variable...",
    variables
}) => {
    const localVars = variables.filter(v => v.scope === 'local');
    const globalVars = variables.filter(v => v.scope === 'global');

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Local Variables (Internal)</SelectLabel>
                    {localVars.length === 0 ? (
                        <div className="px-2 py-1 text-xs text-muted-foreground italic">No local variables</div>
                    ) : (
                        localVars.map(v => (
                            <SelectItem key={v.id} value={v.id} className="pl-6">
                                <span className="font-medium text-green-500 dark:text-green-400">{v.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground font-mono">({v.id})</span>
                            </SelectItem>
                        ))
                    )}
                </SelectGroup>
                <SelectGroup>
                    <SelectLabel>Global Variables (Input)</SelectLabel>
                    {globalVars.length === 0 ? (
                        <div className="px-2 py-1 text-xs text-muted-foreground italic">No global variables</div>
                    ) : (
                        globalVars.map(v => (
                            <SelectItem key={v.id} value={v.id} className="pl-6">
                                <span className="font-medium text-orange-500 dark:text-orange-400">{v.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground font-mono">({v.id})</span>
                            </SelectItem>
                        ))
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};
