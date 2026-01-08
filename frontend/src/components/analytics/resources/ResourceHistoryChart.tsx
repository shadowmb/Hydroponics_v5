import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { DailyResourceData } from '../../../services/api/resourceAnalytics.service';

interface ResourceHistoryChartProps {
    data: DailyResourceData[];
    availableRoles: string[]; // List of roles that CAN be displayed (from Settings)
    loading: boolean;
    defaultSelected?: string[]; // Initial selected roles (default: empty)
    roleLabels?: Record<string, string>; // Map: key -> display label
}

const COLORS = [
    "#2563eb", // blue-600
    "#16a34a", // green-600
    "#dc2626", // red-600
    "#d97706", // amber-600
    "#7c3aed", // violet-600
    "#db2777", // pink-600
    "#0891b2", // cyan-600
    "#4b5563", // gray-600
];

export function ResourceHistoryChart({ data, availableRoles, loading, defaultSelected = [], roleLabels = {} }: ResourceHistoryChartProps) {
    // Get display name from roleLabels or fallback to key
    const getDisplayName = (key: string) => roleLabels[key] || key;
    // Selected roles (user can toggle via checkboxes)
    const [selectedRoles, setSelectedRoles] = useState<string[]>(defaultSelected);

    // Reset selection if availableRoles changes
    useEffect(() => {
        setSelectedRoles(defaultSelected);
    }, [availableRoles, defaultSelected]);

    const handleRoleToggle = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    // Format data for Recharts
    const chartData = useMemo(() => {
        return data.map(day => ({
            date: day.date,
            ...day.resources
        }));
    }, [data]);

    if (loading) {
        return <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Зареждане на графика...</div>;
    }

    if (data.length === 0) {
        return <div className="h-[400px] w-full bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">Няма данни за графика</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">История на потребление и стойности</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                    Изберете ресурси за визуализация:
                </p>

                {/* Role Selectors */}
                <div className="flex flex-wrap gap-4 mt-2">
                    {availableRoles.map((role, idx) => (
                        <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                                id={`chart-role-${role}`}
                                checked={selectedRoles.includes(role)}
                                onCheckedChange={() => handleRoleToggle(role)}
                            />
                            <Label
                                htmlFor={`chart-role-${role}`}
                                className="text-xs cursor-pointer"
                                style={{ color: selectedRoles.includes(role) ? COLORS[idx % COLORS.length] : undefined }}
                            >
                                {getDisplayName(role)}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {selectedRoles.length === 0 ? (
                    <div className="h-[400px] w-full bg-muted/10 rounded-lg flex items-center justify-center text-muted-foreground">
                        Изберете поне един ресурс за да видите графиката
                    </div>
                ) : (
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tickFormatter={(val) => val.split('-').slice(1).join('.')}
                                />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#666' }}
                                />
                                <Legend />
                                {selectedRoles.map((role, idx) => (
                                    <Line
                                        key={role}
                                        type="monotone"
                                        dataKey={role}
                                        stroke={COLORS[idx % COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
