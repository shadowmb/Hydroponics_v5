import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../ui/table';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { SimilarCasesCriterion, SimilarCasesResponse } from '../../../services/api/similarCases.service';

interface SimilarCasesResultsTableProps {
    results: SimilarCasesResponse;
    filteringCriteria: SimilarCasesCriterion[];
    showOnlyRoles: string[];
    getRoleLabel: (key: string) => string;
    getRoleUnit: (key: string) => string;
}

type SimilarCaseRecord = SimilarCasesResponse['records'][0];

export function SimilarCasesResultsTable({
    results,
    filteringCriteria,
    showOnlyRoles,
    getRoleLabel,
    getRoleUnit,
}: SimilarCasesResultsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // Get all resource roles (filtering + show-only)


    // Helper to get the matching measurement for a criterion/role
    const getMeasurement = (record: SimilarCaseRecord, role: string, source?: string): any => {
        if (record.measurements) {
            // Find measurement that matches role and source (if specified)
            // If source is NOT specified, we match the first one with that role? 
            // Or ideally the "primary" one?
            // For now: First match.
            return record.measurements.find(m =>
                m.role === role &&
                (!source || m.source === source)
            );
        }
        // Fallback to old resources map
        return record.resources[role];
    };

    const getResourceValue = (record: SimilarCaseRecord, role: string, source?: string, fieldOverride?: string): number | null => {
        const res = getMeasurement(record, role, source);
        if (!res) return null;

        const criterion = filteringCriteria.find(c => c.role === role && c.analyticsLabel === source);
        const field = fieldOverride || criterion?.field || 'value';

        switch (field) {
            case 'min': return res.min !== undefined ? res.min : null;
            case 'max': return res.max !== undefined ? res.max : null;
            case 'average': return res.average !== undefined ? res.average : null;
            case 'startValue': return res.startValue !== undefined ? res.startValue : null;
            case 'endValue': return res.endValue !== undefined ? res.endValue : null;
            case 'value':
            default: return res.value !== undefined ? res.value : null;
        }
    };

    const formatResourceValue = (record: SimilarCaseRecord, role: string, source?: string, fieldOverride?: string): string => {
        const res = getMeasurement(record, role, source);
        if (!res) return '-';

        // Use override if provided, otherwise try to find matching criterion
        let field = fieldOverride;
        if (!field) {
            const criterion = filteringCriteria.find(c => c.role === role && c.analyticsLabel === source);
            field = criterion?.field || 'value';
        }

        const hasRequestedField = (() => {
            switch (field) {
                case 'min': return res.min !== undefined;
                case 'max': return res.max !== undefined;
                case 'average': return res.average !== undefined;
                case 'startValue': return res.startValue !== undefined;
                case 'endValue': return res.endValue !== undefined;
                case 'value': return res.value !== undefined;
                default: return false;
            }
        })();

        if (hasRequestedField) {
            const val = getResourceValue(record, role, source, field);
            return val !== null ? val.toFixed(2) : '-';
        } else {
            if (res.startValue !== undefined && res.endValue !== undefined) {
                return `${res.startValue.toFixed(1)}→${res.endValue.toFixed(1)}`;
            } else if (res.value !== undefined) {
                return res.value.toFixed(2);
            } else {
                return '-';
            }
        }
    }

    // Define columns
    const columns = useMemo<ColumnDef<SimilarCaseRecord>[]>(() => {
        const staticColumns: ColumnDef<SimilarCaseRecord>[] = [
            {
                accessorKey: 'date',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Дата
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div className="text-xs font-medium">{row.getValue('date')}</div>,
            },
            {
                id: 'programName',
                accessorFn: (row) => row.context.programName,
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Програма
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground">
                        {row.original.context.programName || '-'}
                    </div>
                ),
            },
            {
                id: 'flowNames',
                header: 'Поток',
                cell: ({ row }) => {
                    const uniqueFlows = Array.from(new Set(
                        row.original.measurements?.map(m => m.flowName || m.flowId) || []
                    )).filter(Boolean);

                    return (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {uniqueFlows.length > 0 ? uniqueFlows.map(f => (
                                <span key={f} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    {f}
                                </span>
                            )) : <span className="text-xs text-muted-foreground">-</span>}
                        </div>
                    );
                }
            },
            {
                id: 'analyticsLabels',
                header: 'Източници',
                cell: ({ row }) => {
                    const uniqueSources = Array.from(new Set(
                        row.original.measurements?.map(m => m.source) || []
                    )).filter(Boolean).sort();

                    return (
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {uniqueSources.length > 0 ? uniqueSources.map(s => (
                                <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                    {s}
                                </span>
                            )) : <span className="text-xs text-muted-foreground">-</span>}
                        </div>
                    );
                }
            },
        ];

        // 1. Columns for Filtering Criteria
        const criteriaColumns: ColumnDef<SimilarCaseRecord>[] = filteringCriteria.map((fc, idx) => {
            const uniqueId = `crit_${fc.role}_${fc.analyticsLabel || 'any'}_${idx}`;
            return {
                id: uniqueId,
                accessorFn: (row) => getResourceValue(row, fc.role, fc.analyticsLabel, fc.field),
                header: ({ column }) => (
                    <div className="text-right">
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="p-0 hover:bg-transparent"
                        >
                            <span className="flex flex-col items-end">
                                <span>{getRoleLabel(fc.role)}</span>
                                {fc.analyticsLabel && <span className="text-[10px] text-muted-foreground">({fc.analyticsLabel})</span>}
                                {fc.field && fc.field !== 'value' && <span className="text-[10px] italic text-muted-foreground">({fc.field})</span>}
                            </span>
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ),
                cell: ({ row }) => {
                    const res = getMeasurement(row.original, fc.role, fc.analyticsLabel);
                    if (!res) return <div className="text-center text-muted-foreground text-xs">-</div>;
                    return (
                        <div className="text-right text-xs">
                            {formatResourceValue(row.original, fc.role, fc.analyticsLabel, fc.field)} {res.unit}
                        </div>
                    );
                }
            };
        });

        // 2. Columns for Show Only Roles
        // For distinctness, if a role is in showOnly, we simply show valid measurements?
        // Issue: If ShowOnly has 'ph', and we have 2 ph sources, which one to show?
        // We will default to showing the first one found, or maybe iterate unique sources?
        // Keeping it simple: One column per ShowOnly role, showing first source found.
        const showOnlyColumns: ColumnDef<SimilarCaseRecord>[] = showOnlyRoles.map((role, idx) => {
            const uniqueId = `show_${role}_${idx}`;
            return {
                id: uniqueId,
                accessorFn: (row) => getResourceValue(row, role), // No source preference
                header: ({ column }) => (
                    <div className="text-right">
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="p-0 hover:bg-transparent"
                        >
                            {getRoleLabel(role)} (Any)
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ),
                cell: ({ row }) => {
                    const res = getMeasurement(row.original, role); // No source preference
                    if (!res) return <div className="text-center text-muted-foreground text-xs">-</div>;
                    return (
                        <div className="text-right text-xs">
                            {formatResourceValue(row.original, role)} {res.unit}
                        </div>
                    );
                }
            };
        });

        return [...staticColumns, ...criteriaColumns, ...showOnlyColumns];
    }, [filteringCriteria, showOnlyRoles, getRoleLabel]);

    // Calculate averages from ALL records
    const averages = useMemo(() => {
        // Collect all definitions (Criteria + ShowOnly)
        const defs = [
            ...filteringCriteria.map(c => ({ role: c.role, source: c.analyticsLabel, field: c.field })),
            ...showOnlyRoles.map(r => ({ role: r, source: undefined, field: 'value' }))
        ];

        return defs.map(def => {
            const values = results.records
                .map(record => getResourceValue(record, def.role, def.source, def.field))
                .filter((v): v is number => v !== null);

            if (values.length === 0) return null;

            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            // Get unit from first record?
            const firstUnit = results.records.find(r => getMeasurement(r, def.role, def.source))?.measurements?.find(m => m.role === def.role)?.unit || getRoleUnit(def.role);

            return {
                role: def.role,
                source: def.source,
                avg,
                unit: firstUnit,
                label: getRoleLabel(def.role) + (def.source ? ` (${def.source})` : ''),
            };
        }).filter(Boolean);
    }, [results.records, filteringCriteria, showOnlyRoles, getRoleLabel, getRoleUnit]);

    const table = useReactTable({
        data: results.records,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination,
        },
    });

    return (
        <div className="space-y-3">
            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="bg-muted/50">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-xs"
                                >
                                    Няма намерени резултати.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {table.getPageCount() > 0 && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Редове на страница</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value: string) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Страница {table.getState().pagination.pageIndex + 1} от{' '}
                        {table.getPageCount()}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Averages Section */}
            <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-xs font-medium mb-2">📊 Средни стойности:</div>
                <div className="flex flex-wrap gap-4 text-xs">
                    {averages.map((avg: any) => (
                        <div key={avg.role}>
                            <span className="font-medium">{avg.label}:</span>{' '}
                            <span className="text-muted-foreground">
                                {avg.avg.toFixed(2)} {avg.unit}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
