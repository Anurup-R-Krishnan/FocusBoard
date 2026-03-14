import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface Goal {
    _id: string;
    title: string;
    target_deep_work: number;
    distraction_limit: number;
    priority_tasks: string[];
    notes?: string;
    date: string;
    achieved: boolean;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

export interface GoalProgress {
    goalId: string;
    title: string;
    targetMinutes: number;
    actualMinutes: number;
    targetDistractions: number;
    actualDistractions: number;
    progress: number;
    achieved: boolean;
    justAchieved: boolean;
}

export interface GoalProgressSummary {
    total: number;
    achieved: number;
    pending: number;
}

export const goalApi = {
    createGoal: async (goalData: Partial<Goal>): Promise<Goal> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/goals`, {
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

    getGoals: async (params: { startDate?: string; endDate?: string; page?: number; limit?: number } = {}): Promise<{ data: Goal[]; total: number; page: number; limit: number }> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.set('startDate', params.startDate);
        if (params.endDate) queryParams.set('endDate', params.endDate);
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.limit) queryParams.set('limit', params.limit.toString());

        const response = await fetch(`${API_BASE_URL}/goals?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData;
    },

    getGoalById: async (id: string): Promise<Goal> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateGoal: async (id: string, goalData: Partial<Goal>): Promise<Goal> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
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
        const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    },

    checkProgress: async (): Promise<{ data: GoalProgress[]; summary: GoalProgressSummary }> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/goals/check-progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData;
    }
};
