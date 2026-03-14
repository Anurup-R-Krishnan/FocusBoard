import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const mockActivities = [
  { id: '1', app_name: 'VS Code', window_title: 'coding', category: 'Work', duration: 3600, start_time: new Date().toISOString() },
  { id: '2', app_name: 'Slack', window_title: 'team chat', category: 'Communication', duration: 1800, start_time: new Date().toISOString() },
  { id: '3', app_name: 'Chrome', window_title: 'youtube', category: 'Entertainment', duration: 900, start_time: new Date().toISOString() }
];

export const handlers = [
  http.get('http://localhost:5000/api/activities', () => {
    return HttpResponse.json({
      success: true,
      data: {
        activities: mockActivities,
        pagination: { total: 3, limit: 50, offset: 0 }
      }
    });
  }),

  http.post('http://localhost:5000/api/activities', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: { id: '4', ...body }
    }, { status: 201 });
  }),

  http.get('http://localhost:5000/api/metrics/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        today: {
          total_duration: 28800,
          focus_score: 78.5,
          work_percentage: 65
        }
      }
    });
  }),

  http.post('http://localhost:5000/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: { id: '1', email: body.email, name: 'Test User' },
          token: 'mock-jwt-token'
        }
      });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS' } },
      { status: 401 }
    );
  })
];

export const server = setupServer(...handlers);
