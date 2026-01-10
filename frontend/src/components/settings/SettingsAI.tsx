import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Save, Key, Cpu } from 'lucide-react';
import { useStore } from '@/core/useStore'; // Assuming we might want to store state here later, or local state for now

export function SettingsAI() {
    // Local state for UI demo purposes (later linked to backend/store)
    const [enabled, setEnabled] = useState(true);
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gemini-2.5-flash');

    return (
        <div className="space-y-6">
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
                            <Select value={provider} onValueChange={setProvider} disabled={!enabled}>
                                <SelectTrigger id="provider">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                    <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
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
                                    {provider === 'gemini' && (
                                        <>
                                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                                            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                                        </>
                                    )}
                                    {provider === 'openai' && (
                                        <>
                                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                        </>
                                    )}
                                    {provider === 'anthropic' && (
                                        <>
                                            <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
                                            <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Choose the specific model version.</p>
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
                                placeholder={enabled ? "Enter your API key..." : "AI is disabled"}
                                className="pl-9"
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
                        <Button disabled={!enabled}>
                            <Save className="mr-2 h-4 w-4" /> Save Configuration
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
        </div>
    );
}
