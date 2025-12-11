import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../../core/useStore';

export const AlertsPanel: React.FC = () => {
    const { logs } = useStore();

    // Filter recent errors (last 30 minutes)
    const recentErrors = logs.filter(log => {
        if (log.level !== 'error') return false;
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        return (now - logTime) < 30 * 60 * 1000; // 30 minutes
    }).slice(0, 5); // Max 5 errors

    const hasAlerts = recentErrors.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    🔔 System Alerts
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!hasAlerts ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Системата работи нормално</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentErrors.map((log, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                            >
                                <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-destructive">
                                        {log.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Placeholder for future features */}
                {/* <div className="mt-4 text-xs text-muted-foreground text-center">
                    Advanced alerts coming soon...
                </div> */}
            </CardContent>
        </Card>
    );
};
