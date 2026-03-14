const client = require('prom-client');

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

module.exports = { register, counter, increment, client };
