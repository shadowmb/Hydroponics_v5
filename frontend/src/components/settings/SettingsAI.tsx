import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Save, Key, Cpu, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { AI_PROVIDERS, AI_MODELS } from '@/config/aiModels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIActionsSection } from './AIActionsSection';
import { ChatShortcutsSection } from './ChatShortcutsSection';

export function SettingsAI() {
    const [enabled, setEnabled] = useState(true);
    const [provider, setProvider] = useState<string>('gemini');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gemini-2.5-flash');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('http://localhost:3000/api/settings/ai');
                if (response.data.success && response.data.data) {
                    const config = response.data.data;
                    if (config.provider) setProvider(config.provider);
                    if (config.apiKey) setApiKey(config.apiKey); // Will be masked
                    if (config.model) setModel(config.model);
                    // if (config.enabled !== undefined) setEnabled(config.enabled); // Not yet in specific config
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                // Don't toast on load error to avoid annoying users if backend is cold
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.post('http://localhost:3000/api/settings/ai', {
                provider,
                apiKey,
                model
            });
            toast.success('AI Configuration saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">Общи настройки</TabsTrigger>
                    <TabsTrigger value="actions">Действия & Автоматизация</TabsTrigger>
                    <TabsTrigger value="shortcuts">Бързи Въпроси</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-primary" />
                                        AI Assistant Configuration
                                    </CardTitle>
                                    <CardDescription>
                                        Configure the behavior and connectivity of your Hydroponics AI Assistant.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="ai-mode" checked={enabled} onCheckedChange={setEnabled} />
                                    <Label htmlFor="ai-mode">{enabled ? 'Enabled' : 'Disabled'}</Label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Provider Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">AI Provider</Label>
                                    <Select value={provider} onValueChange={(val) => {
                                        setProvider(val);
                                        // Auto-select first model of new provider
                                        setModel(AI_MODELS[val]?.[0]?.id || '');
                                    }} disabled={!enabled}>
                                        <SelectTrigger id="provider">
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AI_PROVIDERS.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Select the backend service for intelligence.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Select value={model} onValueChange={setModel} disabled={!enabled}>
                                        <SelectTrigger id="model">
                                            <SelectValue placeholder="Select model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AI_MODELS[provider]?.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {AI_MODELS[provider]?.find(m => m.id === model)?.description || "Choose the specific model version."}
                                    </p>
                                </div>
                            </div>

                            {/* API Key */}
                            <div className="space-y-2">
                                <Label htmlFor="api-key">API Key</Label>
                                <div className="relative">
                                    <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="api-key"
                                        type="password"
                                        placeholder={enabled ? (apiKey ? "********" : "Enter your API key...") : "AI is disabled"}
                                        className="pl-9 font-mono"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        disabled={!enabled}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Your key is stored locally/encrypted. We never share it.
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button disabled={!enabled || isSaving} onClick={handleSave}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Configuration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={!enabled ? "opacity-50 pointer-events-none" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-primary" />
                                System Capabilities
                            </CardTitle>
                            <CardDescription>
                                Control what data the AI can access and what actions it can perform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Read Sensor Data</Label>
                                    <p className="text-sm text-muted-foreground">Allow AI to view live sensor readings and history.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Analyze Errors</Label>
                                    <p className="text-sm text-muted-foreground">Allow AI to check system logs for anomalies.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="actions" className="mt-6">
                    <AIActionsSection />
                </TabsContent>

                <TabsContent value="shortcuts" className="mt-6">
                    <ChatShortcutsSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}
