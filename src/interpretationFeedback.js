export const FEEDBACK_FLAGS_KEY = 'tete-interpretation-feedback-flags-v1'

const uncertaintyPattern = /\b(?:maybe|possibly|perhaps|probably|unsure|not sure|uncertain|could be|might be|may be)\b/i
const sentenceParts = (text) => text.split(/(?<=[.!?;\n])\s*/).map((part) => part.trim()).filter(Boolean)
const normalize = (text) => text.toLocaleLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()
const hasNegationBefore = (text, index) => /\b(?:no|not|without|isn't|isnt|aren't|arent|absent)\b/i.test(text.slice(Math.max(0, index - 35), index))

function patternFinding(sentences, rule) {
  for (const sentence of sentences) {
    const normalized = normalize(sentence)
    for (const pattern of rule.correctPatterns) {
      const match = pattern.exec(normalized)
      pattern.lastIndex = 0
      if (!match) continue
      if (uncertaintyPattern.test(normalized)) return { kind: 'uncertain', evidence: sentence }
      if (!rule.allowNegatedCorrect && hasNegationBefore(normalized, match.index)) return { kind: 'contradiction', evidence: sentence }
      return { kind: 'correct', evidence: sentence }
    }
    for (const pattern of rule.contradictionPatterns) {
      const match = pattern.exec(normalized)
      pattern.lastIndex = 0
      if (!match || hasNegationBefore(normalized, match.index)) continue
      if (uncertaintyPattern.test(normalized)) return { kind: 'uncertain', evidence: sentence }
      return { kind: 'contradiction', evidence: sentence }
    }
  }
  return null
}

function rateFinding(sentences, expectedRate) {
  for (const sentence of sentences) {
    const normalized = normalize(sentence)
    const matches = [...normalized.matchAll(/\b(\d{2,3})\s*(?:bpm|beats? per minute)\b/g)]
    for (const match of matches) {
      const value = Number(match[1])
      if (value < 20 || value > 250) continue
      if (uncertaintyPattern.test(normalized)) return { kind: 'uncertain', evidence: sentence }
      if (value === expectedRate && !hasNegationBefore(normalized, match.index)) return { kind: 'correct', evidence: sentence }
      return { kind: 'contradiction', evidence: sentence }
    }
  }
  return null
}

function intervalFinding(sentences, label, expected, descriptors) {
  const labelPattern = label === 'PR interval' ? /\bpr(?: interval)?\b/i : /\bqrs(?: duration)?\b/i
  for (const sentence of sentences) {
    const normalized = normalize(sentence)
    const labelMatch = labelPattern.exec(normalized)
    labelPattern.lastIndex = 0
    if (!labelMatch) continue
    const number = normalized.slice(labelMatch.index + labelMatch[0].length).match(/\b(\d{2,3})\s*ms\b/)
    if (uncertaintyPattern.test(normalized)) return { kind: 'uncertain', evidence: sentence }
    if (number) return { kind: Number(number[1]) === expected ? 'correct' : 'contradiction', evidence: sentence }
    if (descriptors.correct.some((pattern) => pattern.test(normalized))) return { kind: 'correct', evidence: sentence }
    if (descriptors.wrong.some((pattern) => pattern.test(normalized))) return { kind: 'contradiction', evidence: sentence }
  }
  return null
}

