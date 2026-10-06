import { CASES, CASE_SOURCES, SKILL_LABELS } from './cases.js'
import { SCORING_CONFIG } from './scoringConfig.js'

function chooseCase(cases, attempts, skill, sourceCaseId) {
  const seenIds = new Set(attempts.map((attempt) => attempt.caseId))
  return cases
    .filter((caseData) => !skill || caseData.skills.includes(skill))
    .map((caseData, index) => ({ caseData, index, seen: seenIds.has(caseData.id), same: caseData.id === sourceCaseId }))
    .sort((a, b) => Number(a.seen) - Number(b.seen) || Number(a.same) - Number(b.same) || a.index - b.index)[0]?.caseData || null
}

export function getLearningRecommendation(progress, cases = CASES) {
  const attempts = Array.isArray(progress?.attempts) ? progress.attempts : []
  if (!attempts.length) {
    const caseData = chooseCase(cases, attempts, null, null)
    return { kind: 'basics', title: 'Start with the basics', explanation: 'Begin with a systematic review of rate, rhythm, waves, intervals, axis, and ST/T findings.', caseId: caseData?.id || null, skill: null, review: false }
  }

  const misses = []
  attempts.forEach((attempt, recency) => {
    Object.entries(attempt.correctness || {}).forEach(([skill, correct]) => {
      if (correct !== false || !SKILL_LABELS[skill]) return
      misses.push({
        skill,
        recency,
        caseId: attempt.caseId,
        weight: SCORING_CONFIG.cases[attempt.caseId]?.weights?.[skill] || 0,
        notSure: attempt.responses?.[skill] === 'Not sure',
      })
    })
  })

  if (!misses.length) {
    const caseData = chooseCase(cases, attempts, null, null)
    return { kind: 'general', title: 'Keep practising systematically', explanation: 'No missed skills are recorded, so Tete is suggesting general practice rather than inventing a weakness.', caseId: caseData?.id || null, skill: null, review: Boolean(caseData && attempts.some((attempt) => attempt.caseId === caseData.id)) }
  }

  misses.sort((a, b) => b.recency - a.recency || b.weight - a.weight)
  const target = misses[0]
  const caseData = chooseCase(cases, attempts, target.skill, target.caseId)
  const label = SKILL_LABELS[target.skill]
  if (!caseData) {
    const sourceCase = cases.find((item) => item.id === target.caseId)
    const question = sourceCase?.questions.find((item) => item.id === target.skill)
    const source = question ? CASE_SOURCES[question.resource] : null
    return { kind: 'summary', title: `Review ${label.toLowerCase()}`, explanation: `No suitable case is available. Review ${label.toLowerCase()} because it was missed in your recent attempt.`, caseId: null, skill: target.skill, source }
  }

  return {
    kind: 'missed',
    title: `Practise ${label.toLowerCase()}`,
    explanation: `Practise ${label.toLowerCase()} because you ${target.notSure ? 'selected “Not sure” for it' : 'missed it'} in your recent attempt.`,
    caseId: caseData.id,
    skill: target.skill,
    review: attempts.some((attempt) => attempt.caseId === caseData.id),
  }
}

export function focusedInstruction(caseData, skill) {
  if (!skill) return 'Complete the full interpretation systematically.'
  const question = caseData?.questions.find((item) => item.id === skill)
  return question ? `Focus first on ${question.label.toLowerCase()}: ${question.hint}` : 'Complete the full interpretation systematically.'
}

export function getMistakeReview(progress, cases = CASES) {
  const attempts = Array.isArray(progress?.attempts) ? progress.attempts : []
  return [...attempts].reverse().flatMap((attempt) => {
    const caseData = cases.find((item) => item.id === attempt.caseId)
    if (!caseData) return []
    return caseData.questions.flatMap((question) => {
      if (attempt.correctness?.[question.id] !== false) return []
      const hasStoredResponse = Object.prototype.hasOwnProperty.call(attempt.responses || {}, question.id)
      const practiceCase = chooseCase(cases, attempts, question.id, attempt.caseId)
      return [{
        id: `${attempt.id}-${question.id}`,
        attemptId: attempt.id,
        caseId: attempt.caseId,
        caseLabel: caseData.number,
        skill: question.id,
        skillLabel: question.label,
        createdAt: attempt.createdAt || null,
        modeLabel: attempt.rated ? 'Assessment Mode · rated' : attempt.mode === 'guided' ? 'Learning Mode' : 'Assessment Mode · practice',
        selectedAnswer: hasStoredResponse ? attempt.responses[question.id] : null,
        answerRecorded: hasStoredResponse,
        correctAnswer: question.answer,
        explanation: question.explanation,
        practiceCaseId: practiceCase?.id || null,
        practiceCaseLabel: practiceCase?.number || null,
        reviewPractice: Boolean(practiceCase && attempts.some((item) => item.caseId === practiceCase.id)),
      }]
    })
  })
}
