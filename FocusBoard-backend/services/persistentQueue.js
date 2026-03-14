const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const QUEUE_DIR = path.resolve(__dirname, '../data');
const QUEUE_FILE = path.join(QUEUE_DIR, 'events-queue.jsonl');
const DLQ_FILE = path.join(QUEUE_DIR, 'events-dlq.jsonl');
const MAX_ATTEMPTS = parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3', 10);
const FLUSH_INTERVAL_MS = parseInt(process.env.QUEUE_FLUSH_INTERVAL_MS || '30000', 10);

function ensureQueueDir() {
  if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });
}

const metrics = require('../utils/metrics');

function normalizeQueuedEvent(evt) {
  const attempts = Number.isFinite(evt?._attempts) ? evt._attempts : 0;
  return { ...evt, _attempts: attempts };
}

function appendToDlq(entry) {
  try {
    ensureQueueDir();
    fs.appendFileSync(DLQ_FILE, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
  } catch (e) {
    console.error('Failed to append to DLQ', e);
  }
}

function enqueueEventToFile(evt) {
  try {
    ensureQueueDir();
    const payload = normalizeQueuedEvent(evt);
    fs.appendFileSync(QUEUE_FILE, JSON.stringify(payload) + '\n', { encoding: 'utf8' });
    try { metrics.increment('queued_events_total'); } catch (e) { /* best-effort */ }
  } catch (e) {
    console.error('Failed to enqueue event to file', e);
  }
}

async function flushQueueToDb() {
  if (mongoose.connection.readyState !== 1) return;
  if (!fs.existsSync(QUEUE_FILE)) return;
  const Event = require('../models/Event');

  let lines;
  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf8').trim();
    if (!raw) {
      fs.unlinkSync(QUEUE_FILE);
      return;
    }
    lines = raw.split('\n').filter(Boolean);
  } catch (e) {
    console.error('Failed to read queue file', e);
    return;
  }

  const remaining = [];
  for (const line of lines) {
    try {
      const obj = normalizeQueuedEvent(JSON.parse(line));
      if (obj.event_id) {
        // upsert by event_id to preserve idempotency
        await Event.findOneAndUpdate(
          { event_id: obj.event_id, user_id: obj.user_id },
          { $setOnInsert: obj },
          { upsert: true }
        );
      } else {
        const ev = new Event(obj);
        await ev.save();
      }
    } catch (e) {
      console.error('Failed to flush queued event', e);
      try {
        const parsed = normalizeQueuedEvent(JSON.parse(line));
        const nextAttempts = parsed._attempts + 1;
        if (nextAttempts >= MAX_ATTEMPTS) {
          appendToDlq({ error: e.message, event: parsed });
        } else {
          remaining.push(JSON.stringify({ ...parsed, _attempts: nextAttempts }));
        }
      } catch (parseError) {
        appendToDlq({ error: parseError.message, raw: line });
      }
    }
  }

  try {
    if (remaining.length === 0) {
      fs.unlinkSync(QUEUE_FILE);
    } else {
      fs.writeFileSync(QUEUE_FILE, remaining.join('\n') + '\n', 'utf8');
    }
  } catch (e) {
    console.error('Failed to update queue file after flush', e);
  }
}

let workerHandle = null;

function startQueueWorker() {
  if (workerHandle) return;
  workerHandle = setInterval(() => {
    flushQueueToDb().catch((e) => {
      console.error('Queue worker failed to flush', e);
    });
  }, FLUSH_INTERVAL_MS);
  if (workerHandle.unref) workerHandle.unref();
}

module.exports = { enqueueEventToFile, flushQueueToDb, startQueueWorker };
