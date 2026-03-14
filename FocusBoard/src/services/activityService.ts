import { API_BASE_URL } from './apiBase';
const API_BASE = API_BASE_URL;

interface ActivityEvent {
  app_name: string;
  window_title: string;
  idle_time: number;
  timestamp: string;
}

export const postActivity = async (event: ActivityEvent): Promise<void> => {
  const token = localStorage.getItem('focusboard_token');
  if (!token) return;

  const startTime = new Date(event.timestamp);
  const endTime = new Date(startTime.getTime() + 1000);

  try {
    await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        app_name: event.app_name,
        window_title: event.window_title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        idle: event.idle_time >= 30,
      }),
    });
  } catch (error) {
    console.error('Failed to post activity:', error);
  }
};
