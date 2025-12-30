import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from 'sonner';

// Define Interface locally or import from shared types
interface Provider {
    _id: string;
    name: string;
    type: 'telegram' | 'email';
    config: any;
    isEnabled: boolean;
}

export function ProviderList() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newType] = useState<'telegram' | 'email'>('telegram');
    const [newToken, setNewToken] = useState('');
    const [newChatId, setNewChatId] = useState('');

    const fetchProviders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/notifications/providers');
            const data = await res.json();
            setProviders(data);
        } catch (err) {
            toast.error("Failed to load providers");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleCreate = async () => {
        if (!newName || !newToken) {
            toast.error("Name and Token are required");
            return;
        }

        try {
            const payload = {
                name: newName,
                type: newType,
                config: {
                    token: newToken,
                    chatId: newChatId,
                    whitelist: newChatId ? [newChatId] : [] // Auto-whitelist self
                },
                isEnabled: true
            };

            const res = await fetch('http://localhost:3000/api/notifications/providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to create');

            toast.success("Provider created");
            setIsCreating(false);
            setNewName('');
            setNewToken('');
            setNewChatId('');
            fetchProviders();
        } catch (err) {
            toast.error("Error creating provider");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`http://localhost:3000/api/notifications/providers/${id}`, { method: 'DELETE' });
            toast.success("Provider deleted");
            fetchProviders();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const handleTest = async (id: string) => {
        try {
            const res = await fetch('http://localhost:3000/api/notifications/providers/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerId: id })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Test message sent!");
            } else {
                toast.error(`Test failed: ${data.error}`);
            }
        } catch (err) {
            toast.error("Test failed to send");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Providers</CardTitle>
                    <CardDescription>Configure connection services</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={fetchProviders} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* List */}
                <div className="space-y-2">
                    {providers.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                                <Badge variant={p.type === 'telegram' ? 'default' : 'secondary'}>
                                    {p.type}
                                </Badge>
                                <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        ID: {p._id.slice(-4)} | Chat: {p.config.chatId || 'Not set'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleTest(p._id)}>
                                    Test
                                </Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {providers.length === 0 && !isLoading && (
                        <div className="text-center text-sm text-muted-foreground py-4">No providers added</div>
                    )}
                </div>

                {/* Add Form */}
                {isCreating ? (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input placeholder="My Telegram Bot" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <div className="h-10 flex items-center px-3 border rounded text-sm bg-background text-muted-foreground">
                                    Telegram
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Bot Token</Label>
                            <Input type="password" placeholder="123456:ABC-..." value={newToken} onChange={e => setNewToken(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Your Chat ID (Whitelist)</Label>
                            <Input placeholder="123456789" value={newChatId} onChange={e => setNewChatId(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Save Provider</Button>
                        </div>
                    </div>
                ) : (
                    <Button className="w-full" variant="outline" onClick={() => setIsCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Provider
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
