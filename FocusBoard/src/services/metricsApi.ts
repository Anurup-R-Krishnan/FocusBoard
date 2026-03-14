import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface DashboardMetrics {
    focusScore: number;
    deepWorkMinutes: number;
    distractedMinutes: number;
    totalActivities: number;
}

export interface TimelineBlock {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    category: string;
    duration: number;
    type: 'focus' | 'distraction';
}

export const metricsApi = {
    getDashboardMetrics: async (): Promise<DashboardMetrics> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/metrics/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getTimeline: async (start: string, end: string): Promise<TimelineBlock[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/metrics/timeline?start=${start}&end=${end}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    }
};
