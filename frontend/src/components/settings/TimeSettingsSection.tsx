
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Clock, RotateCcw, Play, FastForward, CalendarClock, CalendarIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSimulation } from '@/context/SimulationContext';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function TimeSettingsSection() {
    const {
        isSimulating,
        virtualTime,
        simulationSpeed,
        serverTimezone,
        // manualOffsetMinutes, // Not used visualy here
        setServerTimezone,
        enableSimulation,
        disableSimulation,
        setVirtualTime,
        setSimulationSpeed,
        setManualOffset
    } = useSimulation();

    // State for manual time input (HH:mm:ss)
    const [manualTimeInput, setManualTimeInput] = useState("");

    // Helper to format time strings
    const pad = (n: number) => n.toString().padStart(2, '0');

    // Fill the input with Browser Time
    const handleSync = () => {
        const browserNow = new Date();
        const timeString = `${pad(browserNow.getHours())}:${pad(browserNow.getMinutes())}:${pad(browserNow.getSeconds())}`;
        setManualTimeInput(timeString);
        toast.info("Browser time loaded. Click 'Set' to apply.");
    };

    // Calculate and Apply Offset
    const handleApplyManualTime = () => {
        if (!manualTimeInput) return;

        const [hours, minutes, seconds] = manualTimeInput.split(':').map(Number);

        if (isNaN(hours) || isNaN(minutes)) {
            toast.error("Invalid time format. Use HH:mm:ss");
            return;
        }

        const targetDate = new Date(); // Today
        targetDate.setHours(hours, minutes, seconds || 0, 0);

        const serverRealTime = new Date(); // Current Real Time (approx)

        // Calculate difference in minutes
        const diffMs = targetDate.getTime() - serverRealTime.getTime();
        const diffMinutes = Math.round(diffMs / 60000);

        setManualOffset(diffMinutes);
        toast.success(`System time updated to ${manualTimeInput}`);
    };


    const toggleSimulation = (enabled: boolean) => {
        if (enabled) {
            enableSimulation();
            toast.warning('Entering TIME SIMULATION MODE.');
        } else {
            disableSimulation();
            toast.info('Returned to Real Time.');
        }
    };

    // Helper to format time with timezone
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-GB', {
            timeZone: serverTimezone === 'UTC' ? 'UTC' : undefined,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            timeZone: serverTimezone === 'UTC' ? 'UTC' : undefined,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Card className={isSimulating ? "border-amber-500/50 bg-amber-500/5 transition-colors duration-500" : "transition-colors duration-500"}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            System Time & Simulation
                            {isSimulating && <Badge variant="destructive" className="ml-2 animate-pulse">SIMULATION ACTIVE</Badge>}
                        </CardTitle>
                        <CardDescription>
                            Configure server time, timezone, or simulate time travel for testing.
                        </CardDescription>
                    </div>
                    {/* Big Clock Display */}
                    <div className="text-right hidden md:block">
                        <div className={`text-3xl font-mono font-bold tracking-wider ${isSimulating ? 'text-amber-500' : ''}`}>
                            {formatTime(virtualTime)}
                        </div>
                        <div className="text-sm text-muted-foreground mr-1">
                            {formatDate(virtualTime)}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">

                {/* Section 1: Real World Settings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                            <span className={`h-2 w-2 rounded-full ${isSimulating ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                            Real World Settings
                        </h3>
                    </div>

                    <div className="grid md:grid-cols-12 gap-4 items-end">
                        {/* Timezone (Col 4) */}
                        <div className="md:col-span-4 space-y-2">
                            <Label>Server Timezone</Label>
                            <Select value={serverTimezone} onValueChange={setServerTimezone} disabled={isSimulating}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Timezone" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    <SelectItem value="Europe/Sofia">Europe/Sofia (EET/EEST)</SelectItem>
                                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                                    <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Manual Time / Sync (Col 8) */}
                        <div className="md:col-span-8 space-y-2">
                            <Label>Manual Time / Sync</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="HH:mm:ss"
                                        value={manualTimeInput}
                                        onChange={(e) => setManualTimeInput(e.target.value)}
                                        disabled={isSimulating}
                                        className="font-mono"
                                    />
                                </div>
                                <Button variant="secondary" onClick={handleSync} disabled={isSimulating} title="Fill with Browser Time">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Browser Sync
                                </Button>
                                <Button onClick={handleApplyManualTime} disabled={isSimulating || !manualTimeInput} title="Apply Time">
                                    <Check className="h-4 w-4 mr-2" /> Set
                                </Button>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Configure server timezone or apply manual time offset (current browser time sync available).
                    </p>
                </div>

                {/* Section 2: Simulation Mode */}
                <div className={`space-y-4 p-4 rounded-lg border ${isSimulating ? 'bg-background border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-muted/30 border-dashed'}`}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2 text-sm text-foreground">
                            <CalendarClock className={`h-4 w-4 ${isSimulating ? 'text-amber-500' : 'text-muted-foreground'}`} />
                            Time Simulation (Virtual Clock)
                        </h3>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="sim-mode" className="text-xs font-semibold">Enable</Label>
                            <Switch id="sim-mode" checked={isSimulating} onCheckedChange={toggleSimulation} />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className={isSimulating ? "" : "opacity-50 pointer-events-none grayscale"}>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2 flex flex-col">
                                <Label className="text-xs mb-1">Jump Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-8 text-xs",
                                                !virtualTime && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {virtualTime ? format(virtualTime, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={virtualTime}
                                            onSelect={(date) => {
                                                if (date) {
                                                    const newTime = new Date(virtualTime);
                                                    newTime.setFullYear(date.getFullYear());
                                                    newTime.setMonth(date.getMonth());
                                                    newTime.setDate(date.getDate());
                                                    setVirtualTime(newTime);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs mb-1">Simulation Speed</Label>
                                <Select value={simulationSpeed} onValueChange={setSimulationSpeed}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paused">Paused</SelectItem>
                                        <SelectItem value="1x">Real-time (1x)</SelectItem>
                                        <SelectItem value="60x">Minute = Second (60x)</SelectItem>
                                        <SelectItem value="3600x">Hour = Second (3600x)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator className="my-3" />

                        {/* SIMULATION CONTROLS */}
                        <div className="space-y-3">
                            {/* BACKWARD (Past) */}
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setVirtualTime(new Date(virtualTime.getTime() - 60000))} title="-1 Minute">
                                    <RotateCcw className="mr-1 h-3 w-3" /> -1m
                                </Button>
                                <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setVirtualTime(new Date(virtualTime.getTime() - 600000))} title="-10 Minutes">
                                    <RotateCcw className="mr-1 h-3 w-3" /> -10m
                                </Button>
                                <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setVirtualTime(new Date(virtualTime.getTime() - 3600000))} title="-1 Hour">
                                    <RotateCcw className="mr-1 h-3 w-3" /> -1h
                                </Button>
                            </div>

                            {/* FORWARD (Future) */}
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setVirtualTime(new Date(virtualTime.getTime() + 60000))} title="+1 Minute">
                                    <FastForward className="mr-1 h-3 w-3" /> +1m
                                </Button>
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setVirtualTime(new Date(virtualTime.getTime() + 600000))} title="+10 Minutes">
                                    <FastForward className="mr-1 h-3 w-3" /> +10m
                                </Button>
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setVirtualTime(new Date(virtualTime.getTime() + 3600000))} title="+1 Hour">
                                    <FastForward className="mr-1 h-3 w-3" /> +1h
                                </Button>
                            </div>

                            {/* SPECIAL */}
                            <Button variant="outline" size="sm" className="w-full text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10" onClick={() => {
                                const nextMorning = new Date(virtualTime);
                                nextMorning.setDate(nextMorning.getDate() + 1);
                                nextMorning.setHours(6, 0, 0, 0);
                                setVirtualTime(nextMorning);
                            }}>
                                <Play className="mr-1 h-3 w-3" /> Next Morning (06:00)
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
            {isSimulating && (
                <CardFooter className="bg-amber-500/10 border-t border-amber-500/20 py-3 px-6 rounded-b-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center font-medium">
                        <span className="mr-2 text-lg">⚠️</span>
                        Warning: System is running in simulated time. Automation schedules will trigger based on the virtual clock.
                    </p>
                </CardFooter>
            )}
        </Card>
    );
}
