import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Trash2, Edit, Play, Activity, Droplet, Thermometer, Zap, Cpu,
    RefreshCw, AlertTriangle, Info, ArrowUpDown, ChevronLeft,
    ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeviceListTableProps {
    devices: any[];
    controllers: any[];
    relays: any[];
    onEdit?: (device: any) => void;
    onRefreshDevice?: (device: any) => void;
    onTest: (device: any) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export const DeviceListTable: React.FC<DeviceListTableProps> = ({
    devices,
    controllers,
    relays,
    onEdit,
    onRefreshDevice,
    onTest,
    onDelete
}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // Helper functions
    const getIcon = (type: string) => {
        switch (type) {
            case 'ph': return <Droplet className="h-4 w-4 text-blue-500" />;
            case 'temp': return <Thermometer className="h-4 w-4 text-red-500" />;
            case 'ec': return <Activity className="h-4 w-4 text-green-500" />;
            case 'relay': return <Zap className="h-4 w-4 text-yellow-500" />;
            default: return <Cpu className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatLastCheck = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '< 1 min';
        if (diffMins < 60) return `${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} h`;
        return `${Math.floor(diffHours / 24)} d`;
    };

    const getDeviceHealth = (device: any) => device.status || 'offline';

    const getConfigStatus = (device: any) => {
        if (!device.isEnabled) return { type: 'disabled', label: 'Disabled' };

        let controllerId = device.hardware?.parentId;
        if (!controllerId && device.hardware?.relayId) {
            const relay = relays.find(r => r._id === device.hardware.relayId);
            controllerId = relay?.controllerId?._id || relay?.controllerId;
        }

        if (!controllerId) return { type: 'enabled', label: 'Enabled' };

        const ctrl = controllers.find(c => c._id === controllerId);
        if (!ctrl || !ctrl.capabilities || ctrl.capabilities.length === 0) {
            return { type: 'enabled', label: 'Enabled' };
        }

        const requiredCmd = device.config?.driverId?.commands?.READ?.hardwareCmd?.toLowerCase();
        if (!requiredCmd) return { type: 'enabled', label: 'Enabled' };

        if (!ctrl.capabilities.includes(requiredCmd)) {
            return { type: 'warning', label: 'Missing Cmd', tooltip: requiredCmd.toUpperCase() };
        }

        return { type: 'enabled', label: 'Enabled' };
    };

    // Calculate Controller Name for each device for sorting/filtering
    const getControllerName = (device: any) => {
        if (device.hardware?.parentId) {
            const ctrl = controllers.find(c => c._id === device.hardware.parentId);
            return ctrl ? ctrl.name : 'Unknown';
        }
        if (device.hardware?.relayId) {
            const relay = relays.find(r => r._id === device.hardware.relayId);
            if (relay) {
                const ctrlName = relay.controllerId?.name;
                return ctrlName || 'Unassigned Relay';
            }
            return 'Unknown Relay';
        }
        return 'Unassigned';
    };

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 hover:bg-transparent"
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const device = row.original;
                return (
                    <div className="font-medium flex items-center gap-2">
                        {getIcon(device.config?.driverId?.physicalType)}
                        <span>{device.name}</span>
                        {device.metadata?.description && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[300px] text-sm">
                                            {device.metadata.description}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'type',
            accessorFn: (row) => row.config?.driverId?.name || 'Unknown',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 hover:bg-transparent"
                >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge>,
        },
        {
            id: 'controllerName', // Virtual column for sorting/filtering
            accessorFn: (row) => getControllerName(row),
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 hover:bg-transparent"
                >
                    Controller
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const device = row.original;
                // Custom render logic (complex) but sorting is based on the string value
                if (device.hardware?.parentId) {
                    const ctrl = controllers.find(c => c._id === device.hardware.parentId);
                    return ctrl ? (
                        <span className="font-medium">{ctrl.name}</span>
                    ) : <span className="text-muted-foreground">Unknown</span>;
                }
                if (device.hardware?.relayId) {
                    const relay = relays.find(r => r._id === device.hardware.relayId);
                    if (relay) {
                        const ctrlName = relay.controllerId?.name;
                        return (
                            <div className="flex flex-col">
                                <span className="font-medium">{ctrlName || 'Unassigned Relay'}</span>
                                <span className="text-xs text-muted-foreground">via {relay.name}</span>
                            </div>
                        );
                    }
                    return <span className="text-muted-foreground">Unknown Relay</span>;
                }
                return (
                    <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                        Unassigned
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            id: 'connection',
            header: 'Connection',
            cell: ({ row }) => {
                const device = row.original;
                return (
                    <div className="text-sm">
                        {device.hardware?.parentId ? (
                            <>
                                {device.hardware.port ? (
                                    <>
                                        <span className="text-muted-foreground">Port: </span>
                                        <Badge variant="secondary" className="font-mono">{device.hardware.port}</Badge>
                                    </>
                                ) : (Array.isArray(device.hardware.pins) && device.hardware.pins.length > 0) ? (
                                    <div className="flex flex-col gap-1">
                                        {device.hardware.pins.map((pin: any, index: number) => (
                                            <div key={index} className="flex items-center gap-1">
                                                <span className="text-muted-foreground text-xs">{pin.role}:</span>
                                                <Badge variant="secondary" className="font-mono text-xs">{pin.portId}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (device.hardware.pins && !Array.isArray(device.hardware.pins) && Object.keys(device.hardware.pins).length > 0) ? (
                                    <div className="flex flex-col gap-1">
                                        {Object.entries(device.hardware.pins).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-1">
                                                <span className="text-muted-foreground text-xs">{key}:</span>
                                                <Badge variant="secondary" className="font-mono text-xs">{value as string}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground italic">-</span>
                                )}
                            </>
                        ) : device.hardware?.relayId ? (
                            <>
                                <span className="text-muted-foreground">Relay Ch: </span>
                                <Badge variant="secondary" className="font-mono">{device.hardware.channel}</Badge>
                            </>
                        ) : (
                            <span className="text-muted-foreground italic">-</span>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 hover:bg-transparent"
                >
                    Health
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const health = getDeviceHealth(row.original);
                return (
                    <Badge
                        variant={health === 'online' ? 'default' : health === 'error' ? 'destructive' : 'secondary'}
                        className={health === 'error' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                        {health === 'online' ? 'Online' : health === 'error' ? 'Error' : 'Offline'}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: 'lastConnectionCheck',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4 hover:bg-transparent"
                >
                    Last Check
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-[60px]">
                        {formatLastCheck(row.getValue('lastConnectionCheck'))}
                    </span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => onRefreshDevice && onRefreshDevice(row.original)}
                        title="Refresh Status"
                    >
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                </div>
            )
        },
        {
            id: 'config',
            header: 'Config',
            cell: ({ row }) => {
                const status = getConfigStatus(row.original);
                if (status.type === 'warning') {
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 cursor-help">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {status.label}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">Controller missing: <code className="font-mono">{status.tooltip}</code></p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                }
                return (
                    <Badge
                        variant={status.type === 'enabled' ? 'outline' : 'secondary'}
                        className={status.type === 'enabled' ? "border-green-500 text-green-600" : ""}
                    >
                        {status.label}
                    </Badge>
                );
            }
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => {
                const device = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => onTest(device)} title="Test Device">
                            <Play className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Edit"
                            onClick={() => onEdit && onEdit(device)}
                            disabled={!onEdit}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => onDelete(device._id, e)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ], [controllers, relays, onEdit, onRefreshDevice, onTest, onDelete]);

    const table = useReactTable({
        data: devices,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            pagination,
            columnVisibility,
        },
    });

    // Get unique controller names for the filter dropdown
    const uniqueControllerNames = useMemo(() => {
        const names = new Set(devices.map(d => getControllerName(d)));
        return Array.from(names).sort();
    }, [devices, controllers, relays]);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full md:w-auto">
                    <Input
                        placeholder="Filter devices..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="w-full sm:w-[250px]"
                    />

                    {/* Status Filter */}
                    <Select
                        value={(table.getColumn('status')?.getFilterValue() as string[])?.[0] || 'all'}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                table.getColumn('status')?.setFilterValue(undefined);
                            } else {
                                table.getColumn('status')?.setFilterValue([value]);
                            }
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Status: All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Status: All</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Controller Filter */}
                    <Select
                        value={(table.getColumn('controllerName')?.getFilterValue() as string[])?.[0] || 'all'}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                table.getColumn('controllerName')?.setFilterValue(undefined);
                            } else {
                                table.getColumn('controllerName')?.setFilterValue([value]);
                            }
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Controller: All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Controller: All</SelectItem>
                            {uniqueControllerNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
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
                    Page {table.getState().pagination.pageIndex + 1} of{' '}
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
        </div>
    );
};
