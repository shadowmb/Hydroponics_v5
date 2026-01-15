
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertTriangle, Download, Check, Loader2,
    Cpu, Workflow, Clock, Settings, CloudUpload,
    FlaskConical, ArrowRight, ShieldCheck
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Define Inventory Structure (Unchanged)
const INVENTORY = {
    infrastructure: [
        { key: 'controllers', label: 'Controllers & Hardware' },
        { key: 'relays', label: 'Relays & Switches' },
        { key: 'devices', label: 'Sensors & Devices' }
    ],
    automation: [
        { key: 'flows', label: 'Flows (Logic)' },
        { key: 'programs', label: 'Program Templates' },
        { key: 'activeprograms', label: 'Active STATE (Running)' }
    ],
    history: [
        { key: 'programdailylogs', label: 'Program Logs' },
        { key: 'executionsessions', label: 'Exec Sessions' },
        { key: 'readings', label: 'Sensor Readings' }
    ],
    system: [
        { key: 'systemsettings', label: 'Global Settings' },
        { key: 'users', label: 'Users & Roles' },
        { key: 'resourceroles', label: 'Resource Roles' }
    ]
};

const GROUPS = [
    { id: 'infrastructure', label: 'Infrastructure', icon: Cpu, desc: 'Hardware setup' },
    { id: 'automation', label: 'Automation', icon: Workflow, desc: 'Logic & Flows' },
    { id: 'history', label: 'History', icon: Clock, desc: 'Logs & Records' },
    { id: 'system', label: 'System', icon: Settings, desc: 'Config & Users' },
];

