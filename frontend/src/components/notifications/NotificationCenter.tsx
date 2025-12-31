
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { ChannelList } from "./ChannelList";
import { ProviderList } from "./ProviderList";
import { SystemRulesList } from './SystemRulesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NotificationCenter() {
    return (
        <div className="grid gap-4">
            <Tabs defaultValue="channels" className="col-span-7">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="channels">Channels</TabsTrigger>
                    <TabsTrigger value="rules">System Events</TabsTrigger>
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                </TabsList>

                <TabsContent value="channels">
                    <ChannelList />
                </TabsContent>

                <TabsContent value="rules">
                    <SystemRulesList />
                </TabsContent>

                <TabsContent value="providers">
                    <ProviderList />
                </TabsContent>
            </Tabs>

            <div className="col-span-7">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>How it works</AlertTitle>
                    <AlertDescription>
                        1. Add a <strong>Provider</strong> (e.g., your Telegram Bot).<br />
                        2. Create a <strong>Channel</strong> (e.g., "Critical Alerts") and link it to the Provider.<br />
                        3. Assign this Channel to automation blocks to receive alerts.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
