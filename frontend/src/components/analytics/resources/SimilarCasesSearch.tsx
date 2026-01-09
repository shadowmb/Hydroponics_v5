import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Plus, Trash2, Search } from 'lucide-react';
import { similarCasesService } from '../../../services/api/similarCases.service';
import type { SimilarCasesCriterion, SimilarCasesResponse } from '../../../services/api/similarCases.service';
import { toast } from 'sonner';
import { resourceRoleService, type ResourceRole } from '../../../services/resourceRoleService';
import { analyticsService } from '../../../services/analyticsService';

const FIELD_OPTIONS = [
    { value: 'value', label: 'Стойност' },
    { value: 'startValue', label: 'Начална стойност' },
    { value: 'endValue', label: 'Крайна стойност' },
    { value: 'min', label: 'Минимум' },
    { value: 'max', label: 'Максимум' },
    { value: 'average', label: 'Средно' }
] as const;

export function SimilarCasesSearch() {
    const [programId, setProgramId] = useState<string>('__all__');
    const [windowName, setWindowName] = useState<string>('__all__');
    const [programs, setPrograms] = useState<any[]>([]);
    const [availableWindows, setAvailableWindows] = useState<string[]>([]);

    // State for roles
    const [allRoles, setAllRoles] = useState<ResourceRole[]>([]);
    const [roleUnits, setRoleUnits] = useState<Record<string, string>>({});

    // State for criteria
    const [filteringCriteria, setFilteringCriteria] = useState<SimilarCasesCriterion[]>([]);
    const [showOnlyRoles, setShowOnlyRoles] = useState<string[]>([]);
    const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<string>('');
    const [selectedShowOnlyRole, setSelectedShowOnlyRole] = useState<string>('');

    // State for results
    const [results, setResults] = useState<SimilarCasesResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Load roles and programs on mount
    useEffect(() => {
        loadRoles();
        loadPrograms();
    }, []);

    const loadRoles = async () => {
        try {
            const roles = await resourceRoleService.getAll();
            setAllRoles(roles);

            // Create units map
            const units: Record<string, string> = {};
            roles.forEach(role => {
                units[role.key] = role.unit || '';
            });
            setRoleUnits(units);
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const loadPrograms = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/analytics/programs`);
            const json = await response.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch programs');
            }

            setPrograms(json.data || []);
        } catch (error) {
            console.error('Error loading programs:', error);
        }
    };

    const loadWindows = async () => {
        try {
            const pid = programId !== '__all__' ? programId : undefined;
            const windows = await analyticsService.getAvailableWindows(pid);
            setAvailableWindows(windows);
        } catch (error) {
            console.error('Error loading windows:', error);
        }
    };

    // Load windows when program changes
    useEffect(() => {
        loadWindows();
    }, [programId]);

    const addCriterion = () => {
        if (!selectedRoleToAdd) {
            toast.error('Изберете ресурс');
            return;
        }

        // Check if already exists
        if (filteringCriteria.some(c => c.role === selectedRoleToAdd)) {
            toast.error('Този ресурс вече е добавен');
            return;
        }

        setFilteringCriteria([...filteringCriteria, {
            role: selectedRoleToAdd,
            field: 'value',
            value: 0,
            tolerance: 0
        }]);
        setSelectedRoleToAdd(''); // Reset selection
    };

    const updateCriterion = (index: number, updates: Partial<SimilarCasesCriterion>) => {
        const updated = [...filteringCriteria];
        updated[index] = { ...updated[index], ...updates };
        setFilteringCriteria(updated);
    };

    const removeCriterion = (index: number) => {
        setFilteringCriteria(filteringCriteria.filter((_, i) => i !== index));
    };


    const addShowOnlyRoleFromDropdown = () => {
        if (!selectedShowOnlyRole) {
            toast.error('Изберете ресурс');
            return;
        }

        // Check if already exists
        if (showOnlyRoles.includes(selectedShowOnlyRole)) {
            toast.error('Този ресурс вече е добавен');
            return;
        }

        setShowOnlyRoles([...showOnlyRoles, selectedShowOnlyRole]);
        setSelectedShowOnlyRole(''); // Reset selection
    };

    const removeShowOnlyRole = (role: string) => {
        setShowOnlyRoles(showOnlyRoles.filter(r => r !== role));
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const allCriteria: SimilarCasesCriterion[] = [
                ...filteringCriteria,
                ...showOnlyRoles.map(role => ({ role, showOnly: true }))
            ];

            // Filter out "__all__" and "all" - they are UI-only values
            const filters: { programId?: string; windowName?: string } = {};
            if (programId && programId !== '__all__' && programId !== '') {
                filters.programId = programId;
            }
            if (windowName && windowName !== '__all__' && windowName !== '') {
                filters.windowName = windowName;
            }

            const response = await similarCasesService.search(
                filters,
                allCriteria,
                10
            );

            setResults(response);
            toast.success(`Намерени ${response.records.length} подобни случая`);
        } catch (error) {
            toast.error('Грешка при търсене');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = (key: string) => allRoles.find(r => r.key === key)?.label || key;
    const getRoleUnit = (key: string) => roleUnits[key] || '';

    // Get available roles for dropdown (not already added)
    const availableRolesForAdd = allRoles.filter(r =>
        !filteringCriteria.some(c => c.role === r.key)
    );

    // Get available roles for show-only (not already added anywhere)
    const availableRolesForShowOnly = allRoles.filter((r: ResourceRole) =>
        !filteringCriteria.some(c => c.role === r.key) &&
        !showOnlyRoles.includes(r.key)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Търсене на подобни случаи
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                    Дефинирайте критерии за търсене на исторически записи с подобни ресурс параметри
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Own Filters */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm">Програма</Label>
                        <Select value={programId} onValueChange={setProgramId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Всички програми" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Всички програми</SelectItem>
                                {programs.map((p: any) => (
                                    <SelectItem key={p.programId} value={p.programId}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm">Прозорец/Цикъл</Label>
                        <Select value={windowName} onValueChange={setWindowName}>
                            <SelectTrigger>
                                <SelectValue placeholder="Всички прозорци" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Всички прозорци</SelectItem>
                                {availableWindows.map((w: string) => (
                                    <SelectItem key={w} value={w}>
                                        {w}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filtering Criteria */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Филтриращи критерии</Label>
                        <div className="flex gap-2">
                            <Select value={selectedRoleToAdd} onValueChange={setSelectedRoleToAdd}>
                                <SelectTrigger className="w-[200px] h-8">
                                    <SelectValue placeholder="Изберете ресурс" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRolesForAdd.map(role => (
                                        <SelectItem key={role.key} value={role.key} className="text-xs">
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addCriterion}
                                className="h-8 text-xs"
                                disabled={!selectedRoleToAdd}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Добави
                            </Button>
                        </div>
                    </div>

                    {filteringCriteria.length === 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-4 text-center">
                            Все още няма критерии. Изберете ресурс и натиснете "Добави".
                        </div>
                    )}

                    {filteringCriteria.map((criterion, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-muted/10">
                            <div className="col-span-3 flex items-center">
                                <span className="text-sm font-medium">{getRoleLabel(criterion.role)}</span>
                            </div>
                            <div className="col-span-3">
                                <Select
                                    value={criterion.field || 'value'}
                                    onValueChange={(value: any) => updateCriterion(idx, { field: value })}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={criterion.value || 0}
                                    onChange={(e) => updateCriterion(idx, { value: parseFloat(e.target.value) || 0 })}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={criterion.tolerance || 0}
                                    onChange={(e) => updateCriterion(idx, { tolerance: parseFloat(e.target.value) || 0 })}
                                    className="h-8 text-xs"
                                    placeholder="±"
                                />
                            </div>
                            <div className="col-span-1 flex items-center">
                                <span className="text-xs text-muted-foreground">
                                    {getRoleUnit(criterion.role)}
                                </span>
                            </div>
                            <div className="col-span-1 flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCriterion(idx)}
                                    className="h-8 w-8"
                                >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show Only Resources */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Показвани ресурси (без филтриране)</Label>
                        <div className="flex gap-2">
                            <Select value={selectedShowOnlyRole} onValueChange={setSelectedShowOnlyRole}>
                                <SelectTrigger className="w-[200px] h-8">
                                    <SelectValue placeholder="Изберете ресурс" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRolesForShowOnly.map(role => (
                                        <SelectItem key={role.key} value={role.key} className="text-xs">
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addShowOnlyRoleFromDropdown}
                                className="h-8 text-xs"
                                disabled={!selectedShowOnlyRole}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Добави
                            </Button>
                        </div>
                    </div>

                    {showOnlyRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {showOnlyRoles.map(role => (
                                <div key={role} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-xs">
                                    <span>{getRoleLabel(role)}</span>
                                    <button
                                        onClick={() => removeShowOnlyRole(role)}
                                        className="text-destructive hover:text-destructive/80"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Button */}
                <Button
                    onClick={handleSearch}
                    disabled={loading || filteringCriteria.length === 0}
                    className="w-full"
                >
                    {loading ? 'Търсене...' : 'Търси подобни случаи'}
                </Button>

                {/* Results */}
                {results && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">
                                Намерени {results.records.length} подобни случая
                            </h3>
                        </div>

                        {results.records.length > 0 ? (
                            <>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left px-3 py-2 font-medium">Дата</th>
                                                <th className="text-left px-3 py-2 font-medium">Програма/Поток</th>
                                                {[...filteringCriteria.map(c => c.role), ...showOnlyRoles].map(role => (
                                                    <th key={role} className="text-right px-3 py-2 font-medium">
                                                        {getRoleLabel(role)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.records.map((record, idx) => (
                                                <tr key={idx} className="border-t border-muted/30">
                                                    <td className="px-3 py-2">{record.date}</td>
                                                    <td className="px-3 py-2 text-muted-foreground">
                                                        {record.context.flowName || record.context.programName}
                                                    </td>
                                                    {[...filteringCriteria.map(c => c.role), ...showOnlyRoles].map(role => {
                                                        const res = record.resources[role];
                                                        if (!res) return <td key={role} className="px-3 py-2 text-center text-muted-foreground">-</td>;


                                                        // Find if this role is in filtering criteria to get the field
                                                        const criterion = filteringCriteria.find(c => c.role === role);
                                                        const field = criterion?.field || 'value';

                                                        // Display the specific field requested
                                                        let displayValue: string;
                                                        const resourceData = res as any; // Backend returns all fields

                                                        // Try to display requested field, fallback to available data
                                                        const hasRequestedField = (() => {
                                                            switch (field) {
                                                                case 'min': return resourceData.min !== undefined;
                                                                case 'max': return resourceData.max !== undefined;
                                                                case 'average': return resourceData.average !== undefined;
                                                                case 'startValue': return res.startValue !== undefined;
                                                                case 'endValue': return res.endValue !== undefined;
                                                                case 'value': return res.value !== undefined;
                                                                default: return false;
                                                            }
                                                        })();

                                                        if (hasRequestedField) {
                                                            switch (field) {
                                                                case 'min':
                                                                    displayValue = resourceData.min.toFixed(2);
                                                                    break;
                                                                case 'max':
                                                                    displayValue = resourceData.max.toFixed(2);
                                                                    break;
                                                                case 'average':
                                                                    displayValue = resourceData.average.toFixed(2);
                                                                    break;
                                                                case 'startValue':
                                                                    displayValue = res.startValue!.toFixed(2);
                                                                    break;
                                                                case 'endValue':
                                                                    displayValue = res.endValue!.toFixed(2);
                                                                    break;
                                                                case 'value':
                                                                default:
                                                                    displayValue = res.value!.toFixed(2);
                                                                    break;
                                                            }
                                                        } else {
                                                            // Fallback: show whatever data is available
                                                            if (res.startValue !== undefined && res.endValue !== undefined) {
                                                                displayValue = `${res.startValue.toFixed(1)}→${res.endValue.toFixed(1)}`;
                                                            } else if (res.value !== undefined) {
                                                                displayValue = res.value.toFixed(2);
                                                            } else {
                                                                displayValue = '-';
                                                            }
                                                        }

                                                        return (
                                                            <td key={role} className="text-right px-3 py-2">
                                                                {displayValue} {res.unit}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Averages - calculated from displayed values */}
                                <div className="bg-muted/20 rounded-lg p-3">
                                    <div className="text-xs font-medium mb-2">📊 Средни стойности:</div>
                                    <div className="flex flex-wrap gap-4 text-xs">
                                        {[...filteringCriteria.map(c => c.role), ...showOnlyRoles].map(role => {
                                            // Calculate average from displayed values
                                            const criterion = filteringCriteria.find(c => c.role === role);
                                            const field = criterion?.field || 'value';

                                            const values = results.records
                                                .map(record => {
                                                    const res = record.resources[role];
                                                    if (!res) return null;

                                                    const resourceData = res as any;

                                                    // Get the value based on requested field
                                                    switch (field) {
                                                        case 'min': return resourceData.min;
                                                        case 'max': return resourceData.max;
                                                        case 'average': return resourceData.average;
                                                        case 'startValue': return res.startValue;
                                                        case 'endValue': return res.endValue;
                                                        case 'value':
                                                        default:
                                                            // For value or showOnly, prefer value if available
                                                            return res.value !== undefined ? res.value : res.endValue;
                                                    }
                                                })
                                                .filter((v): v is number => v !== undefined && v !== null);

                                            if (values.length === 0) return null;

                                            const avg = values.reduce((a, b) => a + b, 0) / values.length;

                                            return (
                                                <div key={role}>
                                                    <span className="font-medium">{getRoleLabel(role)}:</span>{' '}
                                                    <span className="text-muted-foreground">
                                                        {avg.toFixed(2)} {getRoleUnit(role)}
                                                    </span>
                                                </div>
                                            );
                                        }).filter(Boolean)}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-4 text-center">
                                Няма намерени резултати с тези критерии
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
