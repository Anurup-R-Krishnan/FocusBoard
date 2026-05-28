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

  const key = `${event.app_name}::${event.window_title}`;
  const last = JSON.parse(localStorage.getItem('focusboard_last_posted') || '{}');
  const now = Date.now();
  if (last[key] && (now - last[key]) < 5000) return;
  localStorage.setItem('focusboard_last_posted', JSON.stringify({ ...last, [key]: now }));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
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
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (error) {
    console.error('Failed to post activity:', error);
  }
};
