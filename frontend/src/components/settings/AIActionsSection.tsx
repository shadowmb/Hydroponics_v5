import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Play, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { aiService, type AIAction } from '@/services/ai.service';
import { AIActionDialog } from './AIActionDialog';

// Mock list of devices for the dialog (In real app, fetch from deviceService)
// For now, let's assume we can fetch them or pass them as props.
// I'll define an empty list or try to fetch.
// Actually, I should probably import useDevices hook if it exists, or fetch from /api/devices.
import axios from 'axios';
import { API_BASE_URL } from '@/core/config';

export function AIActionsSection() {
    const [actions, setActions] = useState<AIAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<AIAction | undefined>(undefined);

    const [devices, setDevices] = useState<any[]>([]);
    const [actionToDelete, setActionToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchActions();
        fetchDevices();
    }, []);

    const fetchActions = async () => {
        try {
            setLoading(true);
            const data = await aiService.getActions();
            setActions(data);
        } catch (error) {
            console.error("Failed to fetch actions", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/hardware/devices`);
            if (res.data.success) {
                // Filter only sensors
                const sensors = res.data.data.filter((d: any) => d.type === 'SENSOR');
                setDevices(sensors);
            }
        } catch (error) {
            console.error("Failed to fetch devices", error);
        }
    };

    const handleCreate = () => {
        setEditingAction(undefined);
        setDialogOpen(true);
    };

    const handleEdit = (action: AIAction) => {
        setEditingAction(action);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setActionToDelete(id);
    };

    const confirmDelete = async () => {
        if (!actionToDelete) return;
        try {
            await aiService.deleteAction(actionToDelete);
            toast.success('Действието е изтрито успешно');
            fetchActions();
        } catch (error) {
            toast.error('Грешка при изтриване');
        } finally {
            setActionToDelete(null);
        }
    };

    const handleRun = async (id: string) => {
        try {
            await aiService.runAction(id);
            toast.success('Действието е стартирано (Check logs)');
        } catch (error) {
            toast.error('Грешка при стартиране');
        }
    };

    const handleSave = async (action: AIAction) => {
        try {
            if (action.id && action.id.trim() !== '') {
                // If the payload has an ID, use it for update
                await aiService.updateAction(action.id, action);
                toast.success('Действието е обновено');
            } else if (editingAction && editingAction.id) {
                // Fallback to editingAction state
                await aiService.updateAction(editingAction.id, action);
                toast.success('Действието е обновено');
            } else {
                await aiService.createAction(action);
                toast.success('Действието е създадено');
            }
            fetchActions();
        } catch (error) {
            toast.error('Грешка при запис');
            throw error;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>AI Действия и Автоматизация</CardTitle>
                    <CardDescription>
                        Настройте автоматични задачи, които AI да изпълнява периодично или при събития.
                    </CardDescription>
                </div>
                <Button onClick={handleCreate} className="ml-auto bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" /> Добави Действие
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Зареждане...</div>
                ) : actions.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                        Няма добавени действия.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Име</TableHead>
                                <TableHead>Тригер</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {actions.map((action) => (
                                <TableRow key={action.id}>
                                    <TableCell className="font-medium">{action.name}</TableCell>
                                    <TableCell>
                                        {action.trigger.type === 'schedule' ? (
                                            <div className="flex items-center space-x-1">
                                                <span>🕒</span>
                                                <Badge variant="outline">
                                                    {(() => {
                                                        const cron = action.trigger.cron?.split(' ') || [];
                                                        const time = cron.length >= 2 ? `${cron[1].padStart(2, '0')}:${cron[0].padStart(2, '0')}` : action.trigger.cron;

                                                        let durationStr = '';
                                                        if (action.trigger.frequency?.endDate && action.trigger.frequency.startDate) {
                                                            const start = new Date(action.trigger.frequency.startDate);
                                                            const end = new Date(action.trigger.frequency.endDate);
                                                            const diffTime = Math.abs(end.getTime() - start.getTime());
                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                            durationStr = ` (${diffDays} дни)`;
                                                        }

                                                        return `${time}${durationStr}`;
                                                    })()}
                                                </Badge>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-1">
                                                <span>🌡️</span>
                                                <Badge variant="outline">
                                                    {devices.find(d => d.id === action.trigger.sensorId)?.name || action.trigger.sensorId}
                                                    {' '}{action.trigger.operator} {action.trigger.value}
                                                </Badge>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={action.enabled ? 'default' : 'secondary'}>
                                            {action.enabled ? 'Активно' : 'Спряно'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="icon" variant="ghost" onClick={() => action.id && handleRun(action.id)} title="Тест">
                                            <Play className="w-4 h-4 text-blue-500" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(action)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => action.id && handleDeleteClick(action.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <AIActionDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    action={editingAction}
                    onSave={handleSave}
                    devices={devices}
                />

                <Dialog open={!!actionToDelete} onOpenChange={(open: boolean) => !open && setActionToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Сигурни ли сте?</DialogTitle>
                            <DialogDescription>
                                Това действие ще бъде изтрито безвъзвратно.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setActionToDelete(null)}>Отказ</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Изтрий</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
