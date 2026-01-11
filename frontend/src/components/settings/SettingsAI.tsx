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

import { useAI } from '@/context/AIContext';

export function SettingsAI() {
    const { isPluginActive } = useAI();
    const [enabled, setEnabled] = useState(true);
    const [mode, setMode] = useState<'basic' | 'advanced'>('basic');

    // Global/Basic State
    const [provider, setProvider] = useState<string>('gemini');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gemini-2.5-flash');

    // Advanced Roles State
    const [roles, setRoles] = useState({
        assistant: { provider: 'gemini', model: 'gemini-2.5-flash', apiKey: '' },
        analyzer: { provider: 'ollama-cloud', model: 'deepseek-v3.1', apiKey: '' },
        sentinel: { provider: 'ollama-cloud', model: 'mistral-large-3:675b', apiKey: '' },
    });

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

                    if (config.mode) setMode(config.mode);

                    // Load Global
                    if (config.provider) setProvider(config.provider);
                    if (config.apiKey) setApiKey(config.apiKey);
                    if (config.model) setModel(config.model);

                    // Load Roles
                    if (config.roles) setRoles(config.roles);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const updateRole = (role: keyof typeof roles, field: string, value: string) => {
        setRoles(prev => ({
            ...prev,
            [role]: { ...prev[role], [field]: value }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.post('http://localhost:3000/api/settings/ai', {
                mode,
                // Global settings (used for Basic mode AND as fallback)
                provider,
                apiKey,
                model,
                // Advanced Roles
                roles
            });
            toast.success('AI Configuration saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const renderRoleConfig = (roleId: 'assistant' | 'analyzer' | 'sentinel') => {
        const roleConfig = roles[roleId];
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs">Provider</Label>
                    <Select
                        value={roleConfig.provider}
                        onValueChange={(val) => {
                            updateRole(roleId, 'provider', val);
                            updateRole(roleId, 'model', AI_MODELS[val]?.[0]?.id || '');
                        }}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {AI_PROVIDERS.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Select
                        value={roleConfig.model}
                        onValueChange={(val) => updateRole(roleId, 'model', val)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {AI_MODELS[roleConfig.provider]?.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1 col-span-2">
                    <Label className="text-xs">API Key (Optional override)</Label>
                    <Input
                        type="password"
                        className="h-8 font-mono text-xs"
                        placeholder={apiKey ? "Using Global Key" : "Set specific key..."}
                        value={roleConfig.apiKey}
                        onChange={(e) => updateRole(roleId, 'apiKey', e.target.value)}
                    />
                </div>
                <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground truncate">
                        {AI_MODELS[roleConfig.provider]?.find(m => m.id === roleConfig.model)?.description}
                    </p>
                </div>
            </div>
        );
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
                                    <Switch
                                        id="ai-mode"
                                        checked={isPluginActive && enabled}
                                        onCheckedChange={(val) => {
                                            if (!isPluginActive) {
                                                toast.info('AI Модулът не е инсталиран', {
                                                    description: 'Моля инсталирайте добавката за да ползвате асистента.'
                                                });
                                                return;
                                            }
                                            setEnabled(val);
                                        }}
                                    />
                                    <Label htmlFor="ai-mode">
                                        {!isPluginActive ? 'Not Installed' : (enabled ? 'Enabled' : 'Disabled')}
                                    </Label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className={`space-y-6 transition-opacity duration-300 ${!isPluginActive ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            {/* Basic vs Advanced Toggle */}
                            <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Advanced Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Configure separate AI models for different system roles.
                                    </p>
                                </div>
                                <Switch
                                    checked={mode === 'advanced'}
                                    onCheckedChange={(c) => setMode(c ? 'advanced' : 'basic')}
                                    disabled={!enabled}
                                />
                            </div>

                            {mode === 'basic' ? (
                                /* BASIC MODE: Single Global Configuration */
                                <div className="border p-4 rounded-lg space-y-6">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Bot className="h-4 w-4" /> Global AI Settings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="provider">AI Provider</Label>
                                            <Select value={provider} onValueChange={(val) => {
                                                setProvider(val);
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

                                    <div className="space-y-2">
                                        <Label htmlFor="api-key">API Key</Label>
                                        <div className="relative">
                                            <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="api-key"
                                                type="password"
                                                placeholder={apiKey ? "********" : "Enter API Key..."}
                                                className="pl-9 font-mono"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                disabled={!enabled}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ADVANCED MODE: 3 Separate Roles */
                                <div className="space-y-6">
                                    {/* Helper function to render a role card */}
                                    {[
                                        { id: 'assistant', title: 'AI Assistant', icon: Bot, desc: 'Chat & Tutorials' },
                                        { id: 'analyzer', title: 'AI Analyst', icon: Cpu, desc: 'Log Analysis & Diagnostics' },
                                        { id: 'sentinel', title: 'AI Sentinel', icon: Loader2, desc: 'System Monitoring & Events' }
                                    ].map((role) => (
                                        <div key={role.id} className="border p-4 rounded-lg space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <role.icon className="h-5 w-5 text-primary" />
                                                <div>
                                                    <h4 className="font-semibold">{role.title}</h4>
                                                    <p className="text-xs text-muted-foreground">{role.desc}</p>
                                                </div>
                                            </div>

                                            {/* We need separate state for each role. For simplicity in this diff, we assume new state variables exist */}
                                            {/* Note: I will need to update the component state definitions in the next step to support this map properly */}
                                            {renderRoleConfig(role.id as any)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-start pt-2 border-t mt-4">
                                <p className="text-xs text-muted-foreground italic">
                                    * Changes require saving. Advanced roles allow specialized models for better performance.
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
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
