import { handleResponse } from './activityApi';
import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

export interface Project {
    _id: string;
    title: string;
    members: number;
    progress: number;
    status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
    due_date?: string;
    color?: string;
    client?: string;
    budget?: number;
    hourlyRate?: number;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectWithStats extends Project {
    calculatedProgress: number;
    taskStats: {
        total: number;
        done: number;
        inProgress: number;
        todo: number;
    };
}

export const projectApi = {
    getProjects: async (includeProgress: boolean = false): Promise<Project[] | ProjectWithStats[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/projects?includeProgress=${includeProgress}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    calculateProgress: async (): Promise<ProjectWithStats[]> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/projects/calculate-progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    createProject: async (projectData: Partial<Project>): Promise<Project> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    updateProject: async (id: string, projectData: Partial<Project>): Promise<Project> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        const resData = await handleResponse(response);
        return resData.data;
    },

    deleteProject: async (id: string): Promise<void> => {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await handleResponse(response);
    }
};
