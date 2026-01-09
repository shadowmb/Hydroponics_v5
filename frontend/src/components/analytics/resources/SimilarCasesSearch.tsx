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
import { SimilarCasesResultsTable } from './SimilarCasesResultsTable';

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
    const [availableFlows, setAvailableFlows] = useState<{ id: string, label: string }[]>([]);
    const [availableSources, setAvailableSources] = useState<string[]>([]);
    const [flowId, setFlowId] = useState<string>('__all__');

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
        loadSources();
    }, []);

    const loadSources = async () => {
        try {
            const sources = await similarCasesService.getUniqueSources();
            setAvailableSources(sources);
        } catch (error) {
            console.error('Error loading sources:', error);
        }
    };

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

    const loadFlows = async () => {
        try {
            const pid = programId !== '__all__' ? programId : undefined;
            const wName = windowName !== '__all__' ? windowName : undefined;
            const flows = await analyticsService.getAvailableFlows(pid, wName);
            setAvailableFlows(flows);
        } catch (error) {
            console.error('Error loading flows:', error);
        }
    };

    // Load flows when program or window changes
    useEffect(() => {
        loadFlows();
    }, [programId, windowName]);

    const addCriterion = () => {
        if (!selectedRoleToAdd) {
            toast.error('Изберете ресурс');
            return;
        }

        // Check if already exists - REMOVED to allow multiple criteria for same role (e.g. min + max)
        // if (filteringCriteria.some(c => c.role === selectedRoleToAdd)) {
        //     toast.error('Този ресурс вече е добавен');
        //     return;
        // }

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
            const filters: { programId?: string; windowName?: string; flowId?: string } = {};
            if (programId && programId !== '__all__' && programId !== '') {
                filters.programId = programId;
            }
            if (windowName && windowName !== '__all__' && windowName !== '') {
                filters.windowName = windowName;
            }
            if (flowId && flowId !== '__all__' && flowId !== '') {
                filters.flowId = flowId; // Backend expects this is actually the flowID/Name stored in context
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

    // Get available roles for dropdown (allow same role multiple times)
    const availableRolesForAdd = allRoles;

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
                <div className="grid grid-cols-3 gap-4">
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
                    <div className="space-y-2">
                        <Label className="text-sm">Поток</Label>
                        <Select value={flowId} onValueChange={setFlowId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Всички потоци" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Всички потоци</SelectItem>
                                {availableFlows.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.label}
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
                            <div className="col-span-2 flex items-center">
                                <span className="text-sm font-medium truncat" title={getRoleLabel(criterion.role)}>
                                    {getRoleLabel(criterion.role)}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <Select
                                    value={criterion.analyticsLabel || '__any__'}
                                    onValueChange={(val) => updateCriterion(idx, { analyticsLabel: val === '__any__' ? undefined : val })}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Всички" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__any__" className="text-xs text-muted-foreground">Всички източници</SelectItem>
                                        {availableSources.map(s => (
                                            <SelectItem key={s} value={s} className="text-xs">
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
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
                            <div className="col-span-1 flex items-center justify-end">
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
                            <SimilarCasesResultsTable
                                results={results}
                                filteringCriteria={filteringCriteria}
                                showOnlyRoles={showOnlyRoles}
                                getRoleLabel={getRoleLabel}
                                getRoleUnit={getRoleUnit}
                            />
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
