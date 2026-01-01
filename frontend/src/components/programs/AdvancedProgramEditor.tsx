import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { TimeWindowCard } from './TimeWindowCard';
import { TimeWindowModal } from './TimeWindowModal';
import { TriggerModal } from './TriggerModal';
import type { ITimeWindow, ITrigger, ISensorOption } from './types';

interface AdvancedProgramEditorProps {
    windows: ITimeWindow[];
    onWindowsChange: (windows: ITimeWindow[]) => void;
    flows: { id: string; name: string }[];
}

export const AdvancedProgramEditor: React.FC<AdvancedProgramEditorProps> = ({
    windows,
    onWindowsChange,
    flows
}) => {
    // State for modals
    const [windowModalOpen, setWindowModalOpen] = useState(false);
    const [triggerModalOpen, setTriggerModalOpen] = useState(false);
    const [editingWindow, setEditingWindow] = useState<ITimeWindow | null>(null);
    const [editingTrigger, setEditingTrigger] = useState<ITrigger | null>(null);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

    // State for expanded windows
    const [expandedWindows, setExpandedWindows] = useState<Set<string>>(new Set());

    // State for sensors
    const [sensors, setSensors] = useState<ISensorOption[]>([]);

    // Fetch sensors on mount
    useEffect(() => {
        fetchSensors();
    }, []);

    const fetchSensors = async () => {
        try {
            const res = await fetch('/api/hardware/devices');
            if (!res.ok) throw new Error('Failed to fetch devices');
            const response = await res.json();
            const devices = response.data || [];

            // Filter only sensors
            const sensorDevices = devices
                .filter((d: any) => d.type === 'SENSOR' || d.category === 'SENSOR')
                .map((d: any) => ({
                    id: d.id || d._id,
                    name: d.name,
                    type: d.config?.driverId || d.type,
                    unit: d.config?.displayUnit || d.displaySettings?.unit || '',
                    categoryGroup: d.categoryGroup || 'Сензори'
                }));

            setSensors(sensorDevices);
        } catch (error) {
            console.error('Failed to load sensors:', error);
            toast.error('Неуспешно зареждане на сензори');
        }
    };

    // Build maps for display
    const flowsMap = flows.reduce((acc, f) => ({ ...acc, [f.id]: f.name }), {} as Record<string, string>);
    const sensorsMap = sensors.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {} as Record<string, string>);

    // Toggle window expansion
    const toggleExpand = (windowId: string) => {
        setExpandedWindows(prev => {
            const next = new Set(prev);
            if (next.has(windowId)) {
                next.delete(windowId);
            } else {
                next.add(windowId);
            }
            return next;
        });
    };

    // Window CRUD
    const handleAddWindow = () => {
        setEditingWindow(null);
        setWindowModalOpen(true);
    };

    const handleEditWindow = (window: ITimeWindow) => {
        setEditingWindow(window);
        setWindowModalOpen(true);
    };

    const handleSaveWindow = (window: ITimeWindow) => {
        const existingIndex = windows.findIndex(w => w.id === window.id);
        if (existingIndex >= 0) {
            const updated = [...windows];
            updated[existingIndex] = window;
            onWindowsChange(updated);
        } else {
            onWindowsChange([...windows, window]);
            // Auto-expand new window
            setExpandedWindows(prev => new Set([...prev, window.id]));
        }
    };

    const handleDeleteWindow = (windowId: string) => {
        onWindowsChange(windows.filter(w => w.id !== windowId));
    };

    // Trigger CRUD
    const handleAddTrigger = (windowId: string) => {
        setActiveWindowId(windowId);
        setEditingTrigger(null);
        setTriggerModalOpen(true);
    };

    const handleEditTrigger = (windowId: string, triggerId: string) => {
        const window = windows.find(w => w.id === windowId);
        const trigger = window?.triggers.find(t => t.id === triggerId);
        if (trigger) {
            setActiveWindowId(windowId);
            setEditingTrigger(trigger);
            setTriggerModalOpen(true);
        }
    };

    const handleSaveTrigger = (trigger: ITrigger) => {
        if (!activeWindowId) return;

        const updated = windows.map(w => {
            if (w.id !== activeWindowId) return w;

            const existingIndex = w.triggers.findIndex(t => t.id === trigger.id);
            if (existingIndex >= 0) {
                const updatedTriggers = [...w.triggers];
                updatedTriggers[existingIndex] = trigger;
                return { ...w, triggers: updatedTriggers };
            } else {
                return { ...w, triggers: [...w.triggers, trigger] };
            }
        });

        onWindowsChange(updated);
    };

    const handleDeleteTrigger = (windowId: string, triggerId: string) => {
        const updated = windows.map(w => {
            if (w.id !== windowId) return w;
            return { ...w, triggers: w.triggers.filter(t => t.id !== triggerId) };
        });
        onWindowsChange(updated);
    };

    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">📅 Времеви прозорци</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddWindow}>
                    <Plus className="mr-2 h-4 w-4" /> Добави прозорец
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 bg-muted/20">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                        {windows.map((window, _index) => (
                            <TimeWindowCard
                                key={window.id}
                                window={window}
                                isExpanded={expandedWindows.has(window.id)}
                                onToggleExpand={() => toggleExpand(window.id)}
                                onEdit={() => handleEditWindow(window)}
                                onDelete={() => handleDeleteWindow(window.id)}
                                onAddTrigger={() => handleAddTrigger(window.id)}
                                onEditTrigger={(triggerId) => handleEditTrigger(window.id, triggerId)}
                                onDeleteTrigger={(triggerId) => handleDeleteTrigger(window.id, triggerId)}
                                flowsMap={flowsMap}
                                sensorsMap={sensorsMap}
                            />
                        ))}

                        {windows.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="mb-4">Няма времеви прозорци.</p>
                                <Button variant="outline" onClick={handleAddWindow}>
                                    <Plus className="mr-2 h-4 w-4" /> Добави първия прозорец
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Modals */}
            <TimeWindowModal
                open={windowModalOpen}
                onClose={() => setWindowModalOpen(false)}
                onSave={handleSaveWindow}
                window={editingWindow}
                flows={flows}
                existingWindows={windows}
            />

            <TriggerModal
                open={triggerModalOpen}
                onClose={() => setTriggerModalOpen(false)}
                onSave={handleSaveTrigger}
                trigger={editingTrigger}
                sensors={sensors}
                flows={flows}
            />
        </Card>
    );
};
