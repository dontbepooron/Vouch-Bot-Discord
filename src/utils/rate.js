
/**
 * rate.js simple in-memory rate limiter
 */
const MapStore = new Map();

function allow(id, count, windowSec) {
  const now = Date.now();
  const rec = MapStore.get(id) || { ts: now, calls: 0 };
  if (now - rec.ts > windowSec * 1000) {
    rec.ts = now;
    rec.calls = 0;
  }
  rec.calls++;
  MapStore.set(id, rec);
  return rec.calls <= count;
}

module.exports = { allow };
