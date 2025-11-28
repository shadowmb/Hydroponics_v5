import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FirmwareBuilderWizard } from './FirmwareBuilderWizard';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export const FirmwareBuilderDialog: React.FC<Props> = ({ open, onOpenChange, trigger }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sr-only">
                    <DialogTitle>Firmware Builder</DialogTitle>
                    <DialogDescription>
                        Wizard to create custom firmware for your hydroponics controller.
                    </DialogDescription>
                </DialogHeader>
                <FirmwareBuilderWizard />
            </DialogContent>
        </Dialog>
    );
};
