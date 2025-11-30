import axios from 'axios';
import type { CalibrationStrategy } from '../types/Calibration';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const calibrationService = {
    getStrategies: async (): Promise<CalibrationStrategy[]> => {
        const response = await axios.get(`${API_URL}/calibration/strategies`);
        return response.data.data;
    }
};