export const BackupTab: React.FC = () => {
    const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
    const [selectedGroups, setSelectedGroups] = useState<string[]>(['infrastructure', 'automation', 'system']);
    const [advancedSelection, setAdvancedSelection] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);

    // Restore State
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Export Logic ---
    const handleGroupToggle = (groupId: string) => {
        if (selectedGroups.includes(groupId)) {
            setSelectedGroups(selectedGroups.filter(g => g !== groupId));
        } else {
            setSelectedGroups([...selectedGroups, groupId]);
        }
    };

    const handleAdvancedToggle = (collectionKey: string) => {
        if (advancedSelection.includes(collectionKey)) {
            setAdvancedSelection(advancedSelection.filter(c => c !== collectionKey));
        } else {
            setAdvancedSelection([...advancedSelection, collectionKey]);
        }
    };

    const getExportTargets = () => {
        if (mode === 'basic') {
            return selectedGroups;
        }
        return advancedSelection;
    };

    // Helper for API URL
    const getApiUrl = () => {
        if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
        return `${window.location.protocol}//${window.location.hostname}:3000`;
    };

    const handleExport = async () => {
        const targets = getExportTargets();
        if (targets.length === 0) {
            toast.error('Select at least one item to backup');
            return;
        }

        setIsExporting(true);
        try {
            // Use browser download
            const query = `targets=${targets.join(',')}`;
            const link = document.createElement('a');
            link.href = `${getApiUrl()}/api/backup/download?${query}`;
            link.download = `backup.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Backup download started');
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    // --- Restore Logic ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setRestoreFile(file);

            // Read and preview
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const json = JSON.parse(ev.target?.result as string);
                    // Send to backend for inspection
                    const response = await fetch(`${getApiUrl()}/api/backup/inspect`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(json)
                    });
                    const data = await response.json();
                    if (data.message) throw new Error(data.message);
                    setPreviewData(data.data);
                } catch (err: any) {
                    toast.error('Invalid backup file: ' + err.message);
                    setRestoreFile(null);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleRestoreConfirm = async () => {
        if (!restoreFile) return;
        setIsRestoring(true);

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                const response = await fetch(`${getApiUrl()}/api/backup/restore`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(json)
                });

                const result = await response.json();
                if (!result.success) throw new Error(result.message || 'Restore failed');

                toast.success(`Restored successfully!`, {
                    description: `Restored ${result.details?.length || 0} collections.`
                });
                setRestoreFile(null);
                setPreviewData(null);
            } catch (error: any) {
                toast.error('Restore failed: ' + error.message);
            } finally {
                setIsRestoring(false);
            }
        };
        reader.readAsText(restoreFile);
    };

    // New logic: Only triggers the dialog state
    const handleDemoButtonClick = () => {
        setShowDemoConfirm(true);
    };

    // Actual Logic called by the Dialog
    const confirmDemoLoad = async () => {
        setShowDemoConfirm(false);
        setIsRestoring(true);
        try {
            const res = await fetch(`${getApiUrl()}/api/backup/load-demo`, { method: 'POST' });
            const data = await res.json();
            if (!data.success && !data.message?.includes('loaded')) throw new Error(data.message || 'Failed');
            toast.success('Simulation Environment Ready!');
        } catch (e: any) {
            toast.error('Setup Failed: ' + e.message);
        } finally {
            setIsRestoring(false);
        }
    };

    // Dependency Warning Logic
    const hasDependencyWarning = () => {
        const targets = getExportTargets();
        const hasAutomation = targets.includes('automation') || advancedSelection.some(s => INVENTORY.automation.some(i => i.key === s));
        const hasInfra = targets.includes('infrastructure') || advancedSelection.some(s => INVENTORY.infrastructure.some(i => i.key === s));
        return hasAutomation && !hasInfra;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* === SECTION 1: DATA MANAGEMENT (Utility) === */}
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Data Management
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">

                {/* LEFT CARD: CREATE BACKUP */}
                <Card className="h-full border-blue-900/10 bg-slate-950/40 backdrop-blur-sm shadow flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-bold text-slate-100">
                                Create Backup
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs">
                                Export system configuration
                            </CardDescription>
                        </div>

                        {/* Segmented Control */}
                        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                            <button
                                onClick={() => setMode('basic')}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                                    mode === 'basic'
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Basic
                            </button>
                            <button
                                onClick={() => setMode('advanced')}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                                    mode === 'advanced'
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Advanced
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 flex-grow flex flex-col">
                        {mode === 'basic' ? (
                            <div className="grid grid-cols-2 gap-3">
                                {GROUPS.map(group => {
                                    const isSelected = selectedGroups.includes(group.id);
                                    const Icon = group.icon;
                                    return (
                                        <div
                                            key={group.id}
                                            onClick={() => handleGroupToggle(group.id)}
                                            className={cn(
                                                "relative group cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-3 text-center h-[120px]",
                                                isSelected
                                                    ? "bg-blue-500/5 border-blue-500/40"
                                                    : "bg-slate-900/30 border-slate-800 hover:border-slate-700"
                                            )}
                                        >
                                            <Icon className={cn("w-6 h-6 transition-colors", isSelected ? "text-blue-400" : "text-slate-600")} />
                                            <span className={cn("text-xs font-medium", isSelected ? "text-blue-100" : "text-slate-500")}>{group.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <ScrollArea className="h-[250px] border border-slate-800/50 rounded-lg bg-slate-900/20 p-3">
                                <div className="space-y-4">
                                    {Object.entries(INVENTORY).map(([groupKey, items]) => (
                                        <div key={groupKey}>
                                            <h4 className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                {groupKey}
                                            </h4>
                                            <div className="grid grid-cols-1 gap-1 pl-2 border-l border-slate-800 ml-1">
                                                {items.map(item => (
                                                    <div
                                                        key={item.key}
                                                        className={cn(
                                                            "flex items-center space-x-3 p-1.5 rounded hover:bg-slate-800/50 cursor-pointer",
                                                        )}
                                                        onClick={() => handleAdvancedToggle(item.key)}
                                                    >
                                                        <Checkbox
                                                            id={`adv-${item.key}`}
                                                            checked={advancedSelection.includes(item.key)}
                                                            className="h-3.5 w-3.5"
                                                        />
                                                        <Label htmlFor={`adv-${item.key}`} className="text-xs font-normal cursor-pointer text-slate-300">{item.label}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}

                        {hasDependencyWarning() && (
                            <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 py-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="text-xs font-bold">Dependency Warning</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Include <b>Infrastructure</b> to prevent automation errors.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="mt-auto pt-6">
                            <Button
                                className="w-full bg-slate-100 text-slate-900 hover:bg-white"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                Download Archive
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* RIGHT CARD: RESTORE SYSTEM (Utility Only, No Danger Zone) */}
                <Card className="h-full border-blue-900/10 bg-slate-950/40 backdrop-blur-sm shadow flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-100">
                            Restore from File
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs">
                            Import existing backup configuration
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-6 flex-grow justify-center pb-12">
                        <div
                            className="bg-slate-900/20 border border-dashed border-slate-700/50 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-900/60 hover:border-slate-500 cursor-pointer group h-[250px]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                <CloudUpload className="w-7 h-7 text-slate-400 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <h3 className="text-slate-300 font-medium">Upload .json Backup</h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-[220px]">
                                Drag & drop file here or click to browse filesystem
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* === SECTION 2: DEMO & LEARNING (Educational) === */}
            <div className="pt-6">
                <Card className="overflow-hidden border-0 relative bg-gradient-to-br from-indigo-950 via-purple-950/40 to-slate-950">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 p-20 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 p-16 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />

                    <div className="p-1">
                        <div className="p-8 rounded-lg bg-slate-950/30 backdrop-blur-sm border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">

                            <div className="flex gap-6 items-start">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                    <FlaskConical className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div className="space-y-2 max-w-xl">
                                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        Demo Mode & Learning
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                                            Training
                                        </span>
                                    </h3>
                                    <p className="text-indigo-200/60 text-sm leading-relaxed">
                                        Load a complete pre-configured hydroponic environment to explore widely available features.
                                        The controller will be switched to <b>Simulation Mode</b> (Offline), ensuring no physical actuators are triggered while you experiment.
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleDemoButtonClick}
                                disabled={isRestoring}
                                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50 transition-all border border-indigo-500/50 group whitespace-nowrap"
                            >
                                {isRestoring ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Load Demo Environment
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                        </div>
                    </div>
                </Card>
            </div>

            {/* PREVIEW DIALOG */}
            <Dialog open={!!previewData} onOpenChange={(o) => { if (!o) { setPreviewData(null); setRestoreFile(null); } }}>
                <DialogContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <DialogHeader>
                        <DialogTitle>Restore Confirmation</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Ready to restore backup from <b>{previewData?.timestamp}</b>.
                        </DialogDescription>
                    </DialogHeader>

                    {previewData && (
                        <div className="space-y-4 py-4">
                            <div className="bg-slate-900/50 p-4 rounded-lg text-xs font-mono space-y-2 border border-slate-800">
                                <div className="flex justify-between border-b border-slate-800 pb-2 mb-2">
                                    <span className="text-slate-500">System Version</span>
                                    <span className="text-blue-400">{previewData.systemVersion}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800 pb-2 mb-2">
                                    <span className="text-slate-500">Comment</span>
                                    <span className="text-slate-200">{previewData.comment || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Stats Section */}
                            {previewData.stats && (
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(previewData.stats).map(([key, count]) => (
                                        <div key={key} className="bg-slate-900/30 border border-slate-800 p-2 rounded flex justify-between items-center">
                                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{key}</span>
                                            <span className="text-xs font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{String(count)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Alert variant="destructive" className="bg-red-950/20 border-red-900/40">
                                <AlertTriangle className="h-4 w-4 stroke-red-500" />
                                <AlertTitle className="text-red-400 font-bold">Overwrite Warning</AlertTitle>
                                <AlertDescription className="text-red-300/80">
                                    This will replace your current configuration with the backup data.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setPreviewData(null); setRestoreFile(null); }}>Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                            onClick={handleRestoreConfirm}
                            disabled={isRestoring}
                        >
                            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            Confirm Restore
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DEMO CONFIRM DIALOG */}
            <Dialog open={showDemoConfirm} onOpenChange={setShowDemoConfirm}>
                <DialogContent className="bg-slate-950 border-indigo-500/30 text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-indigo-400 flex items-center gap-2">
                            <FlaskConical className="w-5 h-5" />
                            Initialize Simulation Environment?
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            You are about to load the standard demo dataset.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Alert className="bg-indigo-950/30 border-indigo-500/30">
                            <ShieldCheck className="h-4 w-4 text-indigo-400" />
                            <AlertTitle className="text-indigo-300">Clean Slate Protocol</AlertTitle>
                            <AlertDescription className="text-indigo-200/70 text-xs mt-1">
                                This action will <b>reset your current configuration</b> to provide a clean environment for training.
                                Ensure you have backed up any important data before proceeding.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" className="hover:bg-slate-800 text-slate-400" onClick={() => setShowDemoConfirm(false)}>Cancel</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            onClick={confirmDemoLoad}
                            disabled={isRestoring}
                        >
                            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Initialize Demo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
