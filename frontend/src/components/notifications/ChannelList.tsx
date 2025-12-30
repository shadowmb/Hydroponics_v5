import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, RefreshCw, Bell } from "lucide-react";
import { toast } from 'sonner';

interface Channel {
    _id: string;
    name: string;
    providerIds: any[]; // Populated objects
}

interface ProviderSummary {
    _id: string;
    name: string;
    type: string;
}

export function ChannelList() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [providers, setProviders] = useState<ProviderSummary[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form
    const [newName, setNewName] = useState('');
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [cRes, pRes] = await Promise.all([
                fetch('http://localhost:3000/api/notifications/channels'),
                fetch('http://localhost:3000/api/notifications/providers')
            ]);

            const channelsData = await cRes.json();
            const providersData = await pRes.json();

            setChannels(channelsData);
            setProviders(providersData);
        } catch (err) {
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (!newName) {
            toast.error("Name is required");
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/notifications/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    providerIds: selectedProviders
                })
            });

            if (!res.ok) throw new Error('Failed to create');

            toast.success("Channel created");
            setIsCreating(false);
            setNewName('');
            setSelectedProviders([]);
            fetchData();
        } catch (err) {
            toast.error("Error creating channel");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`http://localhost:3000/api/notifications/channels/${id}`, { method: 'DELETE' });
            toast.success("Channel deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const toggleProviderSelection = (id: string) => {
        setSelectedProviders(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Notification Channels</CardTitle>
                    <CardDescription>Define destinations (e.g. "Critical" -&gt; Telegram)</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={fetchData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {channels.map(c => (
                        <div key={c._id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="font-medium">{c.name}</div>
                                    <div className="flex gap-2 mt-1">
                                        {c.providerIds.map((p: any) => (
                                            <Badge key={p._id} variant="secondary" className="text-xs">
                                                {p.name}
                                            </Badge>
                                        ))}
                                        {c.providerIds.length === 0 && (
                                            <span className="text-xs text-muted-foreground italic">No destinations</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c._id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {isCreating ? (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                        <div className="space-y-2">
                            <Label>Channel Name</Label>
                            <Input placeholder="Critical Alerts" value={newName} onChange={e => setNewName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Destinations (Providers)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {providers.map(p => (
                                    <div key={p._id} className="flex items-center space-x-2 border p-2 rounded bg-background">
                                        <Checkbox
                                            id={`p-${p._id}`}
                                            checked={selectedProviders.includes(p._id)}
                                            onCheckedChange={() => toggleProviderSelection(p._id)}
                                        />
                                        <Label htmlFor={`p-${p._id}`} className="cursor-pointer">{p.name}</Label>
                                    </div>
                                ))}
                            </div>
                            {providers.length === 0 && <p className="text-xs text-destructive">No providers available. Add a provider first.</p>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={providers.length === 0}>Save Channel</Button>
                        </div>
                    </div>
                ) : (
                    <Button className="w-full" variant="outline" onClick={() => setIsCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Channel
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
