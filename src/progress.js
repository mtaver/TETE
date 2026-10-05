import { SCORING_CONFIG } from './scoringConfig.js'

export const STORAGE_KEY = 'tete-progress-v1'

export function emptyProgress() {
  return { version: 1, rating: SCORING_CONFIG.startingRating, attempts: [] }
}

export function scoreAnswers(questions, answers, caseId) {
  const weights = SCORING_CONFIG.cases[caseId].weights
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
  const earned = questions.reduce((sum, question) => sum + (answers[question.id] === question.answer ? weights[question.id] : 0), 0)
  return { earned, total, percentage: Math.round((earned / total) * 100) }
}

export function ratingChange(rating, percentage, caseId) {
  const config = SCORING_CONFIG
  const difficulty = config.cases[caseId].difficulty
  const expected = 1 / (1 + 10 ** ((difficulty - rating) / 400))
  const actual = percentage / 100
  const rawDelta = Math.round(config.kFactor * (actual - expected))
  const nextRating = Math.min(config.maximumRating, Math.max(config.minimumRating, rating + rawDelta))
  return { expected, actual, delta: nextRating - rating, nextRating, difficulty }
}

export function recordAttempt(progress, attempt) {
  if (progress.attempts.some((item) => item.id === attempt.id)) {
    return { progress, recorded: false, duplicate: true, attempt: progress.attempts.find((item) => item.id === attempt.id) }
  }

  // Seeing an answer key in either mode makes every later attempt on that case
  // practice-only. Existing attempt records remain the source of truth.
  const firstRatedCaseAttempt = attempt.mode === 'rated' && !progress.attempts.some((item) => item.caseId === attempt.caseId)
  const rating = firstRatedCaseAttempt ? ratingChange(progress.rating, attempt.percentage, attempt.caseId) : { expected: null, actual: attempt.percentage / 100, delta: 0, nextRating: progress.rating, difficulty: SCORING_CONFIG.cases[attempt.caseId].difficulty }
  const storedAttempt = {
    ...attempt,
    rated: firstRatedCaseAttempt,
    ratingBefore: progress.rating,
    ratingAfter: rating.nextRating,
    ratingDelta: rating.delta,
    expectedPercentage: rating.expected === null ? null : Math.round(rating.expected * 100),
    classification: firstRatedCaseAttempt ? 'rated' : 'practice',
  }
  return {
    recorded: true,
    duplicate: false,
    attempt: storedAttempt,
    progress: { ...progress, rating: rating.nextRating, attempts: [...progress.attempts, storedAttempt] },
  }
}

export function loadProgress(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return { progress: emptyProgress(), status: 'ready' }
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1 || !Number.isFinite(parsed.rating) || !Array.isArray(parsed.attempts)) throw new Error('Invalid progress shape')
    return { progress: parsed, status: 'ready' }
  } catch {
    return { progress: emptyProgress(), status: 'unavailable', message: 'Saved progress could not be read. This session will continue without relying on it.' }
  }
}

export function saveProgress(storage, progress) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(progress))
    return { ok: true }
  } catch {
    return { ok: false, message: 'Progress could not be saved on this device. You can continue, but this attempt may not persist.' }
  }
}

export function resetProgress(storage) {
  try {
    storage?.removeItem(STORAGE_KEY)
    return { ok: true, progress: emptyProgress() }
  } catch {
    return { ok: false, progress: emptyProgress(), message: 'Local progress could not be removed. Browser storage may be unavailable.' }
  }
}

export function skillsNeedingPractice(attempts, questions) {
  const stats = Object.fromEntries(questions.map((question) => [question.id, { label: question.label, correct: 0, total: 0 }]))
  attempts.forEach((attempt) => Object.entries(attempt.correctness || {}).forEach(([id, correct]) => { if (stats[id]) { stats[id].total += 1; stats[id].correct += correct ? 1 : 0 } }))
  return Object.values(stats).filter((skill) => skill.total > 0 && skill.correct / skill.total < 0.8).sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
}
