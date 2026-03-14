import { API_BASE_URL } from './apiBase';
const API_BASE = API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('focusboard_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export interface Activity {
  _id: string;
  app_name: string;
  window_title: string;
  start_time: string;
  end_time: string;
  category_id?: { _id: string; name: string; color: string };
  idle: boolean;
}

export interface Category {
  _id: string;
  name: string;
  color: string;
  embedding?: number[];
}

export const fetchActivities = async (
  startDate?: Date,
  endDate?: Date,
  filters?: Record<string, any>
): Promise<Activity[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  try {
    const res = await fetch(`${API_BASE}/activities?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch activities: ${res.status}`);
    }
    const json = await res.json();
    return json.data || [];
  } catch (err: any) {
    throw new Error(err?.message || 'Unable to fetch activities');
  }
};

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.status}`);
    }
    const json = await res.json();
    return json.data || [];
  } catch (err: any) {
    throw new Error(err?.message || 'Unable to fetch categories');
  }
};

export const fetchDailyStats = async (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return fetchActivities(start, end);
};

export const fetchWeeklyStats = async (weekStart: Date) => {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);

  return fetchActivities(start, end);
};

export const fetchMonthlyStats = async (month: Date) => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  return fetchActivities(start, end);
};
