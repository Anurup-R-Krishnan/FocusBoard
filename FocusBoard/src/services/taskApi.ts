import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface Task {
    _id: string;
    title: string;
    project?: string;
    client?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    timeSpent: number;
    billable: boolean;
    archived: boolean;
    notes?: string;
    dueDate?: string;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

export const taskApi = {
    getTasks: async (): Promise<Task[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    createTask: async (taskData: Partial<Task>): Promise<Task> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateTask: async (id: string, taskData: Partial<Task>): Promise<Task> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteTask: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    }
};
