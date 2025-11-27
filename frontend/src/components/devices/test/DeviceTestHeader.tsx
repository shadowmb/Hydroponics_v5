import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Droplet, Thermometer, Cpu } from 'lucide-react';

interface DeviceTestHeaderProps {
    device: any;
    status: 'online' | 'offline' | 'error';
}

export const DeviceTestHeader: React.FC<DeviceTestHeaderProps> = ({
    device,
    status
}) => {

    const getIcon = (type: string) => {
        switch (type) {
            case 'ph': return <Droplet className="h-5 w-5 text-blue-500" />;
            case 'temp': return <Thermometer className="h-5 w-5 text-red-500" />;
            case 'ec': return <Activity className="h-5 w-5 text-green-500" />;
            case 'relay': return <Zap className="h-5 w-5 text-yellow-500" />;
            default: return <Cpu className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border-b bg-muted/10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full border shadow-sm">
                    {getIcon(device.config?.driverId?.physicalType)}
                </div>
                <div>
                    <h3 className="font-semibold text-lg leading-none">{device.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-normal">
                            {device.config?.driverId?.name || 'Unknown Driver'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            Port: {device.hardware?.port || device.hardware?.channel || '-'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="pl-4 border-l">
                    <Badge
                        variant={status === 'online' ? 'default' : 'destructive'}
                        className={status === 'online' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                        {status.toUpperCase()}
                    </Badge>
                </div>
            </div>
        </div>
    );
};
