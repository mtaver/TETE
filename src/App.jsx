import { useEffect, useId, useRef, useState } from 'react'
import { CASES, CASE_SOURCES, SKILLS, SKILL_LABELS, leadMorphology } from './cases.js'
import { SCORING_CONFIG, WEIGHT_RATIONALE } from './scoringConfig.js'
import { emptyProgress, loadProgress, recordAttempt, resetProgress, saveProgress, scoreAnswers, skillsNeedingPractice } from './progress.js'
import { searchTopics } from './topics.js'
import { checkInterpretation, recordFeedbackFlag } from './interpretationFeedback.js'
import PwaStatus from './PwaStatus.jsx'

const learningSteps = [
  ['01', 'Observe', 'Notice the rhythm, rate, and key visual details.'], ['02', 'Reason', 'Work through what the pattern could mean.'],
  ['03', 'Explain', 'Put your interpretation into your own words.'], ['04', 'Receive guidance', 'Get focused prompts that support your thinking.'],
  ['05', 'Revise', 'Refine your explanation with new insight.'], ['06', 'Improve', 'Build a clearer, more reliable approach over time.'],
]

const allQuestions = CASES[0].questions
const makeAttemptId = () => globalThis.crypto?.randomUUID?.() || `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`

function waveformPath(caseData, lead, y, width, offset = 0) {
  const [p, q, r, s, t] = leadMorphology[lead]
  const qrsStart = caseData.prMs * 0.125
  const qrsEnd = qrsStart + caseData.qrsMs * 0.125
  let d = `M 0 ${y}`
  for (let beat = offset; beat < width + caseData.beatSpacing; beat += caseData.beatSpacing) {
    const points = [[beat, 0], [beat + 2, -p * 20], [beat + 5, -p * 50], [beat + 8, -p * 20], [beat + 10, 0], [beat + qrsStart, 0], [beat + qrsStart + 1, -q * 50], [beat + qrsStart + 4, -r * 50], [beat + qrsEnd - 3, -s * 50], [beat + qrsEnd, 0], [beat + qrsEnd + 15, 0], [beat + qrsEnd + 20, -t * 28], [beat + qrsEnd + 25, -t * 50], [beat + qrsEnd + 30, -t * 28], [beat + caseData.beatSpacing, 0]]
    d += points.map(([x, amp]) => ` L ${x} ${y + amp}`).join('')
  }
  return d
}

function EcgPanel({ caseData }) {
  const titleId = useId()
  const rows = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']]
  return <figure className="ecg-figure" aria-labelledby={titleId}>
    <figcaption><div><span className="case-tag">Schematic educational ECG</span><strong id={titleId}>12-lead resting ECG</strong></div><span>25 mm/s · 10 mm/mV</span></figcaption>
    <div className="ecg-scroll" tabIndex="0" aria-label={`Scrollable schematic 12-lead ECG for ${caseData.number}`}>
      <svg className="ecg" viewBox="0 0 1000 520" role="img" aria-label={`Schematic ECG with a regular sinus mechanism at ${caseData.rate} beats per minute`}>
        <defs><pattern id="smallGrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#efc7c0" strokeWidth="0.55" /></pattern><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><rect width="25" height="25" fill="url(#smallGrid)"/><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#db8f84" strokeWidth="0.8" /></pattern><clipPath id="plotClip"><rect x="0" y="0" width="1000" height="520" /></clipPath></defs>
        <rect width="1000" height="520" fill="#fffaf8"/><rect width="1000" height="520" fill="url(#grid)"/>
        <g clipPath="url(#plotClip)">{rows.flatMap((row, rowIndex) => row.map((lead, columnIndex) => { const x = columnIndex * 250; const y = 80 + rowIndex * 105; return <g key={lead} transform={`translate(${x},0)`}><text x="9" y={y - 34} className="lead-label">{lead}</text><path d={waveformPath(caseData, lead, y, 250, 34)} className="trace" /></g> }))}<text x="9" y="372" className="lead-label">II rhythm strip</text><path d={waveformPath(caseData, 'II', 430, 1000, 34)} className="trace" /><path d="M 10 500 L 10 450 L 35 450 L 35 500 L 55 500" className="calibration" /><text x="65" y="490" className="calibration-label">1 mV</text></g>
      </svg>
    </div>
    <p className="figure-note">Purpose-built schematic—not a patient recording. Horizontal grid: 1 small box = 40 ms; vertical calibration pulse = 10 mm (1 mV). Expert review: <strong>{caseData.reviewStatus}</strong>.</p>
  </figure>
}

