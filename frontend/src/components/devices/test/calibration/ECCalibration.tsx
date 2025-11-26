import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { hardwareService } from '../../../../services/hardwareService';

interface CalibrationPoint {
    raw: number;
    value: number;
}

interface ECCalibrationProps {
    device: any;
    onUpdate: () => void;
}

export const ECCalibration: React.FC<ECCalibrationProps> = ({ device, onUpdate }) => {
    const [points, setPoints] = useState<CalibrationPoint[]>([]);
    const [strategy, setStrategy] = useState<string>('linear');
    const [newPoint, setNewPoint] = useState<CalibrationPoint>({ raw: 0, value: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (device?.config?.calibration) {
            setPoints(device.config.calibration.points || []);
            setStrategy(device.config.conversionStrategy || 'linear');
        }
    }, [device]);

    const handleAddPoint = () => {
        if (points.some(p => p.raw === newPoint.raw)) {
            toast.error('A point with this RAW value already exists');
            return;
        }
        const updatedPoints = [...points, newPoint].sort((a, b) => a.raw - b.raw);
        setPoints(updatedPoints);
        setNewPoint({ raw: 0, value: 0 });
    };

    const handleDeletePoint = (index: number) => {
        const updatedPoints = points.filter((_, i) => i !== index);
        setPoints(updatedPoints);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedConfig = {
                ...device.config,
                conversionStrategy: strategy,
                calibration: {
                    ...device.config.calibration,
                    points: points
                }
            };

            await hardwareService.updateDevice(device._id, { config: updatedConfig });
            toast.success('Calibration saved');
            onUpdate(); // Refresh parent
        } catch (error) {
            toast.error('Failed to save calibration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Calibration Settings</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure how raw sensor data is converted to physical units.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Strategy</CardTitle>
                    <CardDescription>Select the algorithm used for conversion.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={strategy} onValueChange={setStrategy}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="linear">Linear Interpolation</SelectItem>
                            <SelectItem value="polynomial" disabled>Polynomial (Coming Soon)</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Calibration Points</CardTitle>
                    <CardDescription>
                        Define known points to map Raw values to Actual values.
                        For Linear Interpolation, at least 2 points are recommended.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Raw Value (ADC)</TableHead>
                                <TableHead>Actual Value ({device.config?.driverId?.defaultUnits?.[0]})</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {points.map((point, index) => (
                                <TableRow key={index}>
                                    <TableCell>{point.raw}</TableCell>
                                    <TableCell>{point.value}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeletePoint(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell>
                                    <Input
                                        type="number"
                                        value={newPoint.raw}
                                        onChange={(e) => setNewPoint({ ...newPoint, raw: parseFloat(e.target.value) || 0 })}
                                        placeholder="Raw"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        value={newPoint.value}
                                        onChange={(e) => setNewPoint({ ...newPoint, value: parseFloat(e.target.value) || 0 })}
                                        placeholder="Value"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="secondary" size="sm" onClick={handleAddPoint}>
                                        <Plus className="h-4 w-4" /> Add
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
