import { CASES } from './cases.js'
import { SCORING_CONFIG } from './scoringConfig.js'

export const BACKUP_FORMAT = 'tete-progress-backup'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 1024 * 1024

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const validNumber = (value, minimum, maximum) => Number.isFinite(value) && value >= minimum && value <= maximum

export function createProgressBackup(progress, exportedAt = new Date().toISOString()) {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt, progress }
}

export function serializeProgressBackup(progress, exportedAt) {
  return `${JSON.stringify(createProgressBackup(progress, exportedAt), null, 2)}\n`
}

export function validateBackupProgress(progress, cases = CASES) {
  if (!isRecord(progress) || progress.version !== 1 || !validNumber(progress.rating, SCORING_CONFIG.minimumRating, SCORING_CONFIG.maximumRating) || !Array.isArray(progress.attempts)) return { ok: false, code: 'invalidStructure' }
  const casesById = new Map(cases.map((caseData) => [caseData.id, caseData]))
  const attemptIds = new Set()
  for (const attempt of progress.attempts) {
    if (!isRecord(attempt) || typeof attempt.id !== 'string' || !attempt.id || attempt.id.length > 200 || attemptIds.has(attempt.id)) return { ok: false, code: 'invalidAttempt' }
    attemptIds.add(attempt.id)
    const caseData = casesById.get(attempt.caseId)
    if (!caseData || !['guided', 'rated'].includes(attempt.mode) || !validNumber(attempt.percentage, 0, 100)) return { ok: false, code: 'invalidAttempt' }
    if (attempt.createdAt !== undefined && (typeof attempt.createdAt !== 'string' || Number.isNaN(Date.parse(attempt.createdAt)))) return { ok: false, code: 'invalidAttempt' }
    if (attempt.rated !== undefined && typeof attempt.rated !== 'boolean') return { ok: false, code: 'invalidAttempt' }
    if (attempt.classification !== undefined && !['rated', 'practice'].includes(attempt.classification)) return { ok: false, code: 'invalidAttempt' }
    for (const field of ['ratingBefore', 'ratingAfter']) if (attempt[field] !== undefined && !validNumber(attempt[field], SCORING_CONFIG.minimumRating, SCORING_CONFIG.maximumRating)) return { ok: false, code: 'invalidAttempt' }
    if (attempt.ratingDelta !== undefined && !Number.isFinite(attempt.ratingDelta)) return { ok: false, code: 'invalidAttempt' }
    if (attempt.expectedPercentage !== undefined && attempt.expectedPercentage !== null && !validNumber(attempt.expectedPercentage, 0, 100)) return { ok: false, code: 'invalidAttempt' }
    if (attempt.focusSkill !== undefined && attempt.focusSkill !== null && !caseData.questions.some((question) => question.id === attempt.focusSkill)) return { ok: false, code: 'invalidId' }

    const questions = new Map(caseData.questions.map((question) => [question.id, question]))
    if (attempt.correctness !== undefined) {
      if (!isRecord(attempt.correctness)) return { ok: false, code: 'invalidAttempt' }
      for (const [questionId, correct] of Object.entries(attempt.correctness)) if (!questions.has(questionId) || typeof correct !== 'boolean') return { ok: false, code: 'invalidId' }
    }
    if (attempt.responses !== undefined) {
      if (!isRecord(attempt.responses)) return { ok: false, code: 'invalidAttempt' }
      for (const [questionId, answer] of Object.entries(attempt.responses)) {
        const question = questions.get(questionId)
        if (!question) return { ok: false, code: 'invalidId' }
        const allowed = new Set([...question.optionIds, ...question.options, 'not-sure', 'Not sure'])
        if (typeof answer !== 'string' || !allowed.has(answer)) return { ok: false, code: 'invalidValue' }
      }
    }
  }
  return { ok: true, progress }
}

export function parseProgressBackup(text, cases = CASES) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) return { ok: false, code: 'fileTooLarge' }
  let backup
  try { backup = JSON.parse(text) } catch { return { ok: false, code: 'invalidJson' } }
  if (!isRecord(backup) || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION || !isRecord(backup.progress)) return { ok: false, code: 'unsupportedBackup' }
  const validated = validateBackupProgress(backup.progress, cases)
  return validated.ok ? { ok: true, backup, progress: backup.progress } : validated
}