function Home() {
  return <main><section className="hero" aria-labelledby="page-title"><div className="eyebrow"><span aria-hidden="true">♥</span> Learn ECGs by thinking them through</div><h1 id="page-title">Tete <span>— ECG Learning Coach</span></h1><p className="intro">Guided ECG practice that helps health-science students slow down, notice the details, and explain their reasoning—not just memorise an answer.</p><a className="primary-button" href="#practice">Browse cases <span aria-hidden="true">→</span></a></section><section className="cycle" aria-labelledby="cycle-title"><div className="section-heading"><p className="kicker">A repeatable approach</p><h2 id="cycle-title">The learning cycle</h2><p>Each practice session follows the same deliberate path.</p></div><ol className="steps">{learningSteps.map(([number, title, description]) => <li key={number}><span className="step-number" aria-hidden="true">{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></section></main>
}

function Question({ question, value, onChange, hintShown, onHint, hintsAllowed }) {
  return <fieldset className="question-card"><legend>{question.label}</legend><label htmlFor={question.id}>Choose the best finding</label><select id={question.id} value={value} onChange={(event) => onChange(question.id, event.target.value)}><option value="">Select an answer</option>{question.options.map((option) => <option key={option}>{option}</option>)}<option>Not sure</option></select>{hintsAllowed && <><button className="hint-button" type="button" onClick={() => onHint(question.id)} aria-expanded={hintShown}>{hintShown ? 'Hide hint' : 'Show hint'}</button>{hintShown && <p className="hint"><strong>Try this:</strong> {question.hint}</p>}</>}</fieldset>
}

function Sources({ caseData }) {
  const sourceKeys = [...new Set(['standards', 'definitions', 'fundamentals', 'sinusRhythms', ...caseData.questions.map((question) => question.resource)])]
  return <aside className="sources" aria-labelledby="sources-title"><h3 id="sources-title">Offline learning summaries and references</h3><p className="notice">The summaries below stay available offline. External source links require an internet connection.</p><ul>{sourceKeys.map((key) => { const source = CASE_SOURCES[key]; return <li key={key}><p>{source.summary}</p><a href={source.url} target="_blank" rel="noreferrer">Source: {source.title} (internet required)</a> — {source.note}</li> })}</ul><p>Rate thresholds are introductory adult conventions and require clinical context. These schematic cases teach pattern recognition, not diagnosis or management.</p></aside>
}

function ProgressPanel({ progress, storageMessage, onReset }) {
  const [confirming, setConfirming] = useState(false)
  const weakSkills = skillsNeedingPractice(progress.attempts, allQuestions)
  const ratedAttempts = progress.attempts.filter((attempt) => attempt.rated)
  const practiceAttempts = progress.attempts.filter((attempt) => !attempt.rated)
  const caseName = (id) => CASES.find((item) => item.id === id)?.number || 'Legacy case'
  const modeLabel = (attempt) => attempt.rated ? 'Rated assessment' : attempt.mode === 'guided' ? 'Guided practice' : 'Repeat assessment · practice'
  return <section className="progress-panel" aria-labelledby="progress-title"><div className="progress-top"><div><p className="kicker">Stored on this device</p><h2 id="progress-title">Progress dashboard</h2></div><div className="rating-block"><span>Current prototype rating</span><strong>{progress.rating}</strong></div></div><p className="device-note">Progress is stored only in this browser on this device. It does not sync and may be lost if browser data is cleared.</p>{storageMessage && <p className="storage-warning" role="status">{storageMessage}</p>}<div className="metric-grid"><div><strong>{ratedAttempts.length}</strong><span>Rated assessments completed</span></div><div><strong>{practiceAttempts.length}</strong><span>Guided/practice attempts completed</span></div><div><strong>{progress.attempts.length}</strong><span>Total submitted attempts</span></div></div><div className="progress-grid"><div><h3>Score history</h3>{progress.attempts.length ? <ol className="history-list">{[...progress.attempts].reverse().map((attempt) => <li key={attempt.id}><span>{caseName(attempt.caseId)} · {attempt.percentage}%</span><small>{modeLabel(attempt)}</small></li>)}</ol> : <p>No attempts recorded yet.</p>}<p className="history-note">Guided and repeat scores reflect assisted or previously exposed practice. Score increases there are not evidence of independent improvement.</p></div><div><h3>Rating history</h3>{ratedAttempts.length ? <ol className="history-list"><li><span>Starting rating</span><small>{SCORING_CONFIG.startingRating}</small></li>{ratedAttempts.map((attempt) => <li key={attempt.id}><span>{attempt.ratingBefore} → {attempt.ratingAfter}</span><small>{caseName(attempt.caseId)}</small></li>)}</ol> : <p>Complete an unseen case assessment to update it.</p>}</div><div><h3>Skills needing more practice</h3>{weakSkills.length ? <ul className="skill-list">{weakSkills.map((skill) => <li key={skill.label}>{skill.label} <span>{skill.correct}/{skill.total}</span></li>)}</ul> : <p>{progress.attempts.length ? 'No skill is below 80% yet.' : 'Complete a case to see guidance.'}</p>}</div></div>{confirming ? <div className="reset-confirm" role="group" aria-label="Confirm reset progress"><p>Reset all local attempts and return the rating to {SCORING_CONFIG.startingRating}?</p><button type="button" className="danger-button" onClick={() => { onReset(); setConfirming(false) }}>Yes, reset progress</button><button type="button" className="text-button" onClick={() => setConfirming(false)}>Cancel</button></div> : <button type="button" className="text-button danger-text" onClick={() => setConfirming(true)}>Reset progress</button>}</section>
}

function CaseLibrary({ progress, onSelect }) {
  const [skill, setSkill] = useState('all')
  const [query, setQuery] = useState('')
  const matching = CASES.filter((item) => skill === 'all' || item.skills.includes(skill))
  const topics = searchTopics(query)
  const hasQuery = Boolean(query.trim())
  const caseById = (id) => CASES.find((item) => item.id === id)

  return <section className="library" aria-labelledby="library-title">
    <p className="kicker">Case library</p>
    <h1 id="library-title">Choose how to practise.</h1>
    <p className="library-intro">Search local teaching topics for guided help, or enter a neutral unseen assessment. Topic content and search remain available offline.</p>

    <section className="topic-search" aria-labelledby="topic-search-title">
      <h2 id="topic-search-title">What would you like to learn?</h2>
      <label htmlFor="topic-query">Search ECG topics</label>
      <input id="topic-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “slow heart rate”, “NSR”, or “rhythm”" autoComplete="off" />
      <div className="search-status" role="status" aria-live="polite" aria-atomic="true">{hasQuery ? topics.length ? `${topics.length} matching topic${topics.length === 1 ? '' : 's'}.` : `No local topic or case matches “${query.trim()}”.` : 'Enter a topic or common synonym to find guided practice.'}</div>
      {hasQuery && topics.length > 0 && <div className="topic-results">{topics.map((topic) => {
        const topicCases = topic.caseIds.map(caseById).filter(Boolean)
        const source = CASE_SOURCES[topic.sourceKey]
        return <article className="topic-card" key={topic.id}>
          <h3>{topic.name}</h3>
          <p>{topic.explanation}</p>
          <p className="topic-source">Source: <a href={source.url} target="_blank" rel="noreferrer">{source.title} (internet required)</a>. This explanation remains available offline.</p>
          {topicCases.length ? <div className="topic-actions">{topicCases.map((caseData) => <button type="button" className="secondary-button" key={caseData.id} onClick={() => onSelect(caseData.id, 'guided')}>Practise this topic · {caseData.number}</button>)}</div> : <p className="no-match">No existing case is available for this topic.</p>}
        </article>
      })}</div>}
    </section>

    <section className="guided-browser" aria-labelledby="guided-browser-title">
      <h2 id="guided-browser-title">Browse guided practice</h2>
      <label className="skill-filter" htmlFor="skill-filter">I want to practise <select id="skill-filter" value={skill} onChange={(event) => setSkill(event.target.value)}>{SKILLS.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
      <div className="case-grid">{matching.map((caseData) => <article className="case-tile" key={caseData.id}><p className="case-number">{caseData.number}</p><h3>Interpret the tracing</h3><p>{caseData.libraryDescription}</p><button type="button" className="secondary-button" onClick={() => onSelect(caseData.id, 'guided')}>Start guided {caseData.number}</button></article>)}</div>
      {!matching.length && <p className="no-match">No existing case matches this skill.</p>}
    </section>

    <section className="assessment-library" aria-labelledby="assessment-title">
      <p className="kicker">Independent first attempt</p>
      <h2 id="assessment-title">Unseen assessment</h2>
      <p>Diagnosis and topic labels remain hidden until submission. Only the first assessment of an unseen case can change the prototype rating.</p>
      <div className="case-grid">{CASES.map((caseData) => {
        const attempts = progress.attempts.filter((attempt) => attempt.caseId === caseData.id)
        const seen = attempts.length > 0
        return <article className="case-tile" key={caseData.id}><p className="case-number">{caseData.number}</p><h3>Interpret the tracing</h3><p>{caseData.libraryDescription}</p><p className="case-meta">{seen ? `${attempts.length} attempt${attempts.length === 1 ? '' : 's'} recorded · answer key seen · practice only` : 'Unseen · rating eligible'}</p><button type="button" className="primary-button" onClick={() => onSelect(caseData.id, 'rated')}>{seen ? `Take practice assessment · ${caseData.number}` : `Start unseen assessment · ${caseData.number}`}</button></article>
      })}</div>
    </section>
  </section>
}

function ModeChooser({ answerKeySeen, onChoose }) {
  return <section className="mode-section" aria-labelledby="mode-title"><p className="kicker">Choose your approach</p><h2 id="mode-title">How would you like to practise?</h2><div className="mode-grid"><article><h3>Guided Practice</h3><p>Use hints and revise after feedback. Opening the answer key makes later attempts on this case practice-only.</p><button type="button" className="secondary-button" onClick={() => onChoose('guided')}>Start guided practice</button></article><article><h3>Rated Assessment</h3><p>Hints and answers stay hidden until submission. An unseen case can update the prototype rating once.</p>{answerKeySeen && <p className="mode-notice">Answer key already seen for this case. This attempt will be saved as practice.</p>}<button type="button" className="primary-button" onClick={() => onChoose('rated')}>{answerKeySeen ? 'Take practice assessment' : 'Start rated assessment'}</button></article></div></section>
}

function Guidance({ caseData, answers }) {
  const missed = caseData.questions.filter((question) => answers[question.id] !== question.answer).sort((a, b) => SCORING_CONFIG.cases[caseData.id].weights[b.id] - SCORING_CONFIG.cases[caseData.id].weights[a.id])
  if (!missed.length) return <aside className="guidance"><p className="kicker">Next practice area</p><h3>Reinforce rate and rhythm on another case.</h3><p>Your structured findings matched this key. Varying the rate helps test whether the method transfers. This is practice guidance, not proof of mastery.</p><a href={CASE_SOURCES.sinusRhythms.url} target="_blank" rel="noreferrer">Review sinus rhythms in NCBI Bookshelf</a></aside>
  const target = missed[0]; const source = CASE_SOURCES[target.resource]
  return <aside className="guidance"><p className="kicker">Recommended next practice area</p><h3>{target.label}</h3><p>Your {answers[target.id] === 'Not sure' ? '“Not sure” response' : 'response'} suggests another focused pass on {target.label.toLowerCase()}. Re-measure this feature before choosing another case. This is practice guidance, not proof of mastery.</p><a href={source.url} target="_blank" rel="noreferrer">Review: {source.title}</a></aside>
}

function InterpretationFeedback({ caseData, reasoning, storage }) {
  const [draft, setDraft] = useState(reasoning)
  const [reviewedText, setReviewedText] = useState(reasoning)
  const [flagState, setFlagState] = useState('idle')
  const feedback = checkInterpretation(reviewedText, caseData)
  const reviewRevision = () => { setReviewedText(draft); setFlagState('idle') }
  const flagFeedback = () => {
    const result = recordFeedbackFlag(storage, { caseId: caseData.id, interpretation: reviewedText, feedback: { status: feedback.status, clear: feedback.clear.map((item) => item.id), contradictions: feedback.contradictions.map((item) => item.id), uncertain: feedback.uncertain.map((item) => item.id), missing: feedback.missing }, createdAt: new Date().toISOString() })
    setFlagState(result.ok ? 'saved' : result.message)
  }
  return <section className="reasoning-review interpretation-feedback" aria-labelledby="interpretation-feedback-title">
    <p className="kicker">Automated practice feedback—may miss or misunderstand wording.</p>
    <h3 id="interpretation-feedback-title">About your interpretation</h3>
    {feedback.status === 'blank' ? <p>No written interpretation was entered. Try explaining how the rate, P waves, intervals, axis, and ST/T findings support your conclusion. There is no score or rating penalty.</p> : feedback.status === 'unrecognised' ? <p>I could not interpret this wording reliably. I have not marked any statement correct or contradictory; use the checklist below to review it yourself.</p> : <>
      {feedback.clear.length > 0 && <div><h4>Clearly stated findings</h4><ul>{feedback.clear.map((item) => <li key={item.id}><strong>{item.label}:</strong> the wording agrees with this case’s answer key.</li>)}</ul></div>}
      {feedback.contradictions.length > 0 && <div><h4>Possible contradictions</h4><ul>{feedback.contradictions.map((item) => <li key={item.id}><strong>{item.label}:</strong> “{item.evidence}” appears to conflict with this case’s answer key. Check the tracing and your intended negation.</li>)}</ul></div>}
      {feedback.uncertain.length > 0 && <div><h4>Uncertain statements</h4><ul>{feedback.uncertain.map((item) => <li key={item.id}><strong>{item.label}:</strong> “{item.evidence}” sounds tentative, so it was not counted as a clearly stated finding.</li>)}</ul></div>}
      {feedback.missing.length > 0 && <p><strong>Reasoning steps not clearly recognised:</strong> {feedback.missing.join(', ')}.</p>}
    </>}
    <details><summary>Self-review checklist</summary><ul>{feedback.checklist.map((item) => <li key={item}>{item}</li>)}</ul></details>
    <div className="example-interpretation"><h4>Example interpretation</h4><p>{feedback.example}</p></div>
    <label htmlFor={`interpretation-revision-${caseData.id}`}><strong>Revise your interpretation</strong><span>Reviewing revised wording does not create an attempt or change your score or rating.</span></label>
    <textarea id={`interpretation-revision-${caseData.id}`} rows="5" value={draft} onChange={(event) => setDraft(event.target.value)} />
    <div className="result-actions"><button type="button" className="secondary-button" onClick={reviewRevision}>Review revised interpretation</button><button type="button" className="text-button" onClick={flagFeedback} disabled={flagState === 'saved'}>{flagState === 'saved' ? 'Feedback flagged locally' : 'This feedback seems incorrect'}</button></div>
    {flagState !== 'idle' && <p className="notice" role="status">{flagState === 'saved' ? 'Flag saved only in this browser; no data was sent.' : flagState}</p>}
  </section>
}

function Results({ caseData, answers, reasoning, mode, attempt, storage, onRevise, onLibrary }) {
  const score = scoreAnswers(caseData.questions, answers, caseData.id)
  const headingRef = useRef(null)
  useEffect(() => { headingRef.current?.focus() }, [])
  return <section className="results" aria-labelledby="results-title"><div className="results-summary" role="status" aria-live="polite" aria-atomic="true"><p className="kicker">{caseData.diagnosis}</p><h2 id="results-title" ref={headingRef} tabIndex="-1">{score.percentage}% case score</h2><p>{score.earned} of {score.total} weighted points from structured answers. Free text is not scored.</p>{attempt.rated ? <div className="rating-result"><strong>Rating {attempt.ratingBefore} → {attempt.ratingAfter} ({attempt.ratingDelta >= 0 ? '+' : ''}{attempt.ratingDelta})</strong><p>Expected {attempt.expectedPercentage}% at rating {attempt.ratingBefore} versus case difficulty {SCORING_CONFIG.cases[caseData.id].difficulty}. The bounded prototype formula is documented below.</p></div> : <div className="practice-result"><strong>Recorded as practice</strong><p>{mode === 'guided' ? 'Guided Practice does not change the rating.' : 'This case’s answer key was already seen, so the rating is protected.'}</p></div>}<div className="result-actions">{mode === 'guided' && <button type="button" className="secondary-button" onClick={onRevise}>Revise answers</button>}<button type="button" className="secondary-button" onClick={onLibrary}>Return to case library</button></div></div><Guidance caseData={caseData} answers={answers} /><InterpretationFeedback caseData={caseData} reasoning={reasoning} storage={storage} /><div className="feedback-list">{caseData.questions.map((question) => { const correct = answers[question.id] === question.answer; return <article className={`feedback ${correct ? 'correct' : 'review'}`} key={question.id}><p className="feedback-status">{correct ? '✓ Matches' : '↻ Review'}</p><h3>{question.label} <span className="weight-label">{SCORING_CONFIG.cases[caseData.id].weights[question.id]} points</span></h3><p><strong>Your answer:</strong> {answers[question.id] || 'Not answered'}</p><p><strong>Correct finding:</strong> {question.answer}</p><p>{question.explanation}</p></article> })}</div><Sources caseData={caseData} /></section>
}

function Practice({ onActiveAttempt }) {
  let storage = null; let storageAccessMessage = ''
  try { storage = typeof window === 'undefined' ? null : window.localStorage } catch { storageAccessMessage = 'Browser storage is unavailable. You can continue, but progress will not persist.' }
  const loaded = storageAccessMessage ? { progress: emptyProgress(), message: storageAccessMessage } : loadProgress(storage)
  const [progress, setProgress] = useState(loaded.progress); const [storageMessage, setStorageMessage] = useState(loaded.message || '')
  const [caseId, setCaseId] = useState(null); const [mode, setMode] = useState(null); const [answers, setAnswers] = useState({}); const [hints, setHints] = useState({}); const [reasoning, setReasoning] = useState(''); const [submitted, setSubmitted] = useState(false); const [resultAttempt, setResultAttempt] = useState(null); const [attemptId, setAttemptId] = useState(makeAttemptId)
  const caseData = CASES.find((item) => item.id === caseId)
  useEffect(() => { onActiveAttempt(Boolean(caseData && mode && !submitted)); return () => onActiveAttempt(false) }, [caseData, mode, submitted, onActiveAttempt])
  const selectCase = (id, selectedMode = null) => { setCaseId(id); setMode(selectedMode); setSubmitted(false); setAnswers({}); setHints({}); setReasoning(''); setResultAttempt(null); setAttemptId(makeAttemptId()); window.scrollTo({ top: 0 }) }
  const startMode = (selectedMode) => { setMode(selectedMode); setAnswers({}); setHints({}); setReasoning(''); setSubmitted(false); setResultAttempt(null); setAttemptId(makeAttemptId()); setTimeout(() => document.querySelector('.case-form')?.scrollIntoView({ behavior: 'smooth' }), 0) }
  const submit = (event) => { event.preventDefault(); if (submitted) return; const score = scoreAnswers(caseData.questions, answers, caseData.id); const correctness = Object.fromEntries(caseData.questions.map((question) => [question.id, answers[question.id] === question.answer])); const recorded = recordAttempt(progress, { id: attemptId, caseId: caseData.id, mode, percentage: score.percentage, earned: score.earned, total: score.total, correctness, createdAt: new Date().toISOString() }); setProgress(recorded.progress); setResultAttempt(recorded.attempt); setSubmitted(true); const saved = saveProgress(storage, recorded.progress); if (!saved.ok) setStorageMessage(saved.message); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const revise = () => { setSubmitted(false); setAttemptId(makeAttemptId()); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const reset = () => { const result = resetProgress(storage); setProgress(result.progress); setStorageMessage(result.message || 'Progress reset on this device.'); setCaseId(null); setMode(null); setSubmitted(false) }
  const answerKeySeen = caseData && progress.attempts.some((attempt) => attempt.caseId === caseData.id)
  return <main className="case-page"><a className="back-link" href="#home"><span aria-hidden="true">←</span> Back to home</a><ProgressPanel progress={progress} storageMessage={storageMessage} onReset={reset} />{!caseData ? <CaseLibrary progress={progress} onSelect={selectCase} /> : <><button type="button" className="back-link button-link" onClick={() => setCaseId(null)}><span aria-hidden="true">←</span> Case library</button><header className="case-header"><div><p className="kicker">{caseData.number} · Foundations</p><h1>Read the ECG systematically.</h1></div><p>The diagnosis remains hidden until you submit. Check rate, sinus origin, intervals, axis, and ST/T findings.</p></header><EcgPanel caseData={caseData} />{!mode ? <ModeChooser answerKeySeen={answerKeySeen} onChoose={startMode} /> : submitted && resultAttempt ? <Results caseData={caseData} answers={answers} reasoning={reasoning} mode={mode} attempt={resultAttempt} storage={storage} onRevise={revise} onLibrary={() => setCaseId(null)} /> : <form className="case-form" onSubmit={submit}><div className="form-intro"><p className="kicker">{mode === 'rated' ? 'Rated Assessment' : 'Guided Practice'}</p><h2>What do you see?</h2><p>{mode === 'rated' ? 'Hints and answers remain hidden until submission.' : 'Hints are available and revision carries no rating penalty.'} Choose “Not sure” whenever needed.</p></div><div className="question-grid">{caseData.questions.map((question) => <Question key={question.id} question={question} value={answers[question.id] || ''} onChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))} hintShown={Boolean(hints[question.id])} onHint={(id) => setHints((current) => ({ ...current, [id]: !current[id] }))} hintsAllowed={mode === 'guided'} />)}</div><div className="explanation-card"><label htmlFor="reasoning"><strong>Explain your interpretation</strong><span>This free text is not scored.</span></label><textarea id="reasoning" rows="6" value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="I think this ECG shows… because…" /></div><div className="submit-row"><p>Only structured answers contribute to the weighted percentage.</p><button className="primary-button" type="submit">Submit {mode === 'rated' ? 'assessment' : 'practice'} <span aria-hidden="true">→</span></button></div></form>}</>}<details className="scoring-details"><summary>How scoring is configured</summary><p>These are provisional educational weights, not clinically validated measures of competence.</p><table><thead><tr><th>Skill</th><th>Weight</th><th>Rationale</th></tr></thead><tbody>{WEIGHT_RATIONALE.map(([skill, weight, rationale]) => <tr key={skill}><td>{skill}</td><td>{weight}%</td><td>{rationale}</td></tr>)}</tbody></table></details></main>
}

export default function App() {
  const getPage = () => window.location.hash === '#practice' ? 'practice' : 'home'; const [page, setPage] = useState(getPage)
  const [activeAttempt, setActiveAttempt] = useState(false)
  useEffect(() => { const handleHashChange = () => setPage(getPage()); window.addEventListener('hashchange', handleHashChange); return () => window.removeEventListener('hashchange', handleHashChange) }, [])
  return <div className="site-shell"><a className="skip-link" href="#main-content">Skip to main content</a><header className="site-header"><a className="brand" href="#home" aria-label="Tete home"><span aria-hidden="true">T</span>Tete</a><p>ECG learning, thoughtfully guided.</p></header><PwaStatus activeAttempt={activeAttempt} /><div id="main-content" tabIndex="-1">{page === 'practice' ? <Practice onActiveAttempt={setActiveAttempt} /> : <Home />}</div><footer><p>For education only. Not for clinical diagnosis. <span className="app-version">Build {__TETE_VERSION__}</span></p></footer></div>
}
