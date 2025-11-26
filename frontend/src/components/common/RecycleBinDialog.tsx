import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecycleBinDialogProps {
    type: 'devices' | 'controllers' | 'relays';
    onRestore?: () => void;
}

interface DeletedItem {
    _id: string;
    name: string;
    deletedAt: string;
    type?: string; // For devices/relays
}

export const RecycleBinDialog: React.FC<RecycleBinDialogProps> = ({ type, onRestore }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDeletedItems = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/hardware/${type}?deleted=true`);
            const data = await response.json();
            if (data.success) {
                setItems(data.data);
            } else {
                toast.error('Failed to fetch deleted items');
            }
        } catch (error) {
            console.error('Error fetching deleted items:', error);
            toast.error('Error fetching deleted items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDeletedItems();
        }
    }, [isOpen, type]);

    // Restore Dialog State
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [itemToRestore, setItemToRestore] = useState<DeletedItem | null>(null);
    const [restoreName, setRestoreName] = useState('');

    const initiateRestore = (item: DeletedItem) => {
        setItemToRestore(item);
        // Suggest original name by stripping _del_ suffix
        const cleanName = item.name.split('_del_')[0];
        setRestoreName(cleanName);
        setRestoreDialogOpen(true);
    };

    const handleRestore = async () => {
        if (!itemToRestore) return;

        try {
            const response = await fetch(`http://localhost:3000/api/hardware/${type}/${itemToRestore._id}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: restoreName })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Item restored successfully');
                setRestoreDialogOpen(false);
                fetchDeletedItems();
                if (onRestore) onRestore();
            } else {
                toast.error(data.error || 'Failed to restore item');
            }
        } catch (error) {
            console.error('Error restoring item:', error);
            toast.error('Error restoring item');
        }
    };

    // Hard Delete Dialog State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const confirmHardDelete = (id: string) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleHardDelete = async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch(`http://localhost:3000/api/hardware/${type}/${itemToDelete}/hard`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Item permanently deleted');
                fetchDeletedItems();
            } else {
                toast.error(data.error || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Error deleting item');
        } finally {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Recycle Bin
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Recycle Bin ({type})</DialogTitle>
                        <DialogDescription>
                            View and manage deleted {type}. You can restore items or permanently delete them.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                        {loading ? (
                            <div className="flex justify-center p-4">Loading...</div>
                        ) : items.length === 0 ? (
                            <div className="text-center text-muted-foreground p-4">No deleted items found.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Deleted At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item._id}>
                                            <TableCell className="font-medium">
                                                {item.name}
                                                {item.type && <Badge variant="outline" className="ml-2">{item.type}</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(item.deletedAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => initiateRestore(item)}
                                                    title="Restore"
                                                >
                                                    <RotateCcw className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => confirmHardDelete(item._id)}
                                                    title="Delete Forever"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Restore Dialog */}
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restore Item</DialogTitle>
                        <DialogDescription>
                            Enter a name for the restored item. If the name is taken, you will need to choose a different one.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Name</label>
                        <input
                            type="text"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={restoreName}
                            onChange={(e) => setRestoreName(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRestore}>Restore</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hard Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanently Delete Item?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The item will be permanently removed from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleHardDelete}>Delete Permanently</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
