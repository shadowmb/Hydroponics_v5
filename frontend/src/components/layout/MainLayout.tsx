import React, { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, GitBranch, History, Activity, Moon, Sun, Edit, Play } from 'lucide-react';
import { useStore } from '../../core/useStore';
import { socketService } from '../../core/SocketService';
import { cn } from '../../lib/utils';
import { ServerClock } from './ServerClock';

export const MainLayout: React.FC = () => {
    const { systemStatus, setSystemStatus, devices, updateDevice } = useStore();
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

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

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark');
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/programs', icon: GitBranch, label: 'Programs' },
        { to: '/active-program', icon: Play, label: 'Active Program' },
        { to: '/hardware', icon: Cpu, label: 'Hardware' },
        { to: '/editor', icon: Edit, label: 'Editor' },
        { to: '/sessions', icon: History, label: 'Sessions' },
    ];

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card flex flex-col">
                <div className="p-6 border-b border-border flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    <h1 className="font-bold text-xl tracking-tight">Hydroponics v5</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">System Status</span>
                        <span className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            systemStatus === 'online' ? "bg-green-500 animate-pulse" : "bg-red-500"
                        )} />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur">
                    <h2 className="font-semibold text-lg">Overview</h2>
                    <div className="flex items-center gap-4">
                        <ServerClock />
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
