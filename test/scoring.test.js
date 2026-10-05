import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyProgress, loadProgress, ratingChange, recordAttempt, resetProgress, saveProgress, scoreAnswers } from '../src/progress.js'
import { CASES, validateCase } from '../src/cases.js'

const caseId = 'normal-sinus-rhythm-01'
const questions = [
  { id: 'rate', answer: 'correct-rate' }, { id: 'rhythm', answer: 'correct-rhythm' }, { id: 'axis', answer: 'correct-axis' },
  { id: 'pWaves', answer: 'correct-p' }, { id: 'pr', answer: 'correct-pr' }, { id: 'qrs', answer: 'correct-qrs' }, { id: 'stt', answer: 'correct-stt' },
]
const correct = Object.fromEntries(questions.map((q) => [q.id, q.answer]))
const attempt = (overrides = {}) => ({ id: 'attempt-1', caseId, mode: 'rated', percentage: 100, correctness: {}, createdAt: '2026-10-05T00:00:00.000Z', ...overrides })

test('weighted scoring handles all-correct, mixed, all-incorrect, and Not sure', () => {
  assert.deepEqual(scoreAnswers(questions, correct, caseId), { earned: 100, total: 100, percentage: 100 })
  assert.equal(scoreAnswers(questions, { rhythm: 'correct-rhythm', rate: 'correct-rate', axis: 'correct-axis' }, caseId).percentage, 45)
  assert.equal(scoreAnswers(questions, {}, caseId).percentage, 0)
  assert.equal(scoreAnswers(questions, Object.fromEntries(questions.map((q) => [q.id, 'Not sure'])), caseId).percentage, 0)
})

test('rating formula is bounded and moves around configured difficulty', () => {
  assert.equal(ratingChange(600, 100, caseId).delta, 40)
  assert.equal(ratingChange(600, 0, caseId).delta, -40)
  assert.equal(ratingChange(1200, 100, caseId).nextRating, 1200)
  assert.equal(ratingChange(100, 0, caseId).nextRating, 100)
})

test('guided attempts are recorded but never rated', () => {
  const result = recordAttempt(emptyProgress(), attempt({ mode: 'guided' }))
  assert.equal(result.progress.rating, 600)
  assert.equal(result.attempt.classification, 'practice')
})

test('only the first rated attempt for the case changes rating', () => {
  const first = recordAttempt(emptyProgress(), attempt())
  const second = recordAttempt(first.progress, attempt({ id: 'attempt-2', percentage: 0 }))
  assert.equal(first.attempt.rated, true)
  assert.equal(first.progress.rating, 640)
  assert.equal(second.attempt.rated, false)
  assert.equal(second.progress.rating, 640)
  assert.equal(second.progress.attempts.length, 2)
})

test('seeing an answer key in Guided Practice protects that case rating', () => {
  const guided = recordAttempt(emptyProgress(), attempt({ mode: 'guided' }))
  const laterAssessment = recordAttempt(guided.progress, attempt({ id: 'attempt-2', mode: 'rated' }))
  assert.equal(laterAssessment.attempt.rated, false)
  assert.equal(laterAssessment.progress.rating, 600)
})

test('rating eligibility is independent for each stable case id', () => {
  const first = recordAttempt(emptyProgress(), attempt())
  const secondCase = recordAttempt(first.progress, attempt({ id: 'attempt-2', caseId: 'sinus-bradycardia-01' }))
  assert.equal(first.attempt.rated, true)
  assert.equal(secondCase.attempt.rated, true)
  assert.equal(secondCase.progress.attempts.length, 2)
})

test('a decreasing rated attempt remains recorded', () => {
  const result = recordAttempt(emptyProgress(), attempt({ percentage: 0 }))
  assert.equal(result.progress.rating, 560)
  assert.equal(result.progress.attempts.length, 1)
  assert.equal(result.progress.attempts[0].percentage, 0)
})

test('duplicate attempt id is idempotent', () => {
  const first = recordAttempt(emptyProgress(), attempt())
  const duplicate = recordAttempt(first.progress, attempt())
  assert.equal(duplicate.recorded, false)
  assert.equal(duplicate.progress.rating, 640)
  assert.equal(duplicate.progress.attempts.length, 1)
})

test('progress survives serialization, handles corruption, and resets', () => {
  const memory = new Map()
  const storage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) }
  const progress = recordAttempt(emptyProgress(), attempt()).progress
  assert.equal(saveProgress(storage, progress).ok, true)
  assert.equal(loadProgress(storage).progress.rating, 640)
  storage.setItem('tete-progress-v1', '{broken')
  assert.equal(loadProgress(storage).status, 'unavailable')
  assert.equal(resetProgress(storage).progress.rating, 600)
})

test('unavailable local storage degrades without blocking scoring', () => {
  const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } }
  assert.equal(loadProgress(blocked).status, 'unavailable')
  assert.equal(saveProgress(blocked, emptyProgress()).ok, false)
  assert.equal(resetProgress(blocked).ok, false)
  assert.equal(scoreAnswers(questions, correct, caseId).percentage, 100)
})

test('all schematic case parameters agree with their answer keys', () => {
  assert.equal(new Set(CASES.map((item) => item.id)).size, CASES.length)
  for (const caseData of CASES) assert.deepEqual(validateCase(caseData), { spacingMatchesRate: true, rrMatchesRate: true, answerMatchesRate: true, intervalsMatchAnswers: true, hasAllQuestionIds: true })
})

test('existing version-one progress loads without rewriting attempts', () => {
  const existing = { version: 1, rating: 640, attempts: [{ id: 'old', caseId, percentage: 100, rated: true }] }
  const storage = { getItem: () => JSON.stringify(existing) }
  assert.deepEqual(loadProgress(storage).progress, existing)
})
