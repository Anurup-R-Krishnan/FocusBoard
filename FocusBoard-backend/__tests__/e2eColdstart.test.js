const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const shouldRun = process.env.E2E_COLDSTART === 'true';

const runTest = shouldRun ? test : test.skip;

runTest('e2e cold-start: ML embed + event upsert idempotency', async () => {
  const login = await axios.post(`${API_URL}/auth/dev-login`);
  const token = login.data?.data?.token;
  expect(token).toBeTruthy();

  const modelStatus = await axios.get(`${ML_URL}/health/model`);
  expect(modelStatus.data).toHaveProperty('status');

  const embed = await axios.post(`${ML_URL}/embed`, { text: 'coldstart test' });
  expect(Array.isArray(embed.data.embedding)).toBe(true);
  expect(embed.data.embedding.length).toBeGreaterThan(0);

  const eventId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `evt-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const payload = {
    event_id: eventId,
    title: 'E2E Coldstart',
    start_time: new Date().toISOString(),
  };

  const first = await axios.post(`${API_URL}/events/upsert`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(first.data?.success).toBe(true);

  const second = await axios.post(`${API_URL}/events/upsert`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(second.data?.idempotent).toBe(true);
}, 20000);
