import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface Integration {
    _id: string;
    name: string;
    category: string;
    connected: boolean;
    syncStatus: 'Synced' | 'Syncing' | 'Error' | 'Pending';
    lastSync?: string;
    config: Record<string, any>;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

export const integrationApi = {
    getIntegrations: async (): Promise<Integration[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/integrations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    createIntegration: async (integrationData: Partial<Integration>): Promise<Integration> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/integrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(integrationData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateIntegration: async (id: string, integrationData: Partial<Integration>): Promise<Integration> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/integrations/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(integrationData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteIntegration: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/integrations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    }
};
