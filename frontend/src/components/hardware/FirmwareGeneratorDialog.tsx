import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Copy, AlertCircle } from 'lucide-react';

interface FirmwareGeneratorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Controller {
    id: string;
    displayName: string;
    chipset: string;
    communicationTypes: string[];
    commandCompatibility: {
        compatible: string[];
        notRecommended: string[];
        incompatible: string[];
    };
}

interface Command {
    name: string;
    displayName: string;
    description: string;
    memoryFootprint: {
        flash: number;
        sram: number;
    };
}

export function FirmwareGeneratorDialog({ open, onOpenChange }: FirmwareGeneratorDialogProps) {
    const [step, setStep] = useState(1);
    const [controllers, setControllers] = useState<Controller[]>([]);
    const [commands, setCommands] = useState<Command[]>([]);
    const [selectedController, setSelectedController] = useState<string>('');
    const [selectedCommunication, setSelectedCommunication] = useState<string>('serial');
    const [selectedCommands, setSelectedCommands] = useState<string[]>([]);
    const [generatedFirmware, setGeneratedFirmware] = useState<string>('');
    const [filename, setFilename] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        try {
            const [controllersRes, commandsRes] = await Promise.all([
                fetch('/api/firmware/controllers'),
                fetch('/api/firmware/commands')
            ]);

            const controllersData = await controllersRes.json();
            const commandsData = await commandsRes.json();

            if (controllersData.success) {
                setControllers(controllersData.data);
                if (controllersData.data.length > 0) {
                    setSelectedController(controllersData.data[0].id);
                }
            }

            if (commandsData.success) {
                setCommands(commandsData.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load generator data');
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!selectedController) {
                toast.error('Please select a controller');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (selectedCommands.length === 0) {
                toast.error('Please select at least one command');
                return;
            }
            generateFirmware();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const generateFirmware = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/firmware/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    controllerId: selectedController,
                    communicationType: selectedCommunication,
                    commands: selectedCommands
                })
            });

            const result = await response.json();

            if (result.success) {
                setGeneratedFirmware(result.data.content);
                setFilename(result.data.filename);
                setWarnings(result.data.warnings || []);
                setStep(3);
                toast.success('Firmware generated successfully');
            } else {
                toast.error(result.error || 'Failed to generate firmware');
            }
        } catch (error) {
            console.error('Generation error:', error);
            toast.error('Failed to generate firmware');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([generatedFirmware], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Firmware downloaded');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedFirmware);
        toast.success('Firmware copied to clipboard');
    };

    const handleClose = () => {
        setStep(1);
        setSelectedCommands([]);
        setGeneratedFirmware('');
        setWarnings([]);
        onOpenChange(false);
    };

    const currentController = controllers.find(c => c.id === selectedController);

    const toggleCommand = (commandName: string) => {
        setSelectedCommands(prev =>
            prev.includes(commandName)
                ? prev.filter(c => c !== commandName)
                : [...prev, commandName]
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Firmware Generator</DialogTitle>
                    <DialogDescription>
                        Step {step} of 3: {step === 1 ? 'Select Controller' : step === 2 ? 'Select Commands' : 'Download Firmware'}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <Label>Controller Type</Label>
                            <div className="space-y-2 mt-2">
                                {controllers.map(controller => (
                                    <div key={controller.id} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id={controller.id}
                                            name="controller"
                                            value={controller.id}
                                            checked={selectedController === controller.id}
                                            onChange={(e) => setSelectedController(e.target.value)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor={controller.id} className="cursor-pointer">
                                            {controller.displayName} <span className="text-muted-foreground text-sm">({controller.chipset})</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {currentController && (
                            <div>
                                <Label>Communication Type</Label>
                                <div className="space-y-2 mt-2">
                                    {currentController.communicationTypes.map(type => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={type}
                                                name="communication"
                                                value={type}
                                                checked={selectedCommunication === type}
                                                onChange={(e) => setSelectedCommunication(e.target.value)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={type} className="cursor-pointer capitalize">{type}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && currentController && (
                    <div className="space-y-4">
                        <div>
                            <Label>Select Commands</Label>
                            <div className="space-y-2 mt-2">
                                {commands.map(command => {
                                    const isNotRecommended = currentController.commandCompatibility.notRecommended.includes(command.name);
                                    const isIncompatible = currentController.commandCompatibility.incompatible.includes(command.name);

                                    return (
                                        <div key={command.name} className="flex items-start space-x-2">
                                            <input
                                                type="checkbox"
                                                id={command.name}
                                                checked={selectedCommands.includes(command.name)}
                                                onChange={() => toggleCommand(command.name)}
                                                disabled={isIncompatible}
                                                className="h-4 w-4 mt-1"
                                            />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor={command.name}
                                                    className={`cursor-pointer ${isIncompatible ? 'text-muted-foreground line-through' : ''}`}
                                                >
                                                    {command.displayName}
                                                    {isNotRecommended && <span className="ml-2 text-yellow-600">⚠️ Not Recommended</span>}
                                                    {isIncompatible && <span className="ml-2 text-red-600">❌ Incompatible</span>}
                                                </Label>
                                                <p className="text-sm text-muted-foreground">{command.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedCommands.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                                Selected: {selectedCommands.join(', ')}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        {warnings.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div className="text-sm">
                                        {warnings.map((warning, i) => (
                                            <div key={i}>{warning}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Generated File</Label>
                            <p className="text-sm font-mono bg-muted p-2 rounded mt-1">{filename}</p>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleDownload} className="flex-1">
                                <Download className="mr-2 h-4 w-4" />
                                Download .ino
                            </Button>
                            <Button onClick={handleCopy} variant="outline" className="flex-1">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy to Clipboard
                            </Button>
                        </div>

                        <div className="bg-muted p-4 rounded text-sm space-y-2">
                            <p className="font-semibold">Next Steps:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Open Arduino IDE</li>
                                <li>Upload firmware to controller</li>
                                <li>Return to Hardware Management and add controller</li>
                            </ol>
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={step === 1 ? handleClose : handleBack}>
                        {step === 1 ? 'Cancel' : 'Back'}
                    </Button>
                    {step < 3 && (
                        <Button onClick={handleNext} disabled={loading}>
                            {loading ? 'Generating...' : step === 2 ? 'Generate' : 'Next'}
                        </Button>
                    )}
                    {step === 3 && (
                        <Button onClick={handleClose}>Done</Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
