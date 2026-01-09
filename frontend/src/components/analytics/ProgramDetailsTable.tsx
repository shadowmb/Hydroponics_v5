
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
import { format } from 'date-fns';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import type { AnalyticsDataRow } from '../../services/analyticsService';

interface ProgramDetailsTableProps {
    data: AnalyticsDataRow[];
    loading: boolean;
}

export function ProgramDetailsTable({ data, loading }: ProgramDetailsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // Helper for duration formatting
    const formatDuration = (ms: number | null) => {
        if (ms === null || ms === undefined) return '-';
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    // Helper for value formatting
    const formatValue = (val: number | null, unit: string) => {
        if (val === null || val === undefined) return '-';
        return `${val.toFixed(2)} ${unit}`;
    };

    // Define columns
    const columns = useMemo<ColumnDef<AnalyticsDataRow>[]>(() => [
        {
            accessorKey: 'timestamp',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Дата/Час
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="font-mono text-xs">
                    {format(new Date(row.getValue('timestamp')), 'dd.MM HH:mm:ss')}
                </div>
            ),
        },
        {
            accessorKey: 'device',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 hover:bg-transparent"
                >
                    Устройство
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => row.getValue('device') || '-',
        },
        {
            accessorKey: 'action',
            header: 'Действие',
            cell: ({ row }) => {
                const action = row.getValue('action') as string;
                return (
                    <Badge variant={
                        action === 'READ' ? 'secondary' :
                            action === 'DOSE' ? 'default' :
                                action === 'PULSE_ON' ? 'outline' :
                                    'secondary'
                    }>
                        {action}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'value',
            header: () => <div className="text-right">Стойност</div>,
            cell: ({ row }) => {
                const original = row.original;
                // Logic for IF/LOOP blocks
                if (['IF', 'LOOP'].includes(original.blockType)) {
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant={original.value === 1 ? 'default' : 'destructive'}
                                className={original.value === 1 ? 'bg-green-600 hover:bg-green-700' : ''}>
                                {original.value === 1 ? 'TRUE' : 'FALSE'}
                            </Badge>
                            {original.metadata?.logData?.leftValue !== undefined ? (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {original.metadata.logData.leftValue} {original.metadata.logData.operator} {original.metadata.logData.rightValue}
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {original.message?.split('=>')[0] || original.message}
                                </span>
                            )}
                        </div>
                    );
                }
                // Logic for Sensor/Actuator
                return (
                    <div className="text-right font-mono">
                        {original.volume
                            ? `${original.volume.toFixed(1)} ml`
                            : formatValue(original.value, original.unit)
                        }
                    </div>
                );
            },
        },
        {
            accessorKey: 'duration',
            header: () => <div className="text-right">Време</div>,
            cell: ({ row }) => (
                <div className="text-right font-mono">
                    {formatDuration(row.getValue('duration'))}
                </div>
            ),
        },
        {
            accessorKey: 'window',
            header: 'Прозорец',
            cell: ({ row }) => (
                <div className="text-muted-foreground text-xs">
                    {row.getValue('window') || '-'}
                </div>
            ),
        },
    ], []);

    const table = useReactTable({
        data,
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

    if (loading) { // While loading we might want to keep showing table or show skeleton, but existing logic hides it
        // We will stick to parent handling loading mostly, but here for safety
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
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
                                    className="h-24 text-center"
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
                                {[10, 20, 30, 50].map((pageSize) => (
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
        </div>
    );
}
