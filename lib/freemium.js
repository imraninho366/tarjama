const LIMITS = {
  quiz: 10,
  hint: 3,
  tafsir: 2,
}

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
}

function getUsage() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('tarjama_usage')
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (data.day !== getToday()) return {}
    return data
  } catch { return {} }
}

function saveUsage(data) {
  if (typeof window === 'undefined') return
  localStorage.setItem('tarjama_usage', JSON.stringify({ ...data, day: getToday() }))
}

export function isPremium() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('tarjama_premium') === 'true'
}

export function checkLimit(action) {
  if (isPremium()) return { allowed: true, remaining: Infinity }
  const limit = LIMITS[action]
  if (!limit) return { allowed: true, remaining: Infinity }
  const usage = getUsage()
  const count = usage[action] || 0
  return { allowed: count < limit, remaining: Math.max(0, limit - count), limit }
}

export function trackUsage(action) {
  if (isPremium()) return
  const usage = getUsage()
  usage[action] = (usage[action] || 0) + 1
  saveUsage(usage)
}

export function setPremium(value) {
  if (typeof window === 'undefined') return
  localStorage.setItem('tarjama_premium', value ? 'true' : 'false')
}
