import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface NetworkScanPromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export const NetworkScanPrompt: React.FC<NetworkScanPromptProps> = ({ open, onOpenChange, onConfirm }) => {
    const handleConfirm = () => {
        onOpenChange(false);
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Scan Network?</DialogTitle>
                    <DialogDescription>
                        You have made changes to the hardware configuration.
                        Would you like to scan the network now to update device statuses?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        No, Skip
                    </Button>
                    <Button onClick={handleConfirm}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Yes, Scan Network
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
