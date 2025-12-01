import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { firmwareBuilderService } from '@/services/firmwareBuilderService';
import type { BoardDefinition, TransportDefinition, PluginDefinition, CommandDefinition, BuildConfiguration, DeviceTemplate } from '@/services/firmwareBuilderService';
import { toast } from 'sonner';
import { Loader2, ChevronRight, ChevronLeft, Download, Copy } from 'lucide-react';

// Steps
import { BoardSelectionStep } from './steps/BoardSelectionStep';
import { TransportConfigurationStep } from './steps/TransportConfigurationStep';
import { PluginSelectionStep } from './steps/PluginSelectionStep';
import { DeviceSelectionStep } from './steps/DeviceSelectionStep';
import { ReviewAndBuildStep } from './steps/ReviewAndBuildStep';

export const FirmwareBuilderWizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [buildingAction, setBuildingAction] = useState<'download' | 'copy' | null>(null);

    // Data
    const [boards, setBoards] = useState<BoardDefinition[]>([]);
    const [transports, setTransports] = useState<TransportDefinition[]>([]);
    const [plugins, setPlugins] = useState<PluginDefinition[]>([]);
    const [commands, setCommands] = useState<CommandDefinition[]>([]);
    const [deviceTemplates, setDeviceTemplates] = useState<DeviceTemplate[]>([]);

    // Selection State
    const [config, setConfig] = useState<BuildConfiguration>({
        boardId: '',
        transportId: '',
        pluginIds: [],
        commandIds: [],
        settings: {}
    });

    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [b, t, p, c, d] = await Promise.all([
                    firmwareBuilderService.getBoards(),
                    firmwareBuilderService.getTransports(),
                    firmwareBuilderService.getPlugins(),
                    firmwareBuilderService.getCommands(),
                    firmwareBuilderService.getDeviceTemplates()
                ]);
                setBoards(b);
                setTransports(t);
                setPlugins(p);
                setCommands(c);
                setDeviceTemplates(d);
            } catch (error) {
                toast.error('Failed to load firmware definitions');
                console.error(error);
            }
        };
        loadData();
    }, []);

    // Update commandIds whenever selectedDeviceIds changes
    // Update commandIds whenever selectedDeviceIds changes
    useEffect(() => {
        const newCommandIds = new Set<string>();

        selectedDeviceIds.forEach(deviceId => {
            const template = deviceTemplates.find(t => t._id === deviceId);
            if (template) {
                // 1. Collect from root commands
                if (template.commands) {
                    Object.values(template.commands).forEach((cmdConfig: any) => {
                        // Handle both string format "CMD" and object format { hardwareCmd: "CMD" }
                        const cmd = typeof cmdConfig === 'string' ? cmdConfig : cmdConfig.hardwareCmd;
                        if (cmd) {
                            newCommandIds.add(cmd.toLowerCase());
                        }
                    });
                }

                // 2. Collect from variants
                if (template.variants) {
                    template.variants.forEach((variant: any) => {
                        if (variant.commands) {
                            Object.values(variant.commands).forEach((cmdConfig: any) => {
                                const cmd = typeof cmdConfig === 'string' ? cmdConfig : cmdConfig.hardwareCmd;
                                if (cmd) {
                                    newCommandIds.add(cmd.toLowerCase());
                                }
                            });
                        }
                    });
                }
            }
        });

        setConfig(prev => ({ ...prev, commandIds: Array.from(newCommandIds) }));
    }, [selectedDeviceIds, deviceTemplates]);

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const updateConfig = (updates: Partial<BuildConfiguration>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    const updateSettings = (key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            settings: { ...prev.settings, [key]: value }
        }));
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <BoardSelectionStep
                    boards={boards}
                    selectedBoardId={config.boardId}
                    onSelect={(id) => updateConfig({ boardId: id })}
                />;
            case 2:
                const selectedBoard = boards.find(b => b.id === config.boardId);
                return <TransportConfigurationStep
                    transports={transports}
                    selectedBoard={selectedBoard}
                    selectedTransportId={config.transportId}
                    settings={config.settings}
                    onSelect={(id) => updateConfig({ transportId: id })}
                    onUpdateSettings={updateSettings}
                />;
            case 3:
                const boardForPlugins = boards.find(b => b.id === config.boardId);
                const transportForPlugins = transports.find(t => t.id === config.transportId);
                return <PluginSelectionStep
                    plugins={plugins}
                    selectedPluginIds={config.pluginIds}
                    selectedBoard={boardForPlugins}
                    selectedTransport={transportForPlugins}
                    settings={config.settings}
                    onUpdateSettings={updateSettings}
                    onToggle={(id) => {
                        const current = config.pluginIds;
                        const next = current.includes(id)
                            ? current.filter(p => p !== id)
                            : [...current, id];
                        updateConfig({ pluginIds: next });
                    }}
                />;
            case 4:
                const boardForDevices = boards.find(b => b.id === config.boardId);
                return <DeviceSelectionStep
                    devices={deviceTemplates}
                    selectedDeviceIds={selectedDeviceIds}
                    selectedBoard={boardForDevices}
                    commands={commands}
                    onToggle={(id) => {
                        setSelectedDeviceIds(prev =>
                            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
                        );
                    }}
                />;
            case 5:
                return <ReviewAndBuildStep
                    config={config}
                    boards={boards}
                    transports={transports}
                    plugins={plugins}
                    commands={commands}
                    onBuild={() => performBuild('download')}
                    isBuilding={loading}
                />;
            default:
                return null;
        }
    };

    const performBuild = async (action: 'download' | 'copy') => {
        setLoading(true);
        setBuildingAction(action);
        try {
            const result = await firmwareBuilderService.build(config);

            if (action === 'download') {
                const blob = new Blob([result.content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('Firmware downloaded successfully!');
            } else if (action === 'copy') {
                await navigator.clipboard.writeText(result.content);
                toast.success('Firmware copied to clipboard!');
            }
        } catch (error) {
            toast.error('Build failed');
            console.error(error);
        } finally {
            setLoading(false);
            setBuildingAction(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Firmware Builder</h1>
                <p className="text-muted-foreground">Create custom firmware for your hydroponics controller.</p>

                {/* Progress Bar */}
                <div className="mt-6 flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-secondary -z-10" />
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${s <= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            }`}>
                            {s}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground px-1">
                    <span>Board</span>
                    <span>Transport</span>
                    <span>Plugins</span>
                    <span>Devices</span>
                    <span>Build</span>
                </div>
            </div>

            <Card className="min-h-[400px] flex flex-col">
                <CardContent className="flex-1 p-6">
                    {renderStep()}
                </CardContent>

                <div className="p-6 border-t bg-muted/10 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1 || loading}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {step < 5 ? (
                        <Button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !config.boardId) ||
                                (step === 2 && (!config.transportId || (() => {
                                    const selectedTransport = transports.find(t => t.id === config.transportId);
                                    if (!selectedTransport) return true;

                                    // Check if all parameters are filled
                                    const allFilled = selectedTransport.parameters.every(p => config.settings[p.name]);
                                    if (!allFilled) return true;

                                    // Specific validation for UDP Port
                                    if (config.settings['udp_port']) {
                                        const port = parseInt(config.settings['udp_port'], 10);
                                        if (isNaN(port) || port < 1024 || port > 65535) {
                                            return true; // Invalid port
                                        }
                                    }

                                    return false; // All good
                                })())) ||
                                (step === 3 && (() => {
                                    // Get selected plugins
                                    const selectedPlugins = plugins.filter(p => config.pluginIds.includes(p.id));

                                    // Check if any selected plugin has missing parameters
                                    const hasMissingParams = selectedPlugins.some(plugin => {
                                        if (!plugin.parameters || plugin.parameters.length === 0) return false;
                                        return plugin.parameters.some(param => !config.settings[param.name]);
                                    });

                                    return hasMissingParams;
                                })())
                            }
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => performBuild('copy')}
                                disabled={loading}
                            >
                                {loading && buildingAction === 'copy' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                                Copy Code
                            </Button>
                            <Button
                                onClick={() => performBuild('download')}
                                disabled={loading}
                            >
                                {loading && buildingAction === 'download' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                Download .ino
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
