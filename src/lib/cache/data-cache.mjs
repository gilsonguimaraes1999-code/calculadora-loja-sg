const PREFIX = "calculadora-comercial:supabase:v1:";

function browserStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

export function createDataCache({ storage = browserStorage(), now = Date.now } = {}) {
  const inFlight = new Map();
  const keyFor = (key) => PREFIX + key;

  function read(key, ttlMs) {
    if (!storage) return undefined;
    try {
      const item = JSON.parse(storage.getItem(keyFor(key)) || "null");
      if (!item || typeof item.savedAt !== "number" || now() - item.savedAt > ttlMs) {
        storage.removeItem(keyFor(key));
        return undefined;
      }
      return item.value;
    } catch {
      storage.removeItem(keyFor(key));
      return undefined;
    }
  }

  function set(key, value) {
    if (storage) storage.setItem(keyFor(key), JSON.stringify({ savedAt: now(), value }));
    return value;
  }

  async function load(key, ttlMs, loader, { fresh = false } = {}) {
    if (!fresh) {
      const cached = read(key, ttlMs);
      if (cached !== undefined) return cached;
    }
    if (inFlight.has(key)) return inFlight.get(key);
    const request = Promise.resolve()
      .then(loader)
      .then((value) => set(key, value))
      .finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    return request;
  }

  function remove(key) {
    inFlight.delete(key);
    storage?.removeItem(keyFor(key));
  }

  return { read, set, load, remove };
}

export const appDataCache = createDataCache();
