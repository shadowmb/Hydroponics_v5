
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { ChannelList } from "./ChannelList";
import { ProviderList } from "./ProviderList";

export function NotificationCenter() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
                <ChannelList />
            </div>

            <div className="col-span-3">
                <ProviderList />
            </div>

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
