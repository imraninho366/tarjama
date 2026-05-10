export const BADGES = [
  { id: 'first_verse', icon: '🌱', name: 'Premier pas', desc: 'Traduis ton premier verset', check: (s) => s.total >= 1 },
  { id: 'ten_verses', icon: '📖', name: 'Lecteur assidu', desc: 'Traduis 10 versets', check: (s) => s.total >= 10 },
  { id: 'fifty_verses', icon: '📚', name: 'Savant en herbe', desc: 'Traduis 50 versets', check: (s) => s.total >= 50 },
  { id: 'hundred_verses', icon: '🏆', name: 'Centurion', desc: 'Traduis 100 versets', check: (s) => s.total >= 100 },
  { id: 'first_excellent', icon: '⭐', name: 'Étoile', desc: 'Obtiens ton premier "Excellent"', check: (s) => s.excellent >= 1 },
  { id: 'ten_excellent', icon: '✨', name: 'Perfectionniste', desc: '10 traductions excellentes', check: (s) => s.excellent >= 10 },
  { id: 'first_sourate', icon: '🕌', name: 'Sourate complète', desc: 'Termine une sourate entière', check: (s) => s.souratesCompleted >= 1 },
  { id: 'five_sourates', icon: '🌙', name: 'Croissant', desc: 'Termine 5 sourates', check: (s) => s.souratesCompleted >= 5 },
  { id: 'streak_3', icon: '🔥', name: 'En feu', desc: '3 jours de streak', check: (s) => s.streak >= 3 },
  { id: 'streak_7', icon: '💎', name: 'Diamant', desc: '7 jours de streak', check: (s) => s.streak >= 7 },
  { id: 'streak_30', icon: '👑', name: 'Roi de la constance', desc: '30 jours de streak', check: (s) => s.streak >= 30 },
  { id: 'quiz_50', icon: '🧠', name: 'Quiz master', desc: '50 bonnes réponses au quiz', check: (s) => s.quizCorrect >= 50 },
  { id: 'quiz_200', icon: '🎓', name: 'Diplômé', desc: '200 bonnes réponses au quiz', check: (s) => s.quizCorrect >= 200 },
  { id: 'fatiha', icon: '💚', name: 'Al-Fatiha', desc: "Termine l'Ouverture", check: (s) => s.fatihaComplete },
  { id: 'night_owl', icon: '🦉', name: 'Oiseau de nuit', desc: 'Traduis après 23h', check: (s) => s.nightOwl },
  { id: 'early_bird', icon: '🌅', name: 'Lève-tôt', desc: 'Traduis avant 6h', check: (s) => s.earlyBird },
]

export function computeStats(progress, streak = 0) {
  const entries = Object.entries(progress)
  const total = entries.length
  const excellent = entries.filter(([, p]) => p.niveau === 'excellent' || p.niveau === 'good').length

  const souratesDone = {}
  entries.forEach(([key]) => {
    const sNum = key.split(':')[0]
    souratesDone[sNum] = (souratesDone[sNum] || 0) + 1
  })

  const VERSE_COUNTS = { 1: 7, 112: 4, 113: 5, 114: 6, 103: 3, 108: 3, 110: 3 }
  const souratesCompleted = Object.entries(souratesDone).filter(([sNum, count]) => {
    const expected = VERSE_COUNTS[sNum]
    return expected && count >= expected
  }).length

  const fatihaVerses = entries.filter(([key]) => key.startsWith('1:')).length
  const hour = new Date().getHours()

  const quizCorrect = parseInt(typeof window !== 'undefined' ? localStorage.getItem('tarjama_quiz_correct') || '0' : '0')

  return {
    total,
    excellent,
    souratesCompleted,
    streak,
    quizCorrect,
    fatihaComplete: fatihaVerses >= 7,
    nightOwl: hour >= 23 || hour < 2,
    earlyBird: hour >= 3 && hour < 6,
  }
}

export function getUnlockedBadges(stats) {
  return BADGES.filter(b => b.check(stats))
}

export function getNewBadges(stats) {
  if (typeof window === 'undefined') return []
  const seen = JSON.parse(localStorage.getItem('tarjama_badges_seen') || '[]')
  const unlocked = getUnlockedBadges(stats)
  const newOnes = unlocked.filter(b => !seen.includes(b.id))
  if (newOnes.length > 0) {
    localStorage.setItem('tarjama_badges_seen', JSON.stringify(unlocked.map(b => b.id)))
  }
  return newOnes
}
