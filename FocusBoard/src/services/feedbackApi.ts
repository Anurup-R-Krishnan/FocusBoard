import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface UserFeedback {
    _id: string;
    type: 'bug' | 'feature' | 'improvement' | 'other';
    subject: string;
    description: string;
    rating?: number;
    user_id: string;
    status: 'open' | 'reviewed' | 'resolved' | 'closed';
    createdAt: string;
    updatedAt: string;
}

export const feedbackApi = {
    createFeedback: async (feedbackData: Partial<UserFeedback>): Promise<UserFeedback> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/user-feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(feedbackData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getFeedback: async (): Promise<UserFeedback[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/user-feedback`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    getFeedbackById: async (id: string): Promise<UserFeedback> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/user-feedback/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateFeedback: async (id: string, feedbackData: Partial<UserFeedback>): Promise<UserFeedback> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/user-feedback/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(feedbackData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteFeedback: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE}/user-feedback/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    }
};
