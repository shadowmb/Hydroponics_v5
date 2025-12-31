import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Activity, StopCircle, PlayCircle, HelpCircle } from 'lucide-react';

const COMMANDS = [
    {
        cmd: '/status',
        desc: 'Checks system health, current program, and run state.',
        response: 'State: RUNNING | Program: Basil_Stage1 | Time: 12:30',
        icon: Activity
    },
    {
        cmd: '/sensors',
        desc: 'Lists all active sensors with their latest readings.',
        response: '• pH: 6.2\n• Temp: 24.5 C',
        icon: Activity
    },
    {
        cmd: '/sensor <name>',
        desc: 'Gets detailed status for a specific sensor.',
        response: 'Value: 24.5 | Raw: 1023 | Status: online',
        icon: Activity
    },
    {
        cmd: '/stop',
        desc: 'Triggers an EMERGENCY STOP. Halts all automation immediately.',
        response: '🛑 EMERGENCY STOP Requested by: User',
        icon: StopCircle,
        variant: 'destructive'
    },
    {
        cmd: '/start <program>',
        desc: 'Queues a program for start (requires exact name match).',
        response: '⏳ Requesting start for: Basil_Stage1',
        icon: PlayCircle
    },
    {
        cmd: '/help',
        desc: 'Shows this list of available commands.',
        response: '📜 Available Commands: /status, /stop...',
        icon: HelpCircle
    }
];

export function BotHelpList() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle>Bot Commands</CardTitle>
                            <CardDescription>
                                These commands can be sent to your connected Telegram Bot.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {COMMANDS.map((item) => (
                            <div key={item.cmd} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex gap-3">
                                    <div className={`mt-1 p-2 rounded-full bg-muted`}>
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-semibold">
                                                {item.cmd}
                                            </code>
                                            {item.variant === 'destructive' && (
                                                <Badge variant="destructive" className="text-[10px] h-5">Danger</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-snug">
                                            {item.desc}
                                        </p>
                                        <div className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded border border-dashed">
                                            <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">Response:</span><br />
                                            <span className="font-mono text-foreground">{item.response}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full h-fit">
                            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Did you know?</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                You can type <code>/help</code> directly in the Telegram chat to see this list while you are on the go!
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
