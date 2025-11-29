import React from 'react';
import type { TransportDefinition, BoardDefinition } from '@/services/firmwareBuilderService';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    transports: TransportDefinition[];
    selectedBoard?: BoardDefinition;
    selectedTransportId: string;
    settings: Record<string, any>;
    onSelect: (id: string) => void;
    onUpdateSettings: (key: string, value: any) => void;
}

export const TransportConfigurationStep: React.FC<Props> = ({
    transports, selectedBoard, selectedTransportId, settings, onSelect, onUpdateSettings
}) => {
    // Filter transports compatible with the board
    const compatibleTransports = transports.filter(t => {
        if (!selectedBoard) return false;
        if (t.compatible_architectures.includes('*')) return true;
        return t.compatible_architectures.includes(selectedBoard.architecture);
    });

    const selectedTransport = transports.find(t => t.id === selectedTransportId);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Communication Method</Label>
                <Select value={selectedTransportId} onValueChange={onSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select transport..." />
                    </SelectTrigger>
                    <SelectContent>
                        {compatibleTransports.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedTransport && (
                    <p className="text-sm text-muted-foreground">{selectedTransport.description}</p>
                )}
            </div>

            {selectedTransport && selectedTransport.parameters.length > 0 && (
                <div className="space-y-4 border p-4 rounded-md bg-muted/10">
                    <h4 className="font-medium text-sm">Configuration</h4>
                    {selectedTransport.parameters.map(param => {
                        const isBaudRate = param.name === 'baud_rate';

                        if (isBaudRate) {
                            return (
                                <div key={param.name} className="space-y-2">
                                    <Label>{param.label} <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={settings[param.name] || ''}
                                        onValueChange={(val) => onUpdateSettings(param.name, val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Baud Rate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="9600">9600</SelectItem>
                                            <SelectItem value="19200">19200</SelectItem>
                                            <SelectItem value="38400">38400</SelectItem>
                                            <SelectItem value="57600">57600</SelectItem>
                                            <SelectItem value="74880">74880</SelectItem>
                                            <SelectItem value="115200">115200</SelectItem>
                                            <SelectItem value="230400">230400</SelectItem>
                                            <SelectItem value="250000">250000</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        }

                        return (
                            <div key={param.name} className="space-y-2">
                                <Label>
                                    {param.label}
                                    {param.name === 'udp_port' && <span className="text-xs text-muted-foreground ml-1 font-normal">(1024-65535)</span>}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={settings[param.name] || ''}
                                    onChange={(e) => onUpdateSettings(param.name, e.target.value)}
                                    placeholder={String(param.default || '')}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
