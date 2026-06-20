import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const counters = {};

function counter(name, help) {
  if (!counters[name]) {
    counters[name] = new client.Counter({ name, help, registers: [register] });
  }
  return counters[name];
}

function increment(name, labels = {}) {
  counter(name, name).inc(labels);
}

export { register, counter, increment, client };
