const store = new Map()
const MAX_SIZE = 500
const TTL = 3600_000 // 1 hour

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > TTL) { store.delete(key); return null }
  return entry.value
}

export function cacheSet(key, value) {
  if (store.size >= MAX_SIZE) {
    const oldest = store.keys().next().value
    store.delete(oldest)
  }
  store.set(key, { value, ts: Date.now() })
}
