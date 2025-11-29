import React, { useState, useMemo } from 'react';
import type { BoardDefinition } from '@/services/firmwareBuilderService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, MessageSquare, Share2, ArrowRightLeft, LayoutGrid, List, Search, Filter } from 'lucide-react';

interface Props {
    boards: BoardDefinition[];
    selectedBoardId: string;
    onSelect: (id: string) => void;
}

const InterfaceBadge: React.FC<{
    icon: React.ReactNode;
    label: string;
    count: number;
    pins?: (number | string)[];
}> = ({ icon, label, count, pins }) => {
    if (count === 0) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1 cursor-help hover:bg-muted">
                        {icon}
                        <span>{label}: {count}</span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold mb-1">{label} Pins:</p>
                    <p className="text-xs max-w-[200px] break-words">
                        {pins && pins.length > 0 ? pins.join(', ') : 'No specific pins mapped'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export const BoardSelectionStep: React.FC<Props> = ({ boards, selectedBoardId, onSelect }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [filterArch, setFilterArch] = useState<string>('all');

    // Extract unique architectures for filter
    const architectures = useMemo(() => {
        const archs = Array.from(new Set(boards.map(b => b.architecture)));
        return ['all', ...archs];
    }, [boards]);

    // Filter boards
    const filteredBoards = useMemo(() => {
        return boards.filter(board => {
            const matchesSearch = board.name.toLowerCase().includes(search.toLowerCase()) ||
                board.description.toLowerCase().includes(search.toLowerCase());
            const matchesArch = filterArch === 'all' || board.architecture === filterArch;
            return matchesSearch && matchesArch;
        });
    }, [boards, search, filterArch]);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/20 p-3 rounded-lg border">
                <div className="flex gap-2 w-full md:w-auto flex-1">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search boards..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterArch} onValueChange={setFilterArch}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Architecture" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Architectures</SelectItem>
                            {architectures.filter(a => a !== 'all').map(arch => (
                                <SelectItem key={arch} value={arch}>{arch}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-1 border rounded-md p-1 bg-background">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {filteredBoards.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    No boards found matching your criteria.
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBoards.map(board => (
                        <Card
                            key={board.id}
                            className={`cursor-pointer transition-all hover:border-primary ${selectedBoardId === board.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                            onClick={() => onSelect(board.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{board.name}</h3>
                                    <Badge variant="secondary">{board.architecture}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">{board.description}</p>

                                {/* Electrical Specs */}
                                {board.electrical_specs && (
                                    <div className="mb-4 p-2 bg-muted/50 rounded-md text-xs grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="font-semibold block">Logic Voltage</span>
                                            {board.electrical_specs.logic_voltage}
                                        </div>
                                        <div>
                                            <span className="font-semibold block">Input Voltage</span>
                                            {board.electrical_specs.input_voltage}
                                        </div>
                                        <div>
                                            <span className="font-semibold block">Max Current/Pin</span>
                                            {board.electrical_specs.max_current_per_pin}
                                        </div>
                                        <div>
                                            <span className="font-semibold block">ADC Resolution</span>
                                            {board.electrical_specs.analog_resolution}
                                        </div>
                                    </div>
                                )}

                                {/* Pin Counts */}
                                <div className="text-xs space-y-1 text-muted-foreground mb-4">
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="outline">Digital: {board.pins.digital_count}</Badge>
                                        <Badge variant="outline">Analog In: {board.pins.analog_input_count}</Badge>

                                        <InterfaceBadge
                                            icon={<Activity className="w-3 h-3" />}
                                            label="PWM"
                                            count={board.pins.pwm_pins.length}
                                            pins={board.pins.pwm_pins}
                                        />
                                        <InterfaceBadge
                                            icon={<MessageSquare className="w-3 h-3" />}
                                            label="UART"
                                            count={board.pins.uart_pins?.length || 0}
                                            pins={board.pins.uart_pins}
                                        />
                                        <InterfaceBadge
                                            icon={<Share2 className="w-3 h-3" />}
                                            label="I2C"
                                            count={board.pins.i2c_pins?.length || 0}
                                            pins={board.pins.i2c_pins}
                                        />
                                        <InterfaceBadge
                                            icon={<ArrowRightLeft className="w-3 h-3" />}
                                            label="SPI"
                                            count={board.pins.spi_pins?.length || 0}
                                            pins={board.pins.spi_pins}
                                        />
                                    </div>
                                </div>

                                {/* Constraints */}
                                {board.constraints && board.constraints.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {board.constraints.map((constraint, idx) => (
                                            <div key={idx} className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                                                • {constraint}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Architecture</TableHead>
                                <TableHead>Pins</TableHead>
                                <TableHead>Interfaces</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBoards.map(board => (
                                <TableRow key={board.id} className={selectedBoardId === board.id ? 'bg-muted/50' : ''}>
                                    <TableCell className="font-medium">
                                        <div>{board.name}</div>
                                        <div className="text-xs text-muted-foreground">{board.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{board.architecture}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            <Badge variant="outline" className="text-xs">D: {board.pins.digital_count}</Badge>
                                            <Badge variant="outline" className="text-xs">A: {board.pins.analog_input_count}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            <InterfaceBadge
                                                icon={<Activity className="w-3 h-3" />}
                                                label="PWM"
                                                count={board.pins.pwm_pins.length}
                                                pins={board.pins.pwm_pins}
                                            />
                                            <InterfaceBadge
                                                icon={<MessageSquare className="w-3 h-3" />}
                                                label="UART"
                                                count={board.pins.uart_pins?.length || 0}
                                                pins={board.pins.uart_pins}
                                            />
                                            <InterfaceBadge
                                                icon={<Share2 className="w-3 h-3" />}
                                                label="I2C"
                                                count={board.pins.i2c_pins?.length || 0}
                                                pins={board.pins.i2c_pins}
                                            />
                                            <InterfaceBadge
                                                icon={<ArrowRightLeft className="w-3 h-3" />}
                                                label="SPI"
                                                count={board.pins.spi_pins?.length || 0}
                                                pins={board.pins.spi_pins}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant={selectedBoardId === board.id ? "default" : "outline"}
                                            onClick={() => onSelect(board.id)}
                                        >
                                            {selectedBoardId === board.id ? "Selected" : "Select"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};
