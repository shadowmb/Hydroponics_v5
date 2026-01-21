import { useState, useEffect } from 'react';

export interface SensorConfig {
    alias?: string;
    showTrend?: boolean;
    min?: number;
    max?: number;
    tolerance?: number;
    icon?: string;
}

export type DashboardConfig = Record<string, SensorConfig>;

const STORAGE_KEY = 'hydro_dashboard_sensor_config';

export const useDashboardConfig = () => {
    const [config, setConfig] = useState<DashboardConfig>({});

    // Load from storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setConfig(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load dashboard config', e);
        }
    }, []);

    // Helper to update a single sensor's config
    const updateSensorConfig = (deviceId: string, newConfig: SensorConfig) => {
        setConfig(prev => {
            const updated = {
                ...prev,
                [deviceId]: { ...prev[deviceId], ...newConfig }
            };

            // Persist immediately
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save dashboard config', e);
            }

            return updated;
        });
    };

    // Helper to get config for a specific sensor (with defaults logic if needed in future)
    const getSensorConfig = (deviceId: string): SensorConfig => {
        return config[deviceId] || {};
    };

    return {
        config,
        updateSensorConfig,
        getSensorConfig
    };
};
