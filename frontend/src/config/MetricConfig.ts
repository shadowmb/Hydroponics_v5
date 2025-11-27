export interface MetricDefinition {
    key: string;
    label: string;
    unit: string;
    color: string;
    icon?: string; // Lucide icon name (optional)
}

export const METRICS: Record<string, MetricDefinition> = {
    // Air
    temp: { key: 'temp', label: 'Temperature', unit: '°C', color: '#ef4444' }, // Red
    humidity: { key: 'humidity', label: 'Humidity', unit: '%RH', color: '#3b82f6' }, // Blue
    co2: { key: 'co2', label: 'CO2', unit: 'ppm', color: '#10b981' }, // Green
    pressure: { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#6366f1' }, // Indigo

    // Water
    water_temp: { key: 'water_temp', label: 'Water Temp', unit: '°C', color: '#f43f5e' }, // Rose
    ph: { key: 'ph', label: 'pH', unit: 'pH', color: '#8b5cf6' }, // Violet
    ec: { key: 'ec', label: 'Conductivity', unit: 'µS/cm', color: '#f59e0b' }, // Amber
    level: { key: 'level', label: 'Water Level', unit: '%', color: '#06b6d4' }, // Cyan
    flow: { key: 'flow', label: 'Flow Rate', unit: 'L/min', color: '#0ea5e9' }, // Sky
    do: { key: 'do', label: 'Dissolved Oxygen', unit: 'mg/L', color: '#14b8a6' }, // Teal

    // Soil
    soil_moisture: { key: 'soil_moisture', label: 'Soil Moisture', unit: '%', color: '#854d0e' }, // Brown-ish
    soil_temp: { key: 'soil_temp', label: 'Soil Temp', unit: '°C', color: '#a16207' }, // Yellow-Brown

    // Light
    light: { key: 'light', label: 'Illuminance', unit: 'lux', color: '#fbbf24' }, // Amber
    par: { key: 'par', label: 'PAR', unit: 'µmol/m²/s', color: '#eab308' }, // Yellow

    // Other
    distance: { key: 'distance', label: 'Distance', unit: 'cm', color: '#64748b' }, // Slate
    voltage: { key: 'voltage', label: 'Voltage', unit: 'V', color: '#f97316' }, // Orange
    current: { key: 'current', label: 'Current', unit: 'A', color: '#ea580c' }, // Orange-Red

    // Fallback
    value: { key: 'value', label: 'Value', unit: '', color: '#94a3b8' } // Gray
};

export const getMetricConfig = (key: string): MetricDefinition => {
    return METRICS[key] || { ...METRICS.value, label: key }; // Fallback to key name if unknown
};
