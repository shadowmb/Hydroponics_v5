import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';


// Plan says "Sections", not tabs necessarily, but tabs help organization.
// Plan V2 said "Single View ... Sections A, B, C, D". So let's use Scrollable content with Headers.

interface AIAction {
    id?: string;
    name: string;
    enabled: boolean;
    trigger: {
        type: 'schedule' | 'sensor';
        cron?: string; // Standard format
        sensorId?: string;
        operator?: '>' | '<' | '=' | 'range';
        value?: number;
        rangeMax?: number;
        activeWindow?: { enabled: boolean; startTime: string; endTime: string; };
        frequency?: { type: 'interval' | 'once' | 'daily' | 'date_range'; intervalMinutes?: number; };
        cooldownMinutes?: number;
    };
    payload: {
        systemPrompt: string;
        contextConfiguration?: any;
    };
    outputs: {
        saveInsight: boolean;
        notifyTelegram: boolean;
        notifyEmail: boolean;
    };
}

const DEFAULT_ACTION: AIAction = {
    name: '',
    enabled: true,
    trigger: {
        type: 'schedule',
        cron: '0 22 * * *',
        frequency: { type: 'interval', intervalMinutes: 60 },
        activeWindow: { enabled: false, startTime: '09:00', endTime: '18:00' },
        cooldownMinutes: 60
    },
    payload: {
        systemPrompt: 'Анализирай състоянието на системата и дай препоръки.',
    },
    outputs: {
        saveInsight: true,
        notifyTelegram: false,
        notifyEmail: false
    }
};

interface AIActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action?: AIAction;
    onSave: (action: AIAction) => Promise<void>;
    devices?: any[]; // List of sensors
}

