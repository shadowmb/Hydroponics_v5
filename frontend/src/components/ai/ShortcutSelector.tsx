import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MessageSquarePlus } from 'lucide-react';
import { aiService } from '@/services/ai.service';
import { cn } from '@/lib/utils';

// We'll reuse the interface or import it if shared
interface ChatShortcut {
    id: string;
    label: string;
    prompt: string;
    category: string;
}

interface ShortcutSelectorProps {
    onSelect: (prompt: string) => void;
    className?: string;
}

export function ShortcutSelector({ onSelect, className }: ShortcutSelectorProps) {
    const [shortcuts, setShortcuts] = useState<ChatShortcut[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await aiService.getShortcuts();
                const active = data.filter((s: any) => s.enabled !== false);
                setShortcuts(active);

                // Extract unique categories from ACTIVE shortcuts
                const cats = Array.from(new Set(active.map((s: any) => s.category || 'General')));
                setCategories(['All', ...cats as string[]]);
            } catch (error) {
                console.error("Failed to load shortcuts", error);
            }
        };
        fetch();
    }, []);

    if (shortcuts.length === 0) return null;

    const filtered = selectedCategory === 'All'
        ? shortcuts
        : shortcuts.filter(s => s.category === selectedCategory);

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map(cat => (
                    <Badge
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </Badge>
                ))}
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-2">
                <div className="flex w-max space-x-2 p-1">
                    {filtered.map(shortcut => (
                        <Button
                            key={shortcut.id}
                            variant="secondary"
                            className="h-8 text-xs flex items-center gap-1.5 border hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => onSelect(shortcut.prompt)}
                        >
                            <MessageSquarePlus size={14} className="opacity-50" />
                            {shortcut.label}
                        </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
