const Redis = require("ioredis");

let client = null;

function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    client.on("connect", () => console.log("✅ Redis connected"));
    client.on("error", (err) => {
      console.warn("⚠️  Redis error (falling back to no-cache):", err.message);
      client = null;
    });
  }
  return client;
}

const cache = {
  async get(key) {
    try {
      const c = getClient();
      if (!c) return null;
      const val = await c.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      const c = getClient();
      if (!c) return;
      await c.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // silent fallback
    }
  },

  async del(key) {
    try {
      const c = getClient();
      if (!c) return;
      await c.del(key);
    } catch {
      // silent fallback
    }
  },

  async delPattern(pattern) {
    try {
      const c = getClient();
      if (!c) return;
      const keys = await c.keys(pattern);
      if (keys.length) await c.del(...keys);
    } catch {
      // silent fallback
    }
  },
};

module.exports = cache;
