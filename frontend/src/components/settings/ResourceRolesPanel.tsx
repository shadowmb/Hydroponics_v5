
import { useEffect, useState, useMemo } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { resourceRoleService, type ResourceRole, type AnalyticsType } from "../../services/resourceRoleService";
import { RefreshCw, Save, Loader2, Link2, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ResourceRolesPanel() {
    const [roles, setRoles] = useState<ResourceRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [dirty, setDirty] = useState<Record<string, boolean>>({});
    const [edits, setEdits] = useState<Record<string, Partial<ResourceRole>>>({});

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: keyof ResourceRole | null, direction: 'asc' | 'desc' | null }>({
        key: null,
        direction: null
    });

    // Filter state
    const [filters, setFilters] = useState({
        key: "",
        label: "",
        showInSummary: "all", // all | yes | no
        analyticsType: "all", // all | SUM | DELTA | TREND | NONE
        measuredBy: "all" // all | yes | no
    });

    const loadRoles = async () => {
        setLoading(true);
        try {
            const data = await resourceRoleService.getAll();
            setRoles(data);
            setDirty({});
            setEdits({});
        } catch (error) {
            toast.error("Failed to load resource roles");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await resourceRoleService.sync();
            toast.success(`Synced! Added: ${result.added}, Updated: ${result.updated}`);
            loadRoles();
        } catch (error) {
            toast.error("Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handleEdit = (key: string, field: keyof ResourceRole, value: any) => {
        setEdits(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
        setDirty(prev => ({ ...prev, [key]: true }));
    };

    const handleSave = async (key: string) => {
        const updates = edits[key];
        if (!updates) return;

        try {
            await resourceRoleService.update(key, updates);
            toast.success("Role updated");
            setDirty(prev => ({ ...prev, [key]: false }));

            // Refresh specific item in list
            setRoles(prev => prev.map(r => r.key === key ? { ...r, ...updates } : r));
        } catch (error) {
            toast.error("Update failed");
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleSort = (key: keyof ResourceRole) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key: direction ? key : null, direction });
    };

    const ANALYTICS_TYPES: AnalyticsType[] = ['SUM', 'DELTA', 'TREND', 'NONE'];
    const COLORS = ['gray', 'red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'orange'];

    const processedRoles = useMemo(() => {
        let result = [...roles];

        // 1. Apply Filters
        if (filters.key) {
            result = result.filter(r => r.key.toLowerCase().includes(filters.key.toLowerCase()));
        }
        if (filters.label) {
            result = result.filter(r => r.label.toLowerCase().includes(filters.label.toLowerCase()));
        }
        if (filters.showInSummary !== "all") {
            const wantShow = filters.showInSummary === "yes";
            result = result.filter(r => (r.showInSummary ?? false) === wantShow);
        }
        if (filters.analyticsType !== "all") {
            result = result.filter(r => r.analyticsType === filters.analyticsType);
        }
        if (filters.measuredBy !== "all") {
            const wantMeasured = filters.measuredBy === "yes";
            result = result.filter(r => (!!r.measuredBy) === wantMeasured);
        }

        // 2. Apply Sorting
        if (sortConfig.key && sortConfig.direction) {
            const { key, direction } = sortConfig;
            result.sort((a, b) => {
                const valA = (a[key] ?? "").toString().toLowerCase();
                const valB = (b[key] ?? "").toString().toLowerCase();

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [roles, filters, sortConfig]);

    const getSortIcon = (key: keyof ResourceRole) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Resource Roles & Analytics</CardTitle>
                    <CardDescription>
                        Manage how system resources are displayed and calculated.
                        Click 'Sync Templates' to discover new roles from device definitions.
                    </CardDescription>
                </div>
                <Button variant="outline" onClick={handleSync} disabled={syncing}>
                    {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Sync Templates
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-0">
                                <TableHead
                                    className="w-[180px] cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('key')}
                                >
                                    <div className="flex items-center">System Key {getSortIcon('key')}</div>
                                </TableHead>
                                <TableHead
                                    className="w-[100px] text-center cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('showInSummary')}
                                >
                                    <div className="flex items-center justify-center">Show {getSortIcon('showInSummary')}</div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('label')}
                                >
                                    <div className="flex items-center">Display Name {getSortIcon('label')}</div>
                                </TableHead>
                                <TableHead
                                    className="w-[150px] cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('analyticsType')}
                                >
                                    <div className="flex items-center">Calculation {getSortIcon('analyticsType')}</div>
                                </TableHead>
                                <TableHead className="w-[120px]">Color</TableHead>
                                <TableHead
                                    className="w-[200px] cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('measuredBy' as any)}
                                >
                                    <div className="flex items-center">Measured By {getSortIcon('measuredBy' as any)}</div>
                                </TableHead>
                                <TableHead className="w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                            {/* Filter Row */}
                            <TableRow className="hover:bg-transparent bg-muted/30">
                                <TableCell className="py-1">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                        <Input
                                            placeholder="Search key..."
                                            className="h-7 pl-7 text-[10px]"
                                            value={filters.key}
                                            onChange={(e) => setFilters(f => ({ ...f, key: e.target.value }))}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="py-1">
                                    <Select
                                        value={filters.showInSummary}
                                        onValueChange={(v) => setFilters(f => ({ ...f, showInSummary: v }))}
                                    >
                                        <SelectTrigger className="h-7 text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="yes">Yes</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="py-1">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                        <Input
                                            placeholder="Search name..."
                                            className="h-7 pl-7 text-[10px]"
                                            value={filters.label}
                                            onChange={(e) => setFilters(f => ({ ...f, label: e.target.value }))}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="py-1">
                                    <Select
                                        value={filters.analyticsType}
                                        onValueChange={(v) => setFilters(f => ({ ...f, analyticsType: v }))}
                                    >
                                        <SelectTrigger className="h-7 text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            {ANALYTICS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="py-1" /> {/* Color filter not needed yet */}
                                <TableCell className="py-1">
                                    <Select
                                        value={filters.measuredBy}
                                        onValueChange={(v) => setFilters(f => ({ ...f, measuredBy: v }))}
                                    >
                                        <SelectTrigger className="h-7 text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="yes">Measured</SelectItem>
                                            <SelectItem value="no">Direct</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="py-1 text-right">
                                    {(filters.key || filters.label || filters.showInSummary !== "all" || filters.analyticsType !== "all" || filters.measuredBy !== "all") && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                            onClick={() => setFilters({
                                                key: "",
                                                label: "",
                                                showInSummary: "all",
                                                analyticsType: "all",
                                                measuredBy: "all"
                                            })}
                                        >
                                            <X className="h-3 w-3 mr-1" /> Clear
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedRoles.map((role) => {
                                const isDirty = dirty[role.key];
                                const current = { ...role, ...edits[role.key] };

                                return (
                                    <TableRow key={role.key} className={cn(isDirty && "bg-primary/5")}>
                                        <TableCell className="font-mono text-[11px]">
                                            <Badge variant="outline" className="font-mono border-muted-foreground/20">{role.key}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={current.showInSummary ?? false}
                                                onCheckedChange={(checked) => handleEdit(role.key, 'showInSummary', checked)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={current.label}
                                                onChange={(e) => handleEdit(role.key, 'label', e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={current.analyticsType}
                                                onValueChange={(val) => {
                                                    handleEdit(role.key, 'analyticsType', val);
                                                    // Clear measuredBy if changing away from NONE
                                                    if (val !== 'NONE' && current.measuredBy) {
                                                        handleEdit(role.key, 'measuredBy', null);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ANALYTICS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={current.color}
                                                onValueChange={(val) => handleEdit(role.key, 'color', val)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full bg-${current.color}-500`}
                                                            style={{ backgroundColor: current.color }} // Fallback
                                                        />
                                                        <span className="capitalize">{current.color}</span>
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COLORS.map(c => (
                                                        <SelectItem key={c} value={c}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-3 h-3 rounded-full bg-${c}-500`} style={{ backgroundColor: c }} />
                                                                <span className="capitalize">{c}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={!!current.measuredBy}
                                                    disabled={current.analyticsType !== 'NONE'}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            // Default to first available role that isn't this one
                                                            const firstOther = roles.find(r => r.key !== role.key);
                                                            handleEdit(role.key, 'measuredBy', firstOther?.key || null);
                                                        } else {
                                                            handleEdit(role.key, 'measuredBy', null);
                                                        }
                                                    }}
                                                />
                                                {current.measuredBy && (
                                                    <Select
                                                        value={current.measuredBy}
                                                        onValueChange={(val) => handleEdit(role.key, 'measuredBy', val)}
                                                    >
                                                        <SelectTrigger className="h-8 w-[120px]">
                                                            <Link2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles.filter(r => r.key !== role.key).map(r => (
                                                                <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isDirty && (
                                                <Button size="sm" variant="ghost" onClick={() => handleSave(role.key)}>
                                                    <Save className="h-4 w-4 text-green-600" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {processedRoles.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="h-8 w-8 opacity-20" />
                                            <p>No roles match your filters.</p>
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-xs"
                                                onClick={() => setFilters({
                                                    key: "",
                                                    label: "",
                                                    showInSummary: "all",
                                                    analyticsType: "all",
                                                    measuredBy: "all"
                                                })}
                                            >
                                                Clear all filters
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
