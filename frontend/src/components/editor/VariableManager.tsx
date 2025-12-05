import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../ui/command';
import type { IVariable } from '../../../../shared/types';
import { hardwareService } from '../../services/hardwareService';
import { cn } from '../../lib/utils';

interface VariableManagerProps {
    variables: IVariable[];
    onUpdateVariables: (vars: IVariable[]) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({
    variables,
    onUpdateVariables
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editUnit, setEditUnit] = useState('');
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [unitOpen, setUnitOpen] = useState(false);
    const [editTolerance, setEditTolerance] = useState(false);

    useEffect(() => {
        hardwareService.getTemplateUnits().then(setAvailableUnits).catch(console.error);
    }, []);

    // --- Helper to generate unique ID ---
    const generateId = (prefix: string) => {
        const nextId = `${prefix}_${variables.length + 1}`;
        let uniqueId = nextId;
        let counter = 1;
        while (variables.some(v => v.id === uniqueId)) {
            counter++;
            uniqueId = `${prefix}_${variables.length + counter}`;
        }
        return uniqueId;
    };

    // --- Local Variable Logic ---
    const addLocalVariable = () => {
        const uniqueId = generateId('var');
        const newVar: IVariable = {
            id: uniqueId,
            name: `Variable ${uniqueId.split('_')[1]}`,
            type: 'number',
            scope: 'local'
        };
        onUpdateVariables([...variables, newVar]);
    };

    // --- Global Variable Logic ---
    const addGlobalVariable = () => {
        const uniqueId = generateId('global');
        const newVar: IVariable = {
            id: uniqueId,
            name: `Global ${uniqueId.split('_')[1]}`,
            type: 'number',
            scope: 'global',
            hasTolerance: true
        };
        onUpdateVariables([...variables, newVar]);
    };

    // --- Shared Update/Delete Logic ---
    const updateVariable = (id: string, name: string, unit?: string, hasTolerance?: boolean, description?: string) => {
        const updated = variables.map(v => v.id === id ? { ...v, name, unit, hasTolerance, description } : v);
        onUpdateVariables(updated);
        setEditingId(null);
    };

    const deleteVariable = (id: string) => {
        const updated = variables.filter(v => v.id !== id);
        onUpdateVariables(updated);
    };

    const renderTable = (scope: 'local' | 'global') => {
        const scopedVariables = variables.filter(v => v.scope === scope);

        return (
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Name (Readable)</TableHead>
                            {scope === 'global' && <TableHead>Description</TableHead>}
                            <TableHead className="w-[150px]">Unit</TableHead>
                            {scope === 'global' && <TableHead className="w-[100px]">Tolerance</TableHead>}
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scopedVariables.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    No {scope} variables defined.
                                </TableCell>
                            </TableRow>
                        ) : (
                            scopedVariables.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell className="font-mono text-xs">{v.id}</TableCell>
                                    <TableCell>
                                        {editingId === v.id ? (
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-8"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        updateVariable(v.id, editName, editUnit, editTolerance, editDescription);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            v.name
                                        )}
                                    </TableCell>
                                    {scope === 'global' && (
                                        <TableCell>
                                            {editingId === v.id ? (
                                                <Input
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="h-8"
                                                    placeholder="Optional description..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            updateVariable(v.id, editName, editUnit, editTolerance, editDescription);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-muted-foreground text-sm truncate max-w-[200px] block" title={v.description}>
                                                    {v.description || '-'}
                                                </span>
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {editingId === v.id ? (
                                            <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={unitOpen}
                                                        className="w-full justify-between h-8"
                                                    >
                                                        {editUnit || "Select unit..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[200px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search unit..." onValueChange={(val) => setEditUnit(val)} />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                <Button variant="ghost" className="w-full justify-start h-8" onClick={() => setUnitOpen(false)}>
                                                                    Use "{editUnit}"
                                                                </Button>
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {availableUnits.map((unit) => (
                                                                    <CommandItem
                                                                        key={unit}
                                                                        value={unit}
                                                                        onSelect={(currentValue) => {
                                                                            setEditUnit(currentValue === editUnit ? "" : currentValue);
                                                                            setUnitOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                editUnit === unit ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {unit}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">{v.unit || '-'}</span>
                                        )}
                                    </TableCell>
                                    {scope === 'global' && (
                                        <TableCell>
                                            {editingId === v.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editTolerance}
                                                        onChange={(e) => setEditTolerance(e.target.checked)}
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="text-xs text-muted-foreground">Enable</span>
                                                </div>
                                            ) : (
                                                v.hasTolerance ? (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                        {editingId === v.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-green-500"
                                                    onClick={() => updateVariable(v.id, editName, editUnit, editTolerance, editDescription)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={() => {
                                                        setEditingId(v.id);
                                                        setEditName(v.name);
                                                        setEditDescription(v.description || '');
                                                        setEditUnit(v.unit || '');
                                                        setEditTolerance(v.hasTolerance || false);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteVariable(v.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    Manage Variables
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Variable Manager</DialogTitle>
                    <DialogDescription>
                        Create and manage variables for your automation logic.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="local" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="local">Local (Internal/Sensor)</TabsTrigger>
                        <TabsTrigger value="global">Global (User Input)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="local" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                Internal variables used for calculations or sensor data.
                            </div>
                            <Button size="sm" onClick={addLocalVariable} className="gap-1">
                                <Plus className="h-4 w-4" /> Add Local Var
                            </Button>
                        </div>
                        {renderTable('local')}
                    </TabsContent>

                    <TabsContent value="global" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                Input variables that can be set by the user or schedule.
                            </div>
                            <Button size="sm" onClick={addGlobalVariable} className="gap-1">
                                <Plus className="h-4 w-4" /> Add Global Var
                            </Button>
                        </div>
                        {renderTable('global')}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
