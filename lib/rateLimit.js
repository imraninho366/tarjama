const buckets = new Map()

const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (now - bucket.ts > 120_000) buckets.delete(key)
  }
}

export function rateLimit(req, { limit = 10, windowMs = 60_000 } = {}) {
  cleanup()
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now - bucket.ts > windowMs) {
    buckets.set(ip, { count: 1, ts: now })
    return { ok: true, remaining: limit - 1 }
  }

  bucket.count++
  if (bucket.count > limit) {
    return { ok: false, remaining: 0 }
  }
  return { ok: true, remaining: limit - bucket.count }
}
