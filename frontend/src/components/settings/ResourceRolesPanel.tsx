
import { useEffect, useState } from "react";
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
import { RefreshCw, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ResourceRolesPanel() {
    const [roles, setRoles] = useState<ResourceRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [dirty, setDirty] = useState<Record<string, boolean>>({});
    const [edits, setEdits] = useState<Record<string, Partial<ResourceRole>>>({});

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

    const ANALYTICS_TYPES: AnalyticsType[] = ['SUM', 'DELTA', 'TREND', 'NONE'];
    const COLORS = ['gray', 'red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'orange'];

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
                            <TableRow>
                                <TableHead className="w-[150px]">System Key</TableHead>
                                <TableHead className="w-[80px] text-center">Show</TableHead>
                                <TableHead>Display Name</TableHead>
                                <TableHead className="w-[150px]">Calculation</TableHead>
                                <TableHead className="w-[120px]">Color</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => {
                                const isDirty = dirty[role.key];
                                const current = { ...role, ...edits[role.key] };

                                return (
                                    <TableRow key={role.key}>
                                        <TableCell className="font-mono text-xs">
                                            <Badge variant="outline">{role.key}</Badge>
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
                                                onValueChange={(val) => handleEdit(role.key, 'analyticsType', val)}
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
                                            {isDirty && (
                                                <Button size="sm" variant="ghost" onClick={() => handleSave(role.key)}>
                                                    <Save className="h-4 w-4 text-green-600" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {roles.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No roles found. Click "Sync Templates" to discover roles.
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
