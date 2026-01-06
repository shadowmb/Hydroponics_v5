import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FlowService } from '../../services/flows.service';

interface DuplicateFlowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flowId: string | null;
    flowName: string;
    onSuccess: () => void;
}

export const DuplicateFlowDialog: React.FC<DuplicateFlowDialogProps> = ({
    open,
    onOpenChange,
    flowId,
    flowName,
    onSuccess
}) => {
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset name when dialog opens
    React.useEffect(() => {
        if (open) {
            setNewName(`Copy of ${flowName}`);
        }
    }, [open, flowName]);

    const handleDuplicate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flowId || !newName.trim()) return;

        setLoading(true);
        try {
            await FlowService.duplicate(flowId, newName);
            toast.success('Flow duplicated successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to duplicate flow');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Duplicate Flow</DialogTitle>
                    <DialogDescription>
                        Create a copy of <strong>{flowName}</strong>. The new flow will be stopped by default.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleDuplicate}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                New Name
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !newName.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Duplicate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
