import React from 'react';
import type { PluginDefinition, BoardDefinition } from '@/services/firmwareBuilderService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Props {
    plugins: PluginDefinition[];
    selectedPluginIds: string[];
    selectedBoard?: BoardDefinition;
    onToggle: (id: string) => void;
}

export const PluginSelectionStep: React.FC<Props> = ({ plugins, selectedPluginIds, selectedBoard, onToggle }) => {
    const compatiblePlugins = plugins.filter(p => {
        if (!selectedBoard) return false;
        if (p.compatible_architectures.includes('*')) return true;
        return p.compatible_architectures.includes(selectedBoard.architecture);
    });

    return (
        <div className="space-y-4">
            {compatiblePlugins.map(plugin => (
                <div key={plugin.id} className="flex items-start space-x-3 p-4 border rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                        id={plugin.id}
                        checked={selectedPluginIds.includes(plugin.id)}
                        onCheckedChange={() => onToggle(plugin.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label
                            htmlFor={plugin.id}
                            className="text-base font-medium cursor-pointer"
                        >
                            {plugin.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {plugin.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
