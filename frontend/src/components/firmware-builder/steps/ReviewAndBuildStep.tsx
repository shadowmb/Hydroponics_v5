import React from 'react';
import type { BuildConfiguration, BoardDefinition, TransportDefinition, PluginDefinition, CommandDefinition } from '@/services/firmwareBuilderService';

interface Props {
    config: BuildConfiguration;
    boards: BoardDefinition[];
    transports: TransportDefinition[];
    plugins: PluginDefinition[];
    commands?: CommandDefinition[];
    onBuild: () => void;
    isBuilding: boolean;
}

export const ReviewAndBuildStep: React.FC<Props> = ({ config, boards, transports, plugins, commands = [] }) => {
    const board = boards.find(b => b.id === config.boardId);
    const transport = transports.find(t => t.id === config.transportId);
    const selectedPlugins = plugins.filter(p => config.pluginIds.includes(p.id));

    // Resolve selected devices (if passed)
    // Note: config doesn't store deviceIds directly in the previous version, but we added it in FirmwareBuilderWizard state
    // We need to pass selectedDeviceIds to this component or infer from config if we added it there.
    // Wait, config has commandIds. We can show commands.
    // But to show Devices, we need to know which devices were selected.
    // Let's assume the parent passes the full list of devices and we filter by what?
    // Actually, FirmwareBuilderWizard has `selectedDeviceIds`. We should probably pass that or the selected devices directly.
    // For now, let's just show the COMMANDS which are in the config.

    const includedCommands = commands.filter(c => config.commandIds.includes(c.id));

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Board</span>
                    <span className="font-medium">{board?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Transport</span>
                    <span className="font-medium">{transport?.name || 'Unknown'}</span>
                </div>

                <div className="py-2 border-b">
                    <span className="text-muted-foreground block mb-2">Plugins</span>
                    <div className="flex flex-wrap gap-2">
                        {selectedPlugins.map(p => (
                            <span key={p.id} className="bg-secondary px-2 py-1 rounded text-xs font-medium">
                                {p.name}
                            </span>
                        ))}
                        {selectedPlugins.length === 0 && <span className="text-sm italic text-muted-foreground">None</span>}
                    </div>
                </div>

                <div className="py-2 border-b">
                    <span className="text-muted-foreground block mb-2">Included Commands (from Devices)</span>
                    <div className="flex flex-wrap gap-2">
                        {includedCommands.map(c => (
                            <span key={c.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium border border-blue-200">
                                {c.name}
                            </span>
                        ))}
                        {includedCommands.length === 0 && <span className="text-sm italic text-muted-foreground">None</span>}
                    </div>
                </div>

                <div className="py-2">
                    <span className="text-muted-foreground block mb-2">Settings</span>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(config.settings, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};
