import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface Client {
    _id: string;
    name: string;
    company: string;
    total_hours: number;
    billable_amount: number;
    color: string;
    hourlyRate: number;
    email: string;
    phone: string;
    notes: string;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClientWithHours extends Client {
    trackedHours: number;
    trackedSeconds: number;
    estimatedBillable: number;
    taskCount: number;
}

export interface ClientQueryParams {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    minHours?: number;
    maxHours?: number;
    includeHours?: boolean;
}

export const clientApi = {
    getClients: async (params: ClientQueryParams = {}): Promise<Client[] | ClientWithHours[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
        if (params.minHours !== undefined) queryParams.set('minHours', params.minHours.toString());
        if (params.maxHours !== undefined) queryParams.set('maxHours', params.maxHours.toString());
        if (params.includeHours) queryParams.set('includeHours', 'true');

        const response = await fetch(`${API_BASE_URL}/clients?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getClientHours: async (id: string, startDate?: string, endDate?: string) => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.set('startDate', startDate);
        if (endDate) queryParams.set('endDate', endDate);

        const response = await fetch(`${API_BASE_URL}/clients/${id}/hours?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    createClient: async (clientData: Partial<Client>): Promise<Client> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(clientData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateClient: async (id: string, clientData: Partial<Client>): Promise<Client> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(clientData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteClient: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    },

    exportClients: async (format: 'json' | 'csv' = 'json'): Promise<Blob | Client[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/clients/export?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (format === 'csv') {
            return await response.blob();
        }
        const resData = await handleResponse(response);
        return resData.data;
    },

    bulkDeleteClients: async (ids: string[]): Promise<{ deletedCount: number }> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/clients/bulk-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids })
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    bulkUpdateClients: async (ids: string[], updates: Partial<Client>): Promise<{ modifiedCount: number }> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/clients/bulk-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids, updates })
        });
        const resData = await handleResponse(response);
        return resData.data;
    }
};
