import React from 'react';
import { cn } from "@/lib/utils";
import { Shield, Check } from 'lucide-react';

interface RoleSelectorProps {
    roles: Record<string, {
        label: string;
        description?: string;
    }>;
    activeRole?: string;
    onSelect: (roleKey: string) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
    roles,
    activeRole,
    onSelect
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(roles).map(([key, role]) => {
                const isActive = activeRole === key;

                return (
                    <div
                        key={key}
                        className={cn(
                            "relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer group",
                            isActive
                                ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                                : "border-muted hover:border-muted-foreground/30 bg-card/50"
                        )}
                        onClick={() => onSelect(key)}
                    >
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                            )}>
                                <Shield className="w-5 h-5" />
                            </div>

                            <div className="flex flex-col pr-6">
                                <span className="font-bold text-sm">
                                    {role.label}
                                </span>
                                {role.description && (
                                    <p className="text-[11px] text-muted-foreground leading-tight mt-1">
                                        {role.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {isActive && (
                            <div className="absolute top-3 right-3 text-primary">
                                <Check className="w-4 h-4" />
                            </div>
                        )}

                        {isActive && (
                            <div className="absolute bottom-2 right-2 text-[10px] font-black uppercase text-primary/40 tracking-tighter">
                                Active Role
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
