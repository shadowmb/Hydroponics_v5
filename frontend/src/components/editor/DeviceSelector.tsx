import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Droplet, Wind, Sun, Zap, Activity, ToggleRight, Box } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../ui/popover';
import { useStore } from '../../core/useStore';
import type { IDevice } from '../../../../shared/types';

interface DeviceSelectorProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    filterType?: 'SENSOR' | 'ACTUATOR'; // Optional filter
}

// Helper to get icon for category
const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
        case 'water': return <Droplet className="mr-2 h-4 w-4 text-blue-500" />;
        case 'air': return <Wind className="mr-2 h-4 w-4 text-sky-400" />;
        case 'light': return <Sun className="mr-2 h-4 w-4 text-yellow-500" />;
        case 'power': return <Zap className="mr-2 h-4 w-4 text-amber-500" />;
        case 'sensor': return <Activity className="mr-2 h-4 w-4 text-green-500" />;
        case 'actuator': return <ToggleRight className="mr-2 h-4 w-4 text-purple-500" />;
        default: return <Box className="mr-2 h-4 w-4 text-muted-foreground" />;
    }
};

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
    value,
    onChange,
    placeholder = "Select device...",
    filterType
}) => {
    const { devices } = useStore();
    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Extract unique categories dynamically
    const categories = useMemo(() => {
        const cats = new Set<string>(['All']);
        devices.forEach(d => {
            if (d.group) cats.add(d.group);
        });
        // Sort: All, Water, Air, Light, Power, Other...
        const priority = ['All', 'Water', 'Air', 'Light', 'Power', 'Other'];
        return Array.from(cats).sort((a, b) => {
            const idxA = priority.indexOf(a);
            const idxB = priority.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [devices]);

    // Extract unique tags dynamically
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        devices.forEach(d => {
            if (d.tags && Array.isArray(d.tags)) {
                d.tags.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort();
    }, [devices]);

    // Group devices by category (filtered)
    const groupedDevices = useMemo(() => {
        const groups: Record<string, IDevice[]> = {};
        const allDevices = Array.from(devices.values());

        allDevices.forEach(device => {
            // Use strict 'group' field from DB
            const category = device.group || 'Other';

            // 1. Filter by Type (Sensor/Actuator)
            if (filterType) {
                // Use strict filtering based on the 'type' field from the template
                // The template has "type": "SENSOR" or "ACTUATOR"
                // The device object has this type.
                const deviceType = (device.type || '').toUpperCase();

                // We want exact match or at least inclusion
                if (deviceType !== filterType) {
                    return;
                }
            }

            // 2. Filter by Selected Category
            if (selectedCategory !== 'All' && category !== selectedCategory) {
                return;
            }

            // 3. Filter by Selected Tags (OR Logic - show if matches ANY tag)
            // If no tags selected, show all
            if (selectedTags.length > 0) {
                if (!device.tags || !device.tags.some(t => selectedTags.includes(t))) {
                    return;
                }
            }

            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(device);
        });

        // Sort categories: Water, Air, Light, Power, then others
        const priority = ['Water', 'Air', 'Light', 'Power'];
        return Object.entries(groups).sort((a, b) => {
            const idxA = priority.indexOf(a[0]);
            const idxB = priority.indexOf(b[0]);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a[0].localeCompare(b[0]);
        });
    }, [devices, filterType, selectedCategory, selectedTags]);

    const selectedDevice = useMemo(() => {
        return devices.get(value || '');
    }, [devices, value]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedDevice ? (
                        <div className="flex items-center truncate">
                            {getCategoryIcon(selectedDevice.group || 'Other')}
                            <span className="truncate">{selectedDevice.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                {/* 1. Category Filter Bar */}
                <div className="flex items-center gap-1 p-2 border-b overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                                "h-7 px-2 text-xs flex items-center gap-1 rounded-full whitespace-nowrap",
                                selectedCategory === cat && "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat !== 'All' && getCategoryIcon(cat)}
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* 2. Tag Filter Dropdown (Multi-Select) */}
                {allTags.length > 0 && (
                    <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Filter by Tag:</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-2 flex items-center gap-1 bg-background border-dashed min-w-[100px] justify-start"
                                >
                                    {selectedTags.length === 0 ? (
                                        <span className="text-muted-foreground">Select tags...</span>
                                    ) : (
                                        <div className="flex gap-1 overflow-hidden">
                                            {selectedTags.length > 2 ? (
                                                <span className="bg-primary/10 text-primary px-1 rounded">{selectedTags.length} selected</span>
                                            ) : (
                                                selectedTags.map(t => (
                                                    <span key={t} className="bg-primary/10 text-primary px-1 rounded truncate max-w-[60px]">{t}</span>
                                                ))
                                            )}
                                        </div>
                                    )}
                                    <ChevronsUpDown className="h-3 w-3 opacity-50 ml-auto" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search tag..." className="h-8 text-xs" />
                                    <CommandList>
                                        <CommandEmpty>No tag found.</CommandEmpty>
                                        <CommandGroup>
                                            {allTags.map(tag => (
                                                <CommandItem
                                                    key={tag}
                                                    value={tag}
                                                    onSelect={() => toggleTag(tag)}
                                                    className="text-xs"
                                                >
                                                    <div className={cn(
                                                        "mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary",
                                                        selectedTags.includes(tag) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                    )}>
                                                        <Check className={cn("h-3 w-3")} />
                                                    </div>
                                                    {tag}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        {selectedTags.length > 0 && (
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => setSelectedTags([])}
                                                    className="justify-center text-center text-xs font-medium text-muted-foreground"
                                                >
                                                    Clear filters
                                                </CommandItem>
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}

                <Command>
                    <CommandInput placeholder="Search devices..." />
                    <CommandList>
                        <CommandEmpty>No device found.</CommandEmpty>
                        {groupedDevices.map(([category, categoryDevices]) => (
                            <CommandGroup key={category} heading={category}>
                                {categoryDevices.map((device) => (
                                    <CommandItem
                                        key={device.id}
                                        value={`${device.name} ${device.tags?.join(' ') || ''}`} // Search by name AND tags
                                        onSelect={() => {
                                            onChange(device.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === device.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col w-full overflow-hidden">
                                            <span className="truncate">{device.name}</span>
                                            <div className="flex flex-wrap gap-1 items-center mt-1">
                                                <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1 rounded">
                                                    {device.type}
                                                </span>
                                                {device.tags && device.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] text-primary bg-primary/5 px-1 rounded border border-primary/10">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
