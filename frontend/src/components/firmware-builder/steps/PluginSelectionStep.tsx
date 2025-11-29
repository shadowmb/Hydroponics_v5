import React, { useState } from 'react';
import type { PluginDefinition, BoardDefinition, TransportDefinition } from '@/services/firmwareBuilderService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
    plugins: PluginDefinition[];
    selectedPluginIds: string[];
    selectedBoard?: BoardDefinition;
    selectedTransport?: TransportDefinition;
    settings: Record<string, any>;
    onToggle: (id: string) => void;
    onUpdateSettings: (key: string, value: any) => void;
}

export const PluginSelectionStep: React.FC<Props> = ({
    plugins,
    selectedPluginIds,
    selectedBoard,
    selectedTransport,
    settings,
    onToggle,
    onUpdateSettings
}) => {
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    const togglePasswordVisibility = (paramName: string) => {
        setShowPasswords(prev => ({
            ...prev,
            [paramName]: !prev[paramName]
        }));
    };

    return (
        <div className="space-y-4">
            {plugins.map(plugin => {
                const isSelected = selectedPluginIds.includes(plugin.id);
                const hasParams = plugin.parameters && plugin.parameters.length > 0;

                // Check Compatibility
                const compatibility = (() => {
                    if (!selectedBoard) return { compatible: false, reason: 'No board selected' };

                    // Check Architecture
                    const archCompatible = plugin.compatible_architectures.includes('*') ||
                        plugin.compatible_architectures.includes(selectedBoard.architecture);

                    if (!archCompatible) {
                        return { compatible: false, reason: `Not compatible with ${selectedBoard.architecture}` };
                    }

                    // Check Transport
                    if (selectedTransport) {
                        const transportCompatible = plugin.compatible_transports.includes('*') ||
                            plugin.compatible_transports.includes(selectedTransport.type);

                        if (!transportCompatible) {
                            return { compatible: false, reason: `Requires ${plugin.compatible_transports.join(' or ')} transport` };
                        }
                    }

                    return { compatible: true, reason: '' };
                })();

                const isCompatible = compatibility.compatible;

                return (
                    <div
                        key={plugin.id}
                        className={`border rounded-md transition-all 
                            ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                            ${!isCompatible ? 'opacity-60 cursor-not-allowed bg-muted/20' : ''}
                        `}
                    >
                        <div className="flex items-start space-x-3 p-4">
                            <Checkbox
                                id={plugin.id}
                                checked={isSelected}
                                onCheckedChange={() => isCompatible && onToggle(plugin.id)}
                                disabled={!isCompatible}
                            />
                            <div className="grid gap-1.5 leading-none flex-1">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor={plugin.id}
                                        className={`text-base font-medium ${isCompatible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    >
                                        {plugin.name}
                                    </Label>
                                    {!isCompatible && (
                                        <span className="text-xs font-semibold text-destructive border border-destructive/30 bg-destructive/10 px-2 py-0.5 rounded">
                                            {compatibility.reason}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {plugin.description}
                                </p>
                            </div>
                        </div>

                        {/* Render Parameters if Selected */}
                        {isSelected && hasParams && (
                            <div className="px-4 pb-4 pl-10 space-y-3">
                                {plugin.parameters.map(param => {
                                    const isPassword = param.type === 'password';
                                    const isVisible = showPasswords[param.name];

                                    return (
                                        <div key={param.name} className="space-y-1.5">
                                            <Label className="text-xs uppercase text-muted-foreground font-semibold">
                                                {param.label}
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    className="bg-background h-8 pr-10"
                                                    value={settings[param.name] || ''}
                                                    onChange={(e) => onUpdateSettings(param.name, e.target.value)}
                                                    placeholder={String(param.default || '')}
                                                    type={isPassword && !isVisible ? 'password' : 'text'}
                                                />
                                                {isPassword && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-8 w-8 px-0 hover:bg-transparent"
                                                        onClick={() => togglePasswordVisibility(param.name)}
                                                    >
                                                        {isVisible ? (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
