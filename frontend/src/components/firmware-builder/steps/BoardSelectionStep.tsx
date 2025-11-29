import React from 'react';
import type { BoardDefinition } from '@/services/firmwareBuilderService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
    boards: BoardDefinition[];
    selectedBoardId: string;
    onSelect: (id: string) => void;
}

export const BoardSelectionStep: React.FC<Props> = ({ boards, selectedBoardId, onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boards.map(board => (
                <Card
                    key={board.id}
                    className={`cursor-pointer transition-all hover:border-primary ${selectedBoardId === board.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                    onClick={() => onSelect(board.id)}
                >
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{board.name}</h3>
                            <Badge variant="secondary">{board.architecture}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{board.description}</p>

                        {/* Electrical Specs */}
                        {board.electrical_specs && (
                            <div className="mb-4 p-2 bg-muted/50 rounded-md text-xs grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-semibold block">Logic Voltage</span>
                                    {board.electrical_specs.logic_voltage}
                                </div>
                                <div>
                                    <span className="font-semibold block">Input Voltage</span>
                                    {board.electrical_specs.input_voltage}
                                </div>
                                <div>
                                    <span className="font-semibold block">Max Current/Pin</span>
                                    {board.electrical_specs.max_current_per_pin}
                                </div>
                                <div>
                                    <span className="font-semibold block">ADC Resolution</span>
                                    {board.electrical_specs.analog_resolution}
                                </div>
                            </div>
                        )}

                        {/* Pin Counts */}
                        <div className="text-xs space-y-1 text-muted-foreground mb-4">
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline">Digital: {board.pins.digital_count}</Badge>
                                <Badge variant="outline">Analog In: {board.pins.analog_input_count}</Badge>
                                <Badge variant="outline">PWM: {board.pins.pwm_pins.length}</Badge>
                            </div>
                        </div>

                        {/* Constraints */}
                        {board.constraints && board.constraints.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {board.constraints.map((constraint, idx) => (
                                    <div key={idx} className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                                        • {constraint}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
