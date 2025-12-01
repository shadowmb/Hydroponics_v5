import axios from 'axios';
import type { CalibrationStrategy } from '../types/Calibration';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


export const calibrationService = {
    getStrategies: async (): Promise<CalibrationStrategy[]> => {
        const response = await axios.get(`${API_URL}/calibration/strategies`);
        return response.data.data;
    },
    saveCalibration: async (deviceId: string, strategyId: string, data: any) => {
        const response = await axios.post(`${API_URL}/hardware/devices/${deviceId}/calibration`, { strategyId, data });
        return response.data;
    },

    deleteCalibration: async (deviceId: string, strategyId: string) => {
        const response = await axios.delete(`${API_URL}/hardware/devices/${deviceId}/calibration/${strategyId}`);
        return response.data;
    }
};
