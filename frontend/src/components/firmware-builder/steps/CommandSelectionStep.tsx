import React from 'react';
import type { CommandDefinition } from '@/services/firmwareBuilderService';

interface Props {
    commands: CommandDefinition[];
}

export const CommandSelectionStep: React.FC<Props> = ({ commands }) => {
    return (
        <div className="space-y-4">
            <div className="p-4 bg-yellow-50/10 border border-yellow-500/20 rounded-md text-sm text-yellow-500">
                Note: In the future, commands will be automatically selected based on your Device Templates.
                For now, you can see available system commands here.
            </div>

            <div className="grid gap-4">
                {commands.map(cmd => (
                    <div key={cmd.id} className="p-4 border rounded-md flex justify-between items-center">
                        <div>
                            <h4 className="font-medium">{cmd.name}</h4>
                            <p className="text-sm text-muted-foreground">{cmd.description}</p>
                        </div>
                        <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {cmd.id}
                        </div>
                    </div>
                ))}
            </div>

            {commands.length === 0 && (
                <div className="text-center p-8 text-muted-foreground border border-dashed rounded-md">
                    No commands definitions found in firmware/definitions/commands
                </div>
            )}
        </div>
    );
};