function rulesFor(caseData) {
  const rhythm = caseData.questions.find((question) => question.id === 'rhythm').answer
  const rhythmCorrect = rhythm === 'Regular sinus bradycardia' ? /\b(?:sinus bradycardia|bradycardic sinus rhythm)\b/i : rhythm === 'Regular sinus tachycardia' ? /\b(?:sinus tachycardia|tachycardic sinus rhythm)\b/i : /\b(?:normal sinus rhythm|regular sinus rhythm)\b/i
  const rhythmWrong = rhythm === 'Regular sinus bradycardia' ? /\b(?:sinus tachycardia|normal sinus rhythm)\b/i : rhythm === 'Regular sinus tachycardia' ? /\b(?:sinus bradycardia|normal sinus rhythm)\b/i : /\b(?:sinus bradycardia|sinus tachycardia)\b/i
  return [
    { id: 'rate', label: 'Rate', find: (sentences) => rateFinding(sentences, caseData.rate) },
    { id: 'rhythm', label: 'Rhythm', find: (sentences) => patternFinding(sentences, { correctPatterns: [rhythmCorrect], contradictionPatterns: [rhythmWrong] }) },
    { id: 'axis', label: 'Axis', find: (sentences) => patternFinding(sentences, { correctPatterns: [/\bnormal (?:qrs )?axis\b/i], contradictionPatterns: [/\b(?:left|right) axis deviation\b/i] }) },
    { id: 'pWaves', label: 'P waves', find: (sentences) => patternFinding(sentences, { correctPatterns: [/\b(?:p waves? (?:are )?(?:present|visible)|sinus p waves?)\b/i], contradictionPatterns: [/\b(?:no|absent) p waves?\b/i, /\bp waves? (?:are )?not (?:present|visible)\b/i], allowNegatedCorrect: true }) },
    { id: 'pr', label: 'PR interval', find: (sentences) => intervalFinding(sentences, 'PR interval', caseData.prMs, { correct: [/\bnormal\b/i], wrong: [/\b(?:short|prolonged)\b/i] }) },
    { id: 'qrs', label: 'QRS duration', find: (sentences) => intervalFinding(sentences, 'QRS duration', caseData.qrsMs, { correct: [/\b(?:normal|narrow)\b/i], wrong: [/\bwide\b/i] }) },
    { id: 'stt', label: 'ST/T findings', find: (sentences) => patternFinding(sentences, { correctPatterns: [/\bno significant st\/?t abnormalit(?:y|ies)\b/i, /\bno (?:st elevation|st depression)(?: or (?:st elevation|st depression))?\b/i, /\bisoelectric st segments?\b/i], contradictionPatterns: [/\bst (?:elevation|depression)\b/i, /\bt-wave inversion\b/i], allowNegatedCorrect: true }) },
  ]
}

export function exampleInterpretation(caseData) {
  return `This ECG shows ${caseData.diagnosis.toLowerCase()} at ${caseData.rate} bpm. The rhythm is regular, with sinus P waves before every QRS. The axis is normal, the PR interval is ${caseData.prMs} ms, and the QRS is narrow at ${caseData.qrsMs} ms. There is no significant ST/T abnormality.`
}

export function checkInterpretation(text, caseData) {
  const trimmed = text.trim()
  const checklist = ['State the rate and rhythm.', 'Describe P waves and their relationship to QRS complexes.', 'Report axis, PR interval, and QRS duration.', 'Describe significant ST/T findings or their absence.']
  if (!trimmed) return { status: 'blank', clear: [], contradictions: [], uncertain: [], missing: rulesFor(caseData).map(({ label }) => label), checklist, example: exampleInterpretation(caseData) }

  const sentences = sentenceParts(trimmed)
  const assessed = rulesFor(caseData).map((rule) => ({ ...rule, result: rule.find(sentences) }))
  const mapKind = (kind) => assessed.filter(({ result }) => result?.kind === kind).map(({ id, label, result }) => ({ id, label, evidence: result.evidence }))
  const clear = mapKind('correct')
  const contradictions = mapKind('contradiction')
  const uncertain = mapKind('uncertain')
  const missing = assessed.filter(({ result }) => !result).map(({ label }) => label)
  return { status: clear.length || contradictions.length || uncertain.length ? 'reviewed' : 'unrecognised', clear, contradictions, uncertain, missing, checklist, example: exampleInterpretation(caseData) }
}

export function recordFeedbackFlag(storage, flag) {
  try {
    const existing = JSON.parse(storage?.getItem(FEEDBACK_FLAGS_KEY) || '[]')
    const flags = Array.isArray(existing) ? existing : []
    storage?.setItem(FEEDBACK_FLAGS_KEY, JSON.stringify([...flags, flag]))
    return { ok: true }
  } catch {
    return { ok: false, message: 'This feedback flag could not be saved in this browser.' }
  }
}
