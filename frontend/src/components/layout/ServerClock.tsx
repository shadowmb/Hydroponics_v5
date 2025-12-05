import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const ServerClock: React.FC = () => {
    const [time, setTime] = useState<Date | null>(null);
    const [offset, setOffset] = useState<number>(0);

    useEffect(() => {
        const syncTime = async () => {
            try {
                const start = Date.now();
                const response = await axios.get(`${API_URL}/system/status`);
                const end = Date.now();
                const latency = (end - start) / 2;

                if (response.data.serverTime) {
                    const serverTime = new Date(response.data.serverTime).getTime();
                    // Offset = ServerTime - LocalTime
                    // We add latency to serverTime to estimate "now" at the server
                    const estimatedServerTime = serverTime + latency;
                    const localTime = Date.now();
                    setOffset(estimatedServerTime - localTime);
                    setTime(new Date(estimatedServerTime));
                }
            } catch (error) {
                console.error('Failed to sync server time', error);
            }
        };

        syncTime();
        // Re-sync every minute
        const syncInterval = setInterval(syncTime, 60000);

        return () => clearInterval(syncInterval);
    }, []);

    useEffect(() => {
        const tick = setInterval(() => {
            setTime(new Date(Date.now() + offset));
        }, 1000);

        return () => clearInterval(tick);
    }, [offset]);

    // if (!time) return null; // Don't hide, show loading state

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono font-bold">
                {time ? time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
        </div>
    );
};