export function AIActionDialog({ open, onOpenChange, action, onSave, devices = [] }: AIActionDialogProps) {
    const [formData, setFormData] = useState<AIAction>(DEFAULT_ACTION);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (action) {
            setFormData(JSON.parse(JSON.stringify(action))); // Deep copy
        } else {
            setFormData(JSON.parse(JSON.stringify(DEFAULT_ACTION)));
        }
    }, [action, open]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateTrigger = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            trigger: { ...prev.trigger, [field]: value }
        }));
    };

    const updateNestedTrigger = (parent: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            trigger: {
                ...prev.trigger,
                [parent]: {
                    ...(prev.trigger as any)[parent],
                    [field]: value
                }
            }
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{action ? 'Редактиране на Действие' : 'Ново AI Действие'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* SECTION A: BASIC INFO */}
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold text-primary">1. Основна Информация</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Име на действието</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Напр. Дневен отчет"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Статус</Label>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        checked={formData.enabled}
                                        onCheckedChange={(c) => setFormData({ ...formData, enabled: c })}
                                    />
                                    <span>{formData.enabled ? 'Активно' : 'Спряно'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Тип Тригер</Label>
                            <RadioGroup
                                value={formData.trigger.type}
                                onValueChange={(v: "schedule" | "sensor") => updateTrigger('type', v)}
                                className="flex flex-row space-x-4"
                            >
                                <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-accent/50">
                                    <RadioGroupItem value="schedule" id="t-schedule" />
                                    <Label htmlFor="t-schedule" className="cursor-pointer">🕒 По Време (График)</Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-accent/50">
                                    <RadioGroupItem value="sensor" id="t-sensor" />
                                    <Label htmlFor="t-sensor" className="cursor-pointer">🌡️ По Сензор</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <Separator />

                    {/* SECTION B: TRIGGER DETAILS */}
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold text-primary">2. Настройки на Тригера</Label>

                        {formData.trigger.type === 'schedule' && (
                            <div className="space-y-4 bg-muted/30 p-4 rounded-md">
                                <div className="space-y-2">
                                    <Label>CRON Израз (Временно поле)</Label>
                                    <Input
                                        value={formData.trigger.cron}
                                        onChange={(e) => updateTrigger('cron', e.target.value)}
                                        placeholder="0 22 * * *"
                                    />
                                    <p className="text-xs text-muted-foreground">Формат: Min Hour Day Month Weekday</p>
                                </div>
                            </div>
                        )}

                        {formData.trigger.type === 'sensor' && (
                            <div className="space-y-4 bg-muted/30 p-4 rounded-md">
                                {/* Sensor Selection */}
                                <div className="space-y-2">
                                    <Label>Избери Сензор</Label>
                                    <Select
                                        value={formData.trigger.sensorId}
                                        onValueChange={(v) => updateTrigger('sensorId', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Избери..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {devices.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name} ({d.driverType})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Condition */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1 space-y-2">
                                        <Label>Условие</Label>
                                        <Select
                                            value={formData.trigger.operator}
                                            onValueChange={(v) => updateTrigger('operator', v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value=">">По-голямо от (&gt;)</SelectItem>
                                                <SelectItem value="<">По-малко от (&lt;)</SelectItem>
                                                <SelectItem value="=">Равно на (=)</SelectItem>
                                                <SelectItem value="range">В диапазон (Range)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <Label>Стойност</Label>
                                        <Input
                                            type="number"
                                            value={formData.trigger.value}
                                            onChange={(e) => updateTrigger('value', Number(e.target.value))}
                                        />
                                    </div>
                                    {formData.trigger.operator === 'range' && (
                                        <div className="col-span-1 space-y-2">
                                            <Label>До (Max)</Label>
                                            <Input
                                                type="number"
                                                value={formData.trigger.rangeMax}
                                                onChange={(e) => updateTrigger('rangeMax', Number(e.target.value))}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Frequency/Interval */}
                                <div className="space-y-2">
                                    <Label>Честота на проверка (Frequency)</Label>
                                    <Select
                                        value={String(formData.trigger.frequency?.intervalMinutes)}
                                        onValueChange={(v) => updateNestedTrigger('frequency', 'intervalMinutes', Number(v))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Избери интервал" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Всяка минута (Внимание!)</SelectItem>
                                            <SelectItem value="5">На всеки 5 минути</SelectItem>
                                            <SelectItem value="10">На всеки 10 минути</SelectItem>
                                            <SelectItem value="60">На всеки 1 час</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Active Window */}
                                <div className="space-y-2 border-t pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="aw-enabled"
                                            checked={formData.trigger.activeWindow?.enabled}
                                            onCheckedChange={(c) => updateNestedTrigger('activeWindow', 'enabled', !!c)}
                                        />
                                        <Label htmlFor="aw-enabled">Активен само в определен часови диапазон</Label>
                                    </div>

                                    {formData.trigger.activeWindow?.enabled && (
                                        <div className="grid grid-cols-2 gap-4 mt-2 ml-6">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Начало</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.trigger.activeWindow.startTime}
                                                    onChange={(e) => updateNestedTrigger('activeWindow', 'startTime', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Край</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.trigger.activeWindow.endTime}
                                                    onChange={(e) => updateNestedTrigger('activeWindow', 'endTime', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cooldown */}
                                <div className="space-y-2 pt-2">
                                    <Label>Cooldown (минути след изпълнение)</Label>
                                    <Input
                                        type="number"
                                        value={formData.trigger.cooldownMinutes}
                                        onChange={(e) => updateTrigger('cooldownMinutes', Number(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">Колко време да се изчака преди повторно задействане.</p>
                                </div>

                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* SECTION C: BRAIN */}
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold text-primary">3. Интелект (Brain)</Label>
                        <div className="space-y-2">
                            <Label>Инструкция към AI (System Prompt)</Label>
                            <Textarea
                                className="min-h-[120px] font-mono text-sm"
                                placeholder="Ти си експерт по хидропоника. Анализирай тази стойност..."
                                value={formData.payload.systemPrompt}
                                onChange={(e) => setFormData({ ...formData, payload: { ...formData.payload, systemPrompt: e.target.value } })}
                            />
                            <p className="text-xs text-muted-foreground">Можеш да използваш <code>{`{{value}}`}</code> за текущата стойност на сензора.</p>
                        </div>

                        <div className="bg-secondary/20 p-4 rounded border border-dashed border-secondary">
                            <p className="text-sm font-medium text-muted-foreground">⚙️ Контекст данни (Очаквайте скоро)</p>
                            <p className="text-xs text-muted-foreground">Тук ще можете да избирате исторически данни (1ч, 24ч) за прикачване към анализа.</p>
                        </div>
                    </div>

                    <Separator />

                    {/* SECTION D: OUTPUT */}
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold text-primary">4. Резултат (Output)</Label>
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label>🔔 Известие в Telegram</Label>
                                <Switch
                                    checked={formData.outputs.notifyTelegram}
                                    onCheckedChange={(c) => setFormData(p => ({ ...p, outputs: { ...p.outputs, notifyTelegram: c } }))}
                                />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label>💾 Запази като Insight (Dashboard)</Label>
                                <Switch
                                    checked={formData.outputs.saveInsight}
                                    onCheckedChange={(c) => setFormData(p => ({ ...p, outputs: { ...p.outputs, saveInsight: c } }))}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Записване...' : 'Запиши Действието'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
