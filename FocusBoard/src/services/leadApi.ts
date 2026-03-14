import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface Lead {
    _id: string;
    name: string;
    email: string;
    message?: string;
    source?: string;
    createdAt: string;
    updatedAt: string;
}

export const leadApi = {
    createLead: async (leadData: Partial<Lead>): Promise<Lead> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leadData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getLeads: async (params: { page?: number; limit?: number } = {}): Promise<{ data: Lead[]; total: number }> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.limit) queryParams.set('limit', params.limit.toString());

        const response = await fetch(`${API_BASE_URL}/leads?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData;
    },

    getLeadById: async (id: string): Promise<Lead> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateLead: async (id: string, leadData: Partial<Lead>): Promise<Lead> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leadData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteLead: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    }
};
