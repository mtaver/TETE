import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyProgress, loadProgress, ratingChange, recordAttempt, resetProgress, saveProgress, scoreAnswers } from '../src/progress.js'
import { CASES, validateCase } from '../src/cases.js'
import { TOPICS, searchTopics } from '../src/topics.js'
import { FEEDBACK_FLAGS_KEY, checkInterpretation, recordFeedbackFlag } from '../src/interpretationFeedback.js'
import { parseRoute } from '../src/navigation.js'

const caseId = 'normal-sinus-rhythm-01'
const questions = [
  { id: 'rate', answer: 'correct-rate' }, { id: 'rhythm', answer: 'correct-rhythm' }, { id: 'axis', answer: 'correct-axis' },
  { id: 'pWaves', answer: 'correct-p' }, { id: 'pr', answer: 'correct-pr' }, { id: 'qrs', answer: 'correct-qrs' }, { id: 'stt', answer: 'correct-stt' },
]
const correct = Object.fromEntries(questions.map((q) => [q.id, q.answer]))
const attempt = (overrides = {}) => ({ id: 'attempt-1', caseId, mode: 'rated', percentage: 100, correctness: {}, createdAt: '2026-10-05T00:00:00.000Z', ...overrides })

test('navigation separates practice modes and preserves legacy entry links', () => {
  const caseIds = CASES.map((item) => item.id)
  assert.deepEqual(parseRoute('#practice', caseIds), { view: 'modes' })
  assert.deepEqual(parseRoute('#learning', caseIds), { view: 'learning' })
  assert.deepEqual(parseRoute('#assessment', caseIds), { view: 'assessment' })
  assert.deepEqual(parseRoute('#progress', caseIds), { view: 'progress' })
  assert.deepEqual(parseRoute(`#case/${caseId}/learning`, caseIds), { view: 'case', caseId, mode: 'learning' })
  assert.deepEqual(parseRoute(`#case/${caseId}/assessment`, caseIds), { view: 'case', caseId, mode: 'assessment' })
  assert.deepEqual(parseRoute('#case/not-a-case/assessment', caseIds), { view: 'home' })
})

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
  const newVariant = recordAttempt(secondCase.progress, attempt({ id: 'attempt-3', caseId: 'sinus-bradycardia-02' }))
  assert.equal(first.attempt.rated, true)
  assert.equal(secondCase.attempt.rated, true)
  assert.equal(newVariant.attempt.rated, true)
  assert.equal(newVariant.progress.attempts.length, 3)
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
  assert.equal(CASES.length, 6)
  assert.equal(new Set(CASES.map((item) => item.id)).size, CASES.length)
  assert.deepEqual(CASES.slice(0, 3).map((item) => item.id), ['normal-sinus-rhythm-01', 'sinus-bradycardia-01', 'sinus-tachycardia-01'])
  for (const caseData of CASES) assert.deepEqual(validateCase(caseData), { spacingMatchesRate: true, rrMatchesRate: true, answerMatchesRate: true, intervalsMatchAnswers: true, hasAllQuestionIds: true, rhythmMatchesRate: true, answersAreOptions: true, hasTeachingSupport: true, reviewPending: true })
})

test('existing version-one progress loads without rewriting attempts', () => {
  const existing = { version: 1, rating: 640, attempts: [{ id: 'old', caseId, percentage: 100, rated: true }] }
  const storage = { getItem: () => JSON.stringify(existing) }
  assert.deepEqual(loadProgress(storage).progress, existing)
})

test('local topic search matches names and common synonyms', () => {
  assert.deepEqual(searchTopics('NSR').map((topic) => topic.id), ['normal-sinus-rhythm'])
  assert.deepEqual(searchTopics('slow heart rate').map((topic) => topic.id), ['sinus-bradycardia'])
  assert.deepEqual(searchTopics('fast heart rate').map((topic) => topic.id), ['sinus-tachycardia'])
  assert.deepEqual(searchTopics('bpm').map((topic) => topic.id), ['rate'])
  assert.deepEqual(searchTopics('regularity').map((topic) => topic.id), ['rhythm'])
})

test('topic search handles empty and unmatched searches without invented results', () => {
  assert.deepEqual(searchTopics(''), [])
  assert.deepEqual(searchTopics('   '), [])
  assert.deepEqual(searchTopics('atrial fibrillation'), [])
})

