import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { History } from './History';
import { ProgramAnalytics } from '../components/analytics/ProgramAnalytics';
import { BarChart3, LineChart, ScrollText } from 'lucide-react';

export function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('program');

    return (
        <div className="h-full flex flex-col">
            <div className="border-b bg-card px-6 py-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Data & Analytics
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Анализирайте данни от програми и сензори
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b bg-card/50 px-6">
                    <TabsList className="h-12">
                        <TabsTrigger value="sensors" className="gap-2">
                            <LineChart className="h-4 w-4" />
                            Sensor History
                        </TabsTrigger>
                        <TabsTrigger value="program" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Program Analytics
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="gap-2" disabled>
                            <ScrollText className="h-4 w-4" />
                            Logs
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="sensors" className="flex-1 m-0 overflow-hidden">
                    <History />
                </TabsContent>

                <TabsContent value="program" className="flex-1 m-0 overflow-auto p-6">
                    <ProgramAnalytics />
                </TabsContent>

                <TabsContent value="logs" className="flex-1 m-0 p-6">
                    <div className="text-center text-muted-foreground py-12">
                        Coming soon...
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
