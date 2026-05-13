import { supabase } from './supabase'

const LIMITS = {
  quiz: 10,
  hint: 3,
  tafsir: 2,
}

const ADMIN_ID = 'cc0683b4-fdb3-4ddb-b157-f2669b99dee4'

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

export function isAdmin(userId) {
  return userId === ADMIN_ID
}

export async function checkPremiumServer(userId) {
  if (userId === ADMIN_ID) return true
  const { data, error } = await supabase.from('premium_users').select('id').eq('id', userId).single()
  if (error) { console.error('checkPremiumServer error:', error.message); return false }
  return !!data
}

export async function loadPremiumStatus(userId) {
  if (typeof window === 'undefined') return
  if (userId === ADMIN_ID) {
    localStorage.setItem('tarjama_premium', 'true')
    return
  }
  const { data, error } = await supabase.from('premium_users').select('id').eq('id', userId).single()
  if (error && error.code !== 'PGRST116') {
    console.error('loadPremiumStatus error:', error.message)
    return
  }
  localStorage.setItem('tarjama_premium', data ? 'true' : 'false')
}

export async function grantPremium(userId, grantedBy) {
  if (grantedBy !== ADMIN_ID) return { error: 'Non autorisé' }
  const { error } = await supabase.from('premium_users').upsert(
    { id: userId, granted_by: grantedBy },
    { onConflict: 'id' }
  )
  return { error: error?.message || null }
}

export async function revokePremium(userId, revokedBy) {
  if (revokedBy !== ADMIN_ID) return { error: 'Non autorisé' }
  const { error } = await supabase.from('premium_users').delete().eq('id', userId)
  return { error: error?.message || null }
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
