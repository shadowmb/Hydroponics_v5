/**
 * Dashboard Settings - LocalStorage Persistence
 */

export interface DashboardSettings {
    pinnedDeviceIds: string[];  // max 6
    showAlerts: boolean;
    refreshInterval: number;    // seconds
}

const STORAGE_KEY = 'hydroponics_dashboard_settings';

export function getDashboardSettings(): DashboardSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load dashboard settings:', error);
    }
    return getDefaultSettings();
}

export function saveDashboardSettings(settings: DashboardSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save dashboard settings:', error);
    }
}

export function getDefaultSettings(): DashboardSettings {
    return {
        pinnedDeviceIds: [],
        showAlerts: true,
        refreshInterval: 10
    };
}
