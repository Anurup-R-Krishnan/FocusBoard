import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface CategoryGoal {
    _id: string;
    categoryId: string;
    targetHours: number;
    startDate: string;
    endDate: string;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

export const categoryGoalApi = {
    createGoal: async (goalData: Partial<CategoryGoal>): Promise<CategoryGoal> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/category-goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(goalData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getGoals: async (): Promise<CategoryGoal[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/category-goals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getGoalById: async (id: string): Promise<CategoryGoal> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/category-goals/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateGoal: async (id: string, goalData: Partial<CategoryGoal>): Promise<CategoryGoal> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/category-goals/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(goalData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteGoal: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/category-goals/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    }
};
