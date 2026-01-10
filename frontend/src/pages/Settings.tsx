import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationCenter } from "../components/notifications/NotificationCenter";
import { SystemRecoveryPanel } from "../components/settings/SystemRecoveryPanel";
import { ResourceRolesPanel } from "../components/settings/ResourceRolesPanel";
import { SettingsAI } from "../components/settings/SettingsAI";

export function Settings() {
    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">Manage global configuration, notifications, and specialized hardware rules.</p>
            </div>

            <Tabs defaultValue="ai" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="ai">Artificial Intelligence</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Analytics</TabsTrigger>
                    <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
                </TabsList>

                <TabsContent value="ai">
                    <SettingsAI />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <NotificationCenter />
                </TabsContent>

                <TabsContent value="general">
                    <SystemRecoveryPanel />
                </TabsContent>

                <TabsContent value="roles">
                    <ResourceRolesPanel />
                </TabsContent>

                <TabsContent value="backup">
                    <Card>
                        <CardHeader>
                            <CardTitle>Backup & Restore</CardTitle>
                            <CardDescription>Export your configuration or restore from a file.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">Coming in v5.1</div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
