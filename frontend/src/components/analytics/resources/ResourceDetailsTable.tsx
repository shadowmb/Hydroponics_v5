import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { type DailyResourceData } from '../../../services/api/resourceAnalytics.service';
import { FileDown, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { format } from 'date-fns';

interface ResourceDetailsTableProps {
    data: DailyResourceData[];
    columns?: string[]; // Optional: if provided, show only these columns
    loading: boolean;
}

export function ResourceDetailsTable({ data, columns, loading }: ResourceDetailsTableProps) {
    if (loading) {
        return <div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg"></div>;
    }

    if (!data || data.length === 0) {
        return null; // Don't show empty table container if no data
    }

    // Determine columns if not provided
    const displayColumns = columns && columns.length > 0
        ? columns
        : Array.from(new Set(data.flatMap(d => Object.keys(d.resources || {})))).sort();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-medium">Детайлни данни</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 gap-2" disabled>
                    <FileDown className="h-3.5 w-3.5" />
                    Експорт (CSV)
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border max-h-[500px] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow>
                                <TableHead className="w-[150px]">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Дата
                                    </div>
                                </TableHead>
                                {displayColumns.map(col => (
                                    <TableHead key={col} className="text-right capitalize min-w-[100px]">
                                        {col}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-mono text-xs font-medium">
                                        {format(new Date(row.date), 'dd.MM.yyyy')}
                                    </TableCell>
                                    {displayColumns.map(col => {
                                        const val = row.resources[col];
                                        return (
                                            <TableCell key={col} className="text-right font-mono">
                                                {val !== undefined ? val.toFixed(2) : '-'}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
