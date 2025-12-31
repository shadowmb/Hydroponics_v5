import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, Activity, PlayCircle, StopCircle, AlertTriangle, Power } from 'lucide-react';
import { toast } from 'sonner';

interface Rule {
    _id: string;
    event: string;
    channelId: string | null;
    isEnabled: boolean;
    template: string;
}

interface Channel {
    _id: string;
    name: string;
}

const EVENT_META: Record<string, { label: string, icon: any, desc: string, vars: string[] }> = {
    'PROGRAM_START': { label: 'Program Started', icon: PlayCircle, desc: 'Triggered when a program session begins.', vars: ['{{programName}}', '{{timestamp}}'] },
    'PROGRAM_STOP': { label: 'Program Stopped', icon: StopCircle, desc: 'Triggered when a program ends (manually or finished).', vars: ['{{reason}}', '{{timestamp}}'] },
    'CYCLE_START': { label: 'Cycle Started', icon: Activity, desc: 'Triggered when a scheduling cycle begins.', vars: ['{{cycleName}}', '{{cycleId}}', '{{timestamp}}'] },
    'CYCLE_COMPLETE': { label: 'Cycle Completed', icon: Activity, desc: 'Triggered when a scheduling cycle finishes.', vars: ['{{cycleName}}', '{{cycleId}}', '{{timestamp}}'] },
    'CRITICAL_ERROR': { label: 'Critical Errors', icon: AlertTriangle, desc: 'Hardware failures, connection loss, or system crashes.', vars: ['{{error}}', '{{timestamp}}'] },
    'DEVICE_OFFLINE': { label: 'Device Offline', icon: Power, desc: 'When a critical sensor/actuator stops responding.', vars: ['{{deviceId}}', '{{timestamp}}'] },
    'SYSTEM_STARTUP': { label: 'System Startup', icon: Power, desc: 'When the backend server restarts.', vars: ['{{timestamp}}'] }
};

export function SystemRulesList() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [rulesRes, channelsRes] = await Promise.all([
                fetch('http://localhost:3000/api/notifications/rules'),
                fetch('http://localhost:3000/api/notifications/channels')
            ]);

            const rulesData = await rulesRes.json();
            const channelsData = await channelsRes.json();

            // Safety check
            const safeRules = Array.isArray(rulesData) ? rulesData : [];

            // Normalize: Ensure all known events are represented even if DB doesn't have them yet
            const mergedRules = Object.keys(EVENT_META).map(eventKey => {
                const existing = safeRules.find((r: Rule) => r.event === eventKey);
                return existing || {
                    event: eventKey,
                    channelId: null, // "None"
                    isEnabled: false,
                    template: ''
                };
            });

            setRules(mergedRules);
            setChannels(channelsData);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load rules");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = async (event: string, updates: Partial<Rule>) => {
        // Optimistic UI update
        setRules(current => current.map(r => r.event === event ? { ...r, ...updates } : r));

        try {
            // Find current full object to merge with
            const currentRule = rules.find(r => r.event === event);
            const payload = { ...currentRule, ...updates };

            const res = await fetch(`http://localhost:3000/api/notifications/rules/${event}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error();
            toast.success(`Updated settings for ${EVENT_META[event]?.label || event}`);
        } catch (err) {
            toast.error("Failed to save changes");
            fetchData(); // Revert
        }
    };

    if (loading) return <div>Loading rules...</div>;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        System Events
                    </CardTitle>
                    <CardDescription>
                        Configure global rules for system lifecycle events.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {rules.map((rule) => {
                        const meta = EVENT_META[rule.event] || { label: rule.event, icon: Bell, desc: rule.event };
                        const Icon = meta.icon;

                        return (
                            <div key={rule.event} className="flex items-start justify-between p-4 border rounded-lg bg-card/50">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-2 rounded-full ${rule.isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{meta.label}</span>
                                            {rule.isEnabled && <Badge variant="outline" className="text-xs">Active</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{meta.desc}</p>

                                        {/* Template Input (Collapsible or Inline) */}
                                        {rule.isEnabled && (
                                            <div className="pt-2 space-y-2">
                                                <Input
                                                    value={rule.template || ''}
                                                    placeholder="Message Template (e.g. 'Started {{programName}}')"
                                                    className="w-[400px] h-8 text-xs font-mono"
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setRules(current => current.map(r => r.event === rule.event ? { ...r, template: newVal } : r));
                                                    }}
                                                    onBlur={(e) => handleUpdate(rule.event, { template: e.target.value })}
                                                />
                                                <div className="flex gap-2">
                                                    {meta.vars.map(v => (
                                                        <Badge key={v} variant="secondary" className="text-[10px] px-1 py-0 h-5 font-mono text-muted-foreground cursor-pointer hover:text-foreground"
                                                            onClick={() => {
                                                                // Simple append for now, proper insert requires ref
                                                                const newVal = (rule.template || '') + ' ' + v;
                                                                setRules(current => current.map(r => r.event === rule.event ? { ...r, template: newVal } : r));
                                                                handleUpdate(rule.event, { template: newVal });
                                                            }}
                                                        >
                                                            {v}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Select
                                        value={rule.channelId || "none"}
                                        onValueChange={(val) => handleUpdate(rule.event, { channelId: val === "none" ? null : val })}
                                        disabled={!rule.isEnabled}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select Channel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Channel</SelectItem>
                                            {channels.map(c => (
                                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Switch
                                        checked={rule.isEnabled}
                                        onCheckedChange={(val) => handleUpdate(rule.event, { isEnabled: val })}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
