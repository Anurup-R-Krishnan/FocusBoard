jest.mock('../models/Event', () => {
  const mock = jest.fn(() => ({ save: jest.fn().mockResolvedValue({}) }));
  mock.findOne = jest.fn();
  mock.find = jest.fn();
  mock.findOneAndUpdate = jest.fn();
  return mock;
});

const mongoose = require('mongoose');
const { createEvent, upsertEvent } = require('../controllers/eventController');
const MockEvent = require('../models/Event');

describe('createEvent idempotency', () => {
  beforeEach(() => {
    MockEvent.findOne.mockReset();
    MockEvent.mockClear();
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
  });

  it('returns existing event when event_id provided and found', async () => {
    const existing = { _id: 'abc', event_id: '123e4567-e89b-12d3-a456-426655440000', user_id: 'u1', title: 'existing' };
    MockEvent.findOne.mockResolvedValue(existing);

    const req = {
      body: { event_id: '123e4567-e89b-12d3-a456-426655440000', title: 't', start_time: new Date().toISOString() },
      user: { id: 'u1' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createEvent(req, res);

    expect(MockEvent.findOne).toHaveBeenCalledWith({ event_id: '123e4567-e89b-12d3-a456-426655440000', user_id: 'u1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, idempotent: true }));
  });
});

describe('createEvent sanitization', () => {
  beforeEach(() => {
    MockEvent.findOne.mockReset();
    MockEvent.mockClear();
  });

  it('redacts paths and truncates title', async () => {
    MockEvent.findOne.mockResolvedValue(null);
    MockEvent.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
    const longTitle = `${'a'.repeat(105)} /a/b`;

    const req = {
      body: { title: longTitle, start_time: new Date().toISOString() },
      user: { id: 'u1' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createEvent(req, res);

    expect(MockEvent).toHaveBeenCalled();
    const created = MockEvent.mock.calls[0][0];
    expect(created.title.length).toBeLessThanOrEqual(120);
    expect(created.title).toContain('[REDACTED_PATH');
  });
});

describe('upsertEvent idempotency', () => {
  beforeEach(() => {
    MockEvent.findOne.mockReset();
    MockEvent.find.mockResolvedValue([]);
    mongoose.connection.readyState = 1;
  });

  it('rejects when event_id is missing', async () => {
    const req = {
      body: { title: 't', start_time: new Date().toISOString() },
      user: { id: 'u1' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await upsertEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns existing event when event_id provided and found', async () => {
    const existing = { _id: 'abc', event_id: '123e4567-e89b-12d3-a456-426655440000', user_id: 'u1', title: 'existing' };
    MockEvent.findOne.mockResolvedValue(existing);

    const req = {
      body: { event_id: '123e4567-e89b-12d3-a456-426655440000', title: 't', start_time: new Date().toISOString() },
      user: { id: 'u1' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await upsertEvent(req, res);

    expect(MockEvent.findOne).toHaveBeenCalledWith({ event_id: '123e4567-e89b-12d3-a456-426655440000', user_id: 'u1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, idempotent: true }));
  });
});
