import { useEffect } from "react"
import { Outlet, NavLink } from "react-router-dom"
import { LayoutDashboard, Workflow, Settings, Sprout, Cpu, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { useStore } from "../../core/useStore"
import { socketService } from "../../core/SocketService"


interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12 w-64 border-r bg-card", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center gap-2">
                        <Sprout className="h-6 w-6" />
                        Hydroponics v5
                    </h2>
                    <div className="space-y-1">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                                )
                            }
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/editor"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                                )
                            }
                        >
                            <Workflow className="mr-2 h-4 w-4" />
                            Flow Editor
                        </NavLink>
                        <NavLink
                            to="/flows"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                                )
                            }
                        >
                            <Workflow className="mr-2 h-4 w-4" />
                            Flows
                        </NavLink>
                        <NavLink
                            to="/hardware"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                                )
                            }
                        >
                            <Cpu className="mr-2 h-4 w-4" />
                            Hardware
                        </NavLink>
                        <NavLink
                            to="/history"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                                )
                            }
                        >
                            <LineChart className="mr-2 h-4 w-4" />
                            History
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                                )
                            }
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Layout() {
    const { setSystemStatus, devices, updateDevice } = useStore();

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

        return () => {
            socketService.disconnect();
        };
    }, [setSystemStatus, devices, updateDevice]);

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-6 justify-between">
                    <h1 className="text-lg font-semibold">Control Panel</h1>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-0">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
