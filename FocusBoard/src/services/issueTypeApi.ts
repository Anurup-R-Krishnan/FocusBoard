import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface IssueType {
    _id: string;
    name: string;
    description?: string;
    color?: string;
    createdAt: string;
    updatedAt: string;
}

export const issueTypeApi = {
    createIssueType: async (issueTypeData: Partial<IssueType>): Promise<IssueType> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/issue-types`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(issueTypeData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getIssueTypes: async (): Promise<IssueType[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/issue-types`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getIssueTypeById: async (id: string): Promise<IssueType> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/issue-types/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateIssueType: async (id: string, issueTypeData: Partial<IssueType>): Promise<IssueType> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/issue-types/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(issueTypeData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteIssueType: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/issue-types/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    }
};
