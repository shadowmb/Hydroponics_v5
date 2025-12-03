import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface SaveFlowDialogProps {
    children: React.ReactNode;
    defaultName?: string;
    defaultDescription?: string;
    onSave: (name: string, description: string) => Promise<void>;
}

export const SaveFlowDialog: React.FC<SaveFlowDialogProps> = ({ children, defaultName = '', defaultDescription = '', onSave }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(defaultName);
    const [description, setDescription] = useState(defaultDescription);

    // Update local state if prop changes (e.g. when loading a flow)
    React.useEffect(() => {
        setName(defaultName);
        setDescription(defaultDescription);
    }, [defaultName, defaultDescription]);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSave(name, description);
            setOpen(false);
        } catch (error) {
            console.error(error);
            // Error handling usually done in parent via toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Flow</DialogTitle>
                    <DialogDescription>
                        Give your automation flow a name to save it.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Morning Watering Cycle"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this flow does"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={loading || !name.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Flow
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
