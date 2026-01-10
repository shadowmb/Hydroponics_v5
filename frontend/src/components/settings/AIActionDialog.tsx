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
        operator?: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'range';
        value?: number;
        rangeMax?: number;
        activeWindow?: { enabled: boolean; startTime: string; endTime: string; };
        frequency?: {
            type: 'interval' | 'once' | 'daily' | 'date_range';
            intervalMinutes?: number;
            startDate?: Date | string;
            endDate?: Date | string;
        };
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

interface TimeSelectProps {
    value?: string;
    onChange: (value: string) => void;
}

function TimeSelect({ value, onChange }: TimeSelectProps) {
    // Default to 00:00 if value is missing
    const [h, m] = (value && value.includes(':')) ? value.split(':') : ['00', '00'];

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    return (
        <div className="flex items-center space-x-1">
            <Select value={h} onValueChange={(newH) => onChange(`${newH}:${m}`)}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                    {hours.map(hour => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={m} onValueChange={(newM) => onChange(`${h}:${newM}`)}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                    {minutes.map(minute => (
                        <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function AIActionDialog({ open, onOpenChange, action, onSave, devices = [] }: AIActionDialogProps) {
    const [formData, setFormData] = useState<AIAction>(DEFAULT_ACTION);
    const [loading, setLoading] = useState(false);

    const [scheduleTime, setScheduleTime] = useState<string>('09:00');
    const [scheduleDays, setScheduleDays] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (action) {
            setFormData(JSON.parse(JSON.stringify(action))); // Deep copy

            // Parse Schedule Logic
            if (action.trigger.type === 'schedule') {
                // CRON to Time: "0 22 * * *" -> "22:00"
                if (action.trigger.cron) {
                    const parts = action.trigger.cron.split(' ');
                    if (parts.length >= 2) {
                        const min = parts[0].padStart(2, '0');
                        const hour = parts[1].padStart(2, '0');
                        setScheduleTime(`${hour}:${min}`);
                    }
                }

                // EndDate to Days
                if (action.trigger.frequency?.endDate && action.trigger.frequency.startDate) {
                    const start = new Date(action.trigger.frequency.startDate);
                    const end = new Date(action.trigger.frequency.endDate);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setScheduleDays(diffDays);
                } else {
                    setScheduleDays(undefined);
                }
            }

        } else {
            setFormData(JSON.parse(JSON.stringify(DEFAULT_ACTION)));
            setScheduleTime('09:00');
            setScheduleDays(undefined);
        }
    }, [action, open]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const dataToSave = { ...formData }; // Clone trigger

            if (dataToSave.trigger.type === 'schedule') {
                // Time to CRON
                const [h, m] = scheduleTime.split(':');
                dataToSave.trigger.cron = `${Number(m)} ${Number(h)} * * *`;

                // Days to EndDate
                if (scheduleDays) {
                    const now = new Date();
                    const endDate = new Date();
                    endDate.setDate(now.getDate() + scheduleDays);

                    dataToSave.trigger.frequency = {
                        type: 'daily', // Implicitly daily if purely time based 
                        startDate: now,
                        endDate: endDate
                    };
                } else {
                    // Reset frequency if no days specified or handle differently?
                    // Assuming basic schedule implies daily repetition without end
                    dataToSave.trigger.frequency = {
                        type: 'daily',
                        intervalMinutes: 1440 // 24h
                    };
                }
            }

            await onSave(dataToSave);
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
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Час на изпълнение</Label>
                                        <TimeSelect
                                            value={scheduleTime}
                                            onChange={setScheduleTime}
                                        />
                                        <p className="text-xs text-muted-foreground">Всеки ден в този час.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Продължителност (Дни)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="Безкрайно (ако е празно)"
                                            value={scheduleDays || ''}
                                            onChange={(e) => setScheduleDays(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Колко дни да бъде активен този график (напр. 7 дни). Ако е празно, е постоянно.
                                        </p>
                                    </div>
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
                                                <SelectItem key={d.id} value={d.id}>{d.name} ({d.type})</SelectItem>
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
                                                <SelectItem value=">=">По-голямо или равно (&ge;)</SelectItem>
                                                <SelectItem value="<=">По-малко или равно (&le;)</SelectItem>
                                                <SelectItem value="=">Равно на (=)</SelectItem>
                                                <SelectItem value="!=">Различно от (&ne;)</SelectItem>
                                                <SelectItem value="range">Между (диапазон)</SelectItem>
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
                                                <TimeSelect
                                                    value={formData.trigger.activeWindow.startTime}
                                                    onChange={(v) => updateNestedTrigger('activeWindow', 'startTime', v)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Край</Label>
                                                <TimeSelect
                                                    value={formData.trigger.activeWindow.endTime}
                                                    onChange={(v) => updateNestedTrigger('activeWindow', 'endTime', v)}
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
