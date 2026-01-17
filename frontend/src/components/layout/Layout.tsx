import React, { useEffect } from "react"
import { Outlet, NavLink } from "react-router-dom"
import { LayoutDashboard, Settings, Sprout, Cpu, LineChart, Play, Bot, Workflow, Calendar, Plug } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { useStore } from "../../core/useStore"
import { socketService } from "../../core/SocketService"
import { ServerClock } from "./ServerClock"
import { AIChatButton } from "../ai/AIChatButton"
import { AIChatPopup } from "../ai/AIChatPopup"
import { AIInsightsButton } from "../ai/AIInsightsButton"


interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

// Sidebar Group Component (Simple Accordion)
// Defined locally for now or could be extracted
const NavGroup = ({ label, icon: Icon, items }: { label: string, icon: any, items: any[] }) => {
    const [isOpen, setIsOpen] = React.useState(true); // Default open

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-foreground/80 my-1"
            >
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="">{label}</span>
                </div>
                <span className={cn("transition-transform text-xs opacity-50", isOpen ? "rotate-90" : "")}>›</span>
            </button>

            {isOpen && (
                <div className="pl-4 space-y-1 border-l ml-4 border-border/40">
                    {items.map(subItem => (
                        <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-md px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )
                            }
                        >
                            {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 opacity-70" />}
                            <span>{subItem.label}</span>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
};

function Sidebar({ className }: SidebarProps) {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        {
            group: 'Automation',
            icon: Play,
            items: [
                { to: '/active-program', label: 'Active Program', icon: Play },
                { to: '/programs', label: 'Programs', icon: Calendar },
                { to: '/flows', label: 'Flows', icon: Workflow },
            ]
        },
        { to: '/hardware', icon: Cpu, label: 'Hardware' },
        { to: '/analytics', icon: LineChart, label: 'Data & Analytics' },
        {
            group: 'Plugins',
            icon: Plug,
            items: [
                { to: '/assistant', label: 'AI Assistant', icon: Bot },
            ]
        },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className={cn("pb-12 w-64 border-r bg-card", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center gap-2">
                        <Sprout className="h-6 w-6" />
                        Hydroponics v5
                    </h2>
                    <div className="space-y-1">
                        {navItems.map((item: any) => (
                            item.group ? (
                                <NavGroup key={item.group} label={item.group} icon={item.icon} items={item.items} />
                            ) : (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                            isActive ? "bg-accent text-accent-foreground" : "transparent"
                                        )
                                    }
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </NavLink>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

import { useSimulation } from "@/context/SimulationContext"; // Add import

export function Layout() {
    const { setSystemStatus, devices, updateDevice } = useStore();
    const { isSimulating, virtualTime } = useSimulation(); // Destructure Context

    useEffect(() => {
        // Initialize Socket
        socketService.connect();

        // Listen for connection events
        socketService.onConnect(() => setSystemStatus('online'));
        socketService.onDisconnect(() => setSystemStatus('offline'));

        // Listen for Device Updates
        socketService.on('sensor:data', (payload: any) => {
            const { deviceId, value } = payload;
            const device = devices.get(deviceId);
            if (device) {
                updateDevice({ ...device, value } as any);
            }
        });

        socketService.on('device:update', (payload: any) => {
            // Handle generic device updates if needed
            const { deviceId, ...changes } = payload;
            const device = devices.get(deviceId);
            if (device) {
                updateDevice({ ...device, ...changes } as any);
            }
        });

        // Listen for System Health (DB Connection)
        socketService.on('system:health', (payload: any) => {
            setSystemStatus(payload.status, payload.dbConnected);
        });

        return () => {
            socketService.disconnect();
        };
    }, [setSystemStatus, devices, updateDevice]);

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-6 justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold">Control Panel</h1>
                        {isSimulating && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/50 rounded-full animate-pulse-slow">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Simulation Active</span>
                                <span className="text-xs font-mono text-amber-500/80 ml-2 border-l border-amber-500/30 pl-2">
                                    {virtualTime.toLocaleDateString('en-GB')} {virtualTime.toLocaleTimeString('en-GB', { hour12: false })}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <AIInsightsButton />
                        <AIChatButton />
                        <ServerClock />
                        <ThemeToggle />
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-0">
                    <Outlet />
                </main>
                <AIChatPopup />
            </div>
        </div>
    )
}
