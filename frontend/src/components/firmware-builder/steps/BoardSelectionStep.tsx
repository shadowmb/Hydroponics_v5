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

                        <div className="text-xs space-y-1 text-muted-foreground">
                            <div>Flash: {Math.round(board.memory.flash_bytes / 1024)}KB</div>
                            <div>SRAM: {Math.round(board.memory.sram_bytes / 1024)}KB</div>
                            <div>Digital Pins: {board.pins.digital_count}</div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
