import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface TrackingRule {
    _id: string;
    name: string;
    pattern: string;
    category: string;
    color?: string;
    isActive: boolean;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

export const trackingRuleApi = {
    createRule: async (ruleData: Partial<TrackingRule>): Promise<TrackingRule> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/tracking-rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ruleData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getRules: async (): Promise<TrackingRule[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/tracking-rules`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getRule: async (id: string): Promise<TrackingRule> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/tracking-rules/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateRule: async (id: string, ruleData: Partial<TrackingRule>): Promise<TrackingRule> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/tracking-rules/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ruleData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteRule: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/tracking-rules/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    },

    createRuleFromOverride: async (pattern: string, category: string): Promise<TrackingRule> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/tracking-rules/from-override`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pattern, category })
        });
        const resData = await handleResponse(response);
        return resData.data;
    }
};