test('every topic maps only to existing cases and has offline sourced teaching text', () => {
  const caseIds = new Set(CASES.map((caseData) => caseData.id))
  for (const topic of TOPICS) {
    assert.ok(topic.explanation.length > 30)
    assert.ok(topic.sourceKey)
    assert.ok(topic.caseIds.length > 0)
    assert.ok(topic.caseIds.every((id) => caseIds.has(id)))
  }
  assert.deepEqual(TOPICS.find((topic) => topic.id === 'normal-sinus-rhythm').caseIds, ['normal-sinus-rhythm-01', 'normal-sinus-rhythm-02'])
  assert.deepEqual(TOPICS.find((topic) => topic.id === 'sinus-bradycardia').caseIds, ['sinus-bradycardia-01', 'sinus-bradycardia-02'])
  assert.deepEqual(TOPICS.find((topic) => topic.id === 'sinus-tachycardia').caseIds, ['sinus-tachycardia-01', 'sinus-tachycardia-02'])
})

test('guided exposure protects only the selected new case', () => {
  const guided = recordAttempt(emptyProgress(), attempt({ mode: 'guided', caseId: 'normal-sinus-rhythm-02' }))
  const sameCase = recordAttempt(guided.progress, attempt({ id: 'attempt-2', caseId: 'normal-sinus-rhythm-02' }))
  const otherNewCase = recordAttempt(sameCase.progress, attempt({ id: 'attempt-3', caseId: 'sinus-tachycardia-02' }))
  assert.equal(sameCase.attempt.rated, false)
  assert.equal(otherNewCase.attempt.rated, true)
})

test('interpretation checker recognises a clear case-consistent explanation', () => {
  const feedback = checkInterpretation('Normal sinus rhythm at 75 bpm. P waves are present before each QRS. Normal axis. PR interval is 160 ms and QRS duration is 80 ms. There is no significant ST/T abnormality.', CASES[0])
  assert.equal(feedback.status, 'reviewed')
  assert.deepEqual(feedback.clear.map((item) => item.id), ['rate', 'rhythm', 'axis', 'pWaves', 'pr', 'qrs', 'stt'])
  assert.deepEqual(feedback.contradictions, [])
  assert.deepEqual(feedback.missing, [])
})

test('interpretation checker reports incomplete and contradictory findings', () => {
  const incomplete = checkInterpretation('Normal sinus rhythm at 75 bpm.', CASES[0])
  assert.deepEqual(incomplete.clear.map((item) => item.id), ['rate', 'rhythm'])
  assert.ok(incomplete.missing.includes('P waves'))

  const contradictory = checkInterpretation('Sinus tachycardia at 120 bpm with right axis deviation and a wide QRS.', CASES[0])
  assert.deepEqual(contradictory.contradictions.map((item) => item.id), ['rate', 'rhythm', 'axis', 'qrs'])
})

test('interpretation checker handles negation and uncertainty without keyword credit', () => {
  const negated = checkInterpretation('This is not normal sinus rhythm. P waves are not present.', CASES[0])
  assert.deepEqual(negated.contradictions.map((item) => item.id), ['rhythm', 'pWaves'])
  assert.deepEqual(negated.clear, [])

  const uncertain = checkInterpretation('Maybe this is normal sinus rhythm at 75 bpm.', CASES[0])
  assert.deepEqual(uncertain.uncertain.map((item) => item.id), ['rate', 'rhythm'])
  assert.deepEqual(uncertain.clear, [])
})

test('interpretation checker handles blank and unrecognised wording safely', () => {
  assert.equal(checkInterpretation('   ', CASES[0]).status, 'blank')
  const unrecognised = checkInterpretation('The tracing has a calm-looking shape.', CASES[0])
  assert.equal(unrecognised.status, 'unrecognised')
  assert.equal(unrecognised.missing.length, 7)
  assert.equal(unrecognised.checklist.length, 4)
})

test('reviewing written feedback cannot add attempts or change rating', () => {
  const progress = recordAttempt(emptyProgress(), attempt()).progress
  const snapshot = JSON.stringify(progress)
  checkInterpretation('Normal sinus rhythm.', CASES[0])
  checkInterpretation('Normal sinus rhythm at 75 bpm.', CASES[0])
  assert.equal(JSON.stringify(progress), snapshot)
})

test('feedback flags stay in their separate local storage record', () => {
  const memory = new Map()
  const storage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
  assert.equal(recordFeedbackFlag(storage, { caseId, interpretation: 'text', createdAt: 'now' }).ok, true)
  assert.equal(JSON.parse(memory.get(FEEDBACK_FLAGS_KEY)).length, 1)
  assert.equal(memory.has('tete-progress-v1'), false)
})
