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
    const resourceRoles = useMemo(
        () => [...filteringCriteria.map(c => c.role), ...showOnlyRoles],
        [filteringCriteria, showOnlyRoles]
    );

    // Helper to get the value for a specific field from resource data
    const getResourceValue = (record: SimilarCaseRecord, role: string): number | null => {
        const res = record.resources[role];
        if (!res) return null;

        const criterion = filteringCriteria.find(c => c.role === role);
        const field = criterion?.field || 'value';

        const resourceData = res as any;

        switch (field) {
            case 'min':
                return resourceData.min !== undefined ? resourceData.min : null;
            case 'max':
                return resourceData.max !== undefined ? resourceData.max : null;
            case 'average':
                return resourceData.average !== undefined ? resourceData.average : null;
            case 'startValue':
                return res.startValue !== undefined ? res.startValue : null;
            case 'endValue':
                return res.endValue !== undefined ? res.endValue : null;
            case 'value':
            default:
                return res.value !== undefined ? res.value : null;
        }
    };

    // Helper to format the display value
    const formatResourceValue = (record: SimilarCaseRecord, role: string): string => {
        const res = record.resources[role];
        if (!res) return '-';

        const criterion = filteringCriteria.find(c => c.role === role);
        const field = criterion?.field || 'value';
        const resourceData = res as any;

        // Check if requested field exists
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
                    return resourceData.min.toFixed(2);
                case 'max':
                    return resourceData.max.toFixed(2);
                case 'average':
                    return resourceData.average.toFixed(2);
                case 'startValue':
                    return res.startValue!.toFixed(2);
                case 'endValue':
                    return res.endValue!.toFixed(2);
                case 'value':
                default:
                    return res.value!.toFixed(2);
            }
        } else {
            // Fallback: show whatever data is available
            if (res.startValue !== undefined && res.endValue !== undefined) {
                return `${res.startValue.toFixed(1)}→${res.endValue.toFixed(1)}`;
            } else if (res.value !== undefined) {
                return res.value.toFixed(2);
            } else {
                return '-';
            }
        }
    };

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
                cell: ({ row }) => <div className="text-xs">{row.getValue('date')}</div>,
            },
            {
                id: 'context',
                accessorFn: (row) => row.context.flowName || row.context.programName,
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Програма/Поток
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground">
                        {row.original.context.flowName || row.original.context.programName}
                    </div>
                ),
            },
        ];

        // Dynamic resource columns
        const resourceColumns: ColumnDef<SimilarCaseRecord>[] = resourceRoles.map(role => ({
            id: role,
            accessorFn: (row) => getResourceValue(row, role),
            header: ({ column }) => (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="p-0 hover:bg-transparent"
                    >
                        {getRoleLabel(role)}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const res = row.original.resources[role];
                if (!res) {
                    return <div className="text-center text-muted-foreground text-xs">-</div>;
                }

                return (
                    <div className="text-right text-xs">
                        {formatResourceValue(row.original, role)} {res.unit}
                    </div>
                );
            },
        }));

        return [...staticColumns, ...resourceColumns];
    }, [resourceRoles, filteringCriteria, getRoleLabel]);

    // Calculate averages from ALL records (not just paginated)
    const averages = useMemo(() => {
        return resourceRoles.map(role => {
            const criterion = filteringCriteria.find(c => c.role === role);
            const field = criterion?.field || 'value';

            const values = results.records
                .map(record => {
                    const res = record.resources[role];
                    if (!res) return null;

                    const resourceData = res as any;

                    switch (field) {
                        case 'min': return resourceData.min;
                        case 'max': return resourceData.max;
                        case 'average': return resourceData.average;
                        case 'startValue': return res.startValue;
                        case 'endValue': return res.endValue;
                        case 'value':
                        default:
                            return res.value !== undefined ? res.value : res.endValue;
                    }
                })
                .filter((v): v is number => v !== undefined && v !== null);

            if (values.length === 0) return null;

            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            return {
                role,
                avg,
                unit: getRoleUnit(role),
                label: getRoleLabel(role),
            };
        }).filter(Boolean);
    }, [results.records, resourceRoles, filteringCriteria, getRoleLabel, getRoleUnit]);

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
