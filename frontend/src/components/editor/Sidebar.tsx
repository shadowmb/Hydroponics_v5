import React from 'react';
import { GripVertical } from 'lucide-react';

export const Sidebar: React.FC = () => {
    // In a real app, we'd fetch templates from the backend or store
    // For now, we'll hardcode some common templates
    const templates = [
        { type: 'SENSOR_READ', label: 'Read Sensor', icon: 'Thermometer' },
        { type: 'ACTUATOR_SET', label: 'Set Actuator', icon: 'Zap' },
        { type: 'WAIT', label: 'Wait', icon: 'Clock' },
        { type: 'IF', label: 'Condition (IF)', icon: 'GitBranch' },
        { type: 'LOG', label: 'Log Message', icon: 'FileText' },
    ];

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-64 border-r bg-card flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Palette</h3>
                <p className="text-xs text-muted-foreground">Drag nodes to canvas</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {templates.map((t) => (
                    <div
                        key={t.type}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent text-card-foreground cursor-grab active:cursor-grabbing transition-colors shadow-sm"
                        draggable
                        onDragStart={(e) => onDragStart(e, t.type, t.label)}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
