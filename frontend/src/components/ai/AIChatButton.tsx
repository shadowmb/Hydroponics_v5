import { Bot, Sparkles, Lock } from 'lucide-react';
import { useAI } from '../../context/AIContext';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function AIChatButton() {
    const { toggleChat, isOpen, isPluginActive } = useAI();

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleChat}
            className={cn(
                "relative transition-all duration-300",
                isOpen ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/50"
            )}
        >
            <motion.div
                animate={isOpen ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5 }}
            >
                {isOpen ? <Bot className="h-5 w-5" /> : (!isPluginActive ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Sparkles className="h-5 w-5" />)}
            </motion.div>

            {/* Pulse effect if closed and active */}
            {!isOpen && isPluginActive && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
            )}
        </Button>
    );
}
