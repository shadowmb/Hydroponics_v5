import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../ui/card';
import { type DailyResourceData } from '../../../services/api/resourceAnalytics.service';
import { FileDown, Calendar, ArrowUpDown, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { format } from 'date-fns';

interface ResourceDetailsTableProps {
    data: DailyResourceData[];
    columns?: string[]; // Optional: if provided, show only these columns
    loading: boolean;
    roleLabels?: Record<string, string>; // Map: key -> display label
}

export function ResourceDetailsTable({ data, columns, loading, roleLabels = {} }: ResourceDetailsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // Get display name from roleLabels or fallback to key
    const getDisplayName = (key: string) => roleLabels[key] || key;

    // Define columns dynamically
    const tableColumns = useMemo<ColumnDef<DailyResourceData>[]>(() => {
        if (!data || data.length === 0) return [];

        const displayColumns = columns && columns.length > 0
            ? columns
            : Array.from(new Set(data.flatMap(d => Object.keys(d.resources || {})))).sort();

        const cols: ColumnDef<DailyResourceData>[] = [
            {
                accessorKey: 'date',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="p-0 hover:bg-transparent"
                        >
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            Дата
                            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    );
                },
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-medium">
                        {format(new Date(row.getValue('date')), 'dd.MM.yyyy')}
                    </span>
                ),
            },
            ...displayColumns.map(key => ({
                id: key,
                accessorFn: (row) => row.resources[key],
                header: ({ column }) => (
                    <div className="text-right">
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="p-0 hover:bg-transparent"
                        >
                            {getDisplayName(key)}
                            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    </div>
                ),
                cell: ({ row }) => {
                    const val = row.original.resources[key];
                    return (
                        <div className="text-right font-mono">
                            {val !== undefined ? val.toFixed(2) : '-'}
                        </div>
                    );
                },
            } as ColumnDef<DailyResourceData>))
        ];

        return cols;
    }, [data, columns, roleLabels]); // Re-create if data keys or labels change

    const table = useReactTable({
        data,
        columns: tableColumns,
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

    if (loading) {
        return <div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg"></div>;
    }

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-medium">Детайлни данни</CardTitle>
                <div className="flex items-center gap-2">
                    {/* Placeholder for future Export functionality */}
                    <Button variant="ghost" size="sm" className="h-8 gap-2" disabled>
                        <FileDown className="h-3.5 w-3.5" />
                        Експорт (CSV)
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <TableHead key={header.id} className={header.column.id === 'date' ? 'w-[150px]' : 'min-w-[100px]'}>
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
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                                        Няма резултати.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Показани {table.getRowModel().rows.length} от {data.length} записа
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Записи на страница</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
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
                        Стр. {table.getState().pagination.pageIndex + 1} от {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronFirst className="h-4 w-4" />
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
                            <ChevronLast className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
