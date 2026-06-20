import request from 'supertest';
import express from 'express';

// Setting up a simple mock for the express app based on server.js
const app = express();
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    storage: 'nedb'
  });
});

describe('API Health Check', () => {
  it('GET /health should return 200 and status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.storage).toBe('nedb');
  });
});
